from django.db import transaction
from django.utils import timezone
from ..models import (
    TransferOrder, TransferStatus, TransferItem,
    ProductStatus, Inventory, Role
)
from ..exceptions import (
    StatusConflictException, ValidationFailedException,
    PermissionDeniedException, InventoryShortageException,
    ProductDelistedException
)
from .audit_service import AuditService
from .inventory_service import InventoryService
import logging

logger = logging.getLogger(__name__)


class TransferService:
    """调拨单服务 - 状态机流转、跨店库存联动"""

    STATUS_TRANSITIONS = {
        TransferStatus.DRAFT: [TransferStatus.SUBMITTED, TransferStatus.CANCELLED],
        TransferStatus.SUBMITTED: [
            TransferStatus.OUT_REVIEW, TransferStatus.OUT_CONFIRMED,
            TransferStatus.OUT_REJECTED, TransferStatus.CANCELLED
        ],
        TransferStatus.OUT_REVIEW: [
            TransferStatus.OUT_CONFIRMED, TransferStatus.OUT_REJECTED,
            TransferStatus.CANCELLED
        ],
        TransferStatus.OUT_REJECTED: [],
        TransferStatus.OUT_CONFIRMED: [TransferStatus.IN_REVIEW, TransferStatus.CANCELLED],
        TransferStatus.IN_REVIEW: [
            TransferStatus.COMPLETED, TransferStatus.IN_REJECTED
        ],
        TransferStatus.IN_REJECTED: [],
        TransferStatus.COMPLETED: [],
        TransferStatus.CANCELLED: [],
    }

    @classmethod
    def _validate_status_transition(cls, order, target_status):
        allowed = cls.STATUS_TRANSITIONS.get(order.status, [])
        if target_status not in allowed:
            raise StatusConflictException(
                detail=f'无法从状态【{order.get_status_display()}】变更为【{dict(TransferStatus.choices)[target_status]}】'
            )

    @classmethod
    def _validate_items(cls, order):
        items = order.items.all()
        if not items.exists():
            raise ValidationFailedException(detail='调拨单至少需要一条明细')

        for item in items:
            if item.product.status != ProductStatus.LISTED:
                raise ProductDelistedException(
                    detail=f'商品【{item.product.name}】未上架，无法调拨'
                )
            if item.transfer_quantity <= 0:
                raise ValidationFailedException(
                    detail=f'商品【{item.product.name}】调拨数量必须大于0'
                )

            inv = InventoryService.get_inventory(order.from_store, item.product)
            if inv.available_quantity < item.transfer_quantity:
                raise InventoryShortageException(
                    detail=f'门店【{order.from_store.name}】商品【{item.product.name}】'
                           f'可用库存不足，当前可用: {inv.available_quantity}, 需要: {item.transfer_quantity}'
                )

    @classmethod
    @transaction.atomic
    def submit(cls, order, user, request=None):
        """提交调拨单"""
        cls._validate_status_transition(order, TransferStatus.SUBMITTED)

        role = getattr(user.profile, 'role', None)
        if role not in [Role.STORE_MANAGER, Role.PLANNER]:
            raise PermissionDeniedException(detail='只有店长或企划专员可以提交调拨单')

        if role == Role.STORE_MANAGER:
            user_store = getattr(user.profile, 'store', None)
            if user_store != order.from_store and user_store != order.to_store:
                raise PermissionDeniedException(detail='只能提交本店相关的调拨单')

        if order.from_store == order.to_store:
            raise ValidationFailedException(detail='转出门店和转入门店不能相同')

        cls._validate_items(order)

        old_status = order.status
        order.status = TransferStatus.SUBMITTED
        order.submitted_by = user
        order.submitted_at = timezone.now()
        order.save()

        AuditService.log_status_change(user, order, old_status, order.status, request)
        logger.info(f'Transfer order {order.code} submitted by {user.username}')

        order.status = TransferStatus.OUT_REVIEW
        order.save()
        AuditService.log_status_change(user, order, TransferStatus.SUBMITTED, order.status, request)
        logger.info(f'Transfer order {order.code} moved to out_review automatically')

        return order

    @classmethod
    @transaction.atomic
    def out_confirm(cls, order, user, out_items=None, request=None):
        """转出确认"""
        if order.status == TransferStatus.SUBMITTED:
            cls._validate_status_transition(order, TransferStatus.OUT_REVIEW)
            order.status = TransferStatus.OUT_REVIEW
            order.save()

        cls._validate_status_transition(order, TransferStatus.OUT_CONFIRMED)

        role = getattr(user.profile, 'role', None)
        if role != Role.STORE_MANAGER:
            raise PermissionDeniedException(detail='只有店长可以确认转出')

        if user.profile.store != order.from_store:
            raise PermissionDeniedException(detail='只能确认本门店的转出')

        for item in order.items.all():
            out_qty = item.transfer_quantity
            if out_items and str(item.id) in out_items:
                actual_out = out_items[str(item.id)].get('out_quantity')
                if actual_out is not None:
                    if actual_out < 0:
                        raise ValidationFailedException(detail='转出数量不能为负数')
                    if actual_out > item.transfer_quantity:
                        raise ValidationFailedException(
                            detail=f'商品【{item.product.name}】转出数量不能超过调拨数量'
                        )
                    if actual_out < item.transfer_quantity:
                        raise ValidationFailedException(
                            detail=f'商品【{item.product.name}】转出数量不足，请先取消并重新提交'
                        )
                    out_qty = actual_out

            InventoryService.reserve_stock(
                store=order.from_store,
                product=item.product,
                quantity=out_qty,
                reason=f'调拨单{order.code}转出预留'
            )

            inv = InventoryService.get_inventory(order.from_store, item.product)
            if inv.available_quantity < out_qty:
                raise InventoryShortageException(
                    detail=f'商品【{item.product.name}】库存不足，无法转出'
                )

            item.out_quantity = out_qty
            item.save()

        old_status = order.status
        order.status = TransferStatus.OUT_CONFIRMED
        order.out_confirmed_by = user
        order.out_confirmed_at = timezone.now()
        order.save()

        AuditService.log_status_change(user, order, old_status, order.status, request)
        logger.info(f'Transfer order {order.code} out confirmed by {user.username}')

        cls._validate_status_transition(order, TransferStatus.IN_REVIEW)
        order.status = TransferStatus.IN_REVIEW
        order.save()
        AuditService.log_status_change(user, order, TransferStatus.OUT_CONFIRMED, order.status, request)

        return order

    @classmethod
    @transaction.atomic
    def out_reject(cls, order, user, reason, request=None):
        """转出拒绝"""
        if order.status == TransferStatus.SUBMITTED:
            cls._validate_status_transition(order, TransferStatus.OUT_REVIEW)
            order.status = TransferStatus.OUT_REVIEW
            order.save()

        cls._validate_status_transition(order, TransferStatus.OUT_REJECTED)

        role = getattr(user.profile, 'role', None)
        if role != Role.STORE_MANAGER:
            raise PermissionDeniedException(detail='只有店长可以拒绝转出')

        if user.profile.store != order.from_store:
            raise PermissionDeniedException(detail='只能拒绝本门店的转出')

        if not reason or not reason.strip():
            raise ValidationFailedException(detail='拒绝原因不能为空')

        old_status = order.status
        order.status = TransferStatus.OUT_REJECTED
        order.reject_reason = reason
        order.out_confirmed_by = user
        order.out_confirmed_at = timezone.now()
        order.save()

        AuditService.log_status_change(user, order, old_status, order.status, request, reason)
        logger.info(f'Transfer order {order.code} out rejected by {user.username}: {reason}')
        return order

    @classmethod
    @transaction.atomic
    def in_confirm(cls, order, user, in_items=None, request=None):
        """转入确认"""
        cls._validate_status_transition(order, TransferStatus.COMPLETED)

        role = getattr(user.profile, 'role', None)
        if role != Role.STORE_MANAGER:
            raise PermissionDeniedException(detail='只有店长可以确认转入')

        if user.profile.store != order.to_store:
            raise PermissionDeniedException(detail='只能确认本门店的转入')

        for item in order.items.all():
            out_qty = item.out_quantity or item.transfer_quantity
            in_qty = out_qty
            if in_items and str(item.id) in in_items:
                actual_in = in_items[str(item.id)].get('in_quantity')
                if actual_in is not None:
                    if actual_in < 0:
                        raise ValidationFailedException(detail='转入数量不能为负数')
                    if actual_in > out_qty:
                        raise ValidationFailedException(
                            detail=f'商品【{item.product.name}】转入数量不能超过转出数量'
                        )
                    in_qty = actual_in

            item.in_quantity = in_qty
            item.save()

            InventoryService.transfer(
                from_store=order.from_store,
                to_store=order.to_store,
                product=item.product,
                quantity=in_qty,
                reserved_quantity=out_qty,
                reason=f'调拨单{order.code}'
            )

        old_status = order.status
        order.status = TransferStatus.COMPLETED
        order.in_confirmed_by = user
        order.in_confirmed_at = timezone.now()
        order.completed_at = timezone.now()
        order.save()

        AuditService.log_status_change(user, order, old_status, order.status, request)
        logger.info(f'Transfer order {order.code} completed by {user.username}')
        return order

    @classmethod
    @transaction.atomic
    def in_reject(cls, order, user, reason, request=None):
        """转入拒绝 - 需要退回库存"""
        cls._validate_status_transition(order, TransferStatus.IN_REJECTED)

        role = getattr(user.profile, 'role', None)
        if role != Role.STORE_MANAGER:
            raise PermissionDeniedException(detail='只有店长可以拒绝转入')

        if user.profile.store != order.to_store:
            raise PermissionDeniedException(detail='只能拒绝本门店的转入')

        if not reason or not reason.strip():
            raise ValidationFailedException(detail='拒绝原因不能为空')

        for item in order.items.all():
            out_qty = item.out_quantity or item.transfer_quantity
            InventoryService.cancel_reservation(
                store=order.from_store,
                product=item.product,
                quantity=out_qty,
                reason=f'调拨单{order.code}转入拒绝，释放预留'
            )

        old_status = order.status
        order.status = TransferStatus.IN_REJECTED
        order.reject_reason = reason
        order.in_confirmed_by = user
        order.in_confirmed_at = timezone.now()
        order.save()

        AuditService.log_status_change(user, order, old_status, order.status, request, reason)
        logger.info(f'Transfer order {order.code} in rejected by {user.username}: {reason}')
        return order

    @classmethod
    @transaction.atomic
    def cancel(cls, order, user, reason='', request=None):
        """取消调拨单"""
        cls._validate_status_transition(order, TransferStatus.CANCELLED)

        role = getattr(user.profile, 'role', None)
        user_store = getattr(user.profile, 'store', None)

        if role == Role.STORE_MANAGER:
            if user_store not in [order.from_store, order.to_store]:
                raise PermissionDeniedException(detail='只能取消本店相关的调拨单')
            if order.status not in [TransferStatus.DRAFT, TransferStatus.SUBMITTED]:
                raise PermissionDeniedException(detail='当前状态不允许取消')

        if order.status == TransferStatus.OUT_CONFIRMED:
            for item in order.items.all():
                out_qty = item.out_quantity or item.transfer_quantity
                InventoryService.cancel_reservation(
                    store=order.from_store,
                    product=item.product,
                    quantity=out_qty,
                    reason=f'调拨单{order.code}取消，释放预留'
                )

        old_status = order.status
        order.status = TransferStatus.CANCELLED
        order.cancelled_by = user
        order.cancelled_at = timezone.now()
        order.save()

        AuditService.log_status_change(user, order, old_status, order.status, request, reason)
        logger.info(f'Transfer order {order.code} cancelled by {user.username}: {reason}')
        return order

    @classmethod
    def generate_code(cls):
        """生成调拨单号"""
        today = timezone.localdate().strftime('%Y%m%d')
        prefix = f'TF{today}'
        last = TransferOrder.objects.filter(code__startswith=prefix).order_by('-code').first()
        if last:
            try:
                seq = int(last.code[-4:]) + 1
            except (ValueError, IndexError):
                seq = 1
        else:
            seq = 1
        return f'{prefix}{seq:04d}'

    @classmethod
    def get_available_actions(cls, order, user):
        """获取当前用户可执行的操作"""
        actions = []
        role = getattr(user.profile, 'role', None)
        user_store = getattr(user.profile, 'store', None)

        if order.status == TransferStatus.DRAFT:
            if role in [Role.STORE_MANAGER, Role.PLANNER]:
                if role != Role.STORE_MANAGER or user_store in [order.from_store, order.to_store]:
                    actions.append({'key': 'submit', 'label': '提交', 'method': 'POST'})
                if role != Role.STORE_MANAGER or user_store in [order.from_store, order.to_store]:
                    actions.append({'key': 'cancel', 'label': '取消', 'method': 'POST'})

        if order.status == TransferStatus.SUBMITTED:
            if role == Role.STORE_MANAGER and user_store == order.from_store:
                actions.append({'key': 'out_confirm', 'label': '确认转出', 'method': 'POST'})
                actions.append({'key': 'out_reject', 'label': '拒绝转出', 'method': 'POST'})
            if role in [Role.STORE_MANAGER, Role.PLANNER, Role.WAREHOUSE]:
                if role != Role.STORE_MANAGER or user_store in [order.from_store, order.to_store]:
                    actions.append({'key': 'cancel', 'label': '取消', 'method': 'POST'})

        if order.status == TransferStatus.OUT_REVIEW:
            if role == Role.STORE_MANAGER and user_store == order.from_store:
                actions.append({'key': 'out_confirm', 'label': '确认转出', 'method': 'POST'})
                actions.append({'key': 'out_reject', 'label': '拒绝转出', 'method': 'POST'})

        if order.status == TransferStatus.OUT_CONFIRMED:
            if role == Role.STORE_MANAGER and user_store == order.to_store:
                actions.append({'key': 'in_confirm', 'label': '确认转入', 'method': 'POST'})
                actions.append({'key': 'in_reject', 'label': '拒绝转入', 'method': 'POST'})

        if order.status == TransferStatus.IN_REVIEW:
            if role == Role.STORE_MANAGER and user_store == order.to_store:
                actions.append({'key': 'in_confirm', 'label': '确认转入', 'method': 'POST'})
                actions.append({'key': 'in_reject', 'label': '拒绝转入', 'method': 'POST'})

        return actions
