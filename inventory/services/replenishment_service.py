from django.db import transaction
from django.utils import timezone
from ..models import (
    ReplenishmentOrder, ReplenishmentStatus, ReplenishmentItem,
    ProductStatus, Inventory, Role
)
from ..exceptions import (
    StatusConflictException, ValidationFailedException,
    PermissionDeniedException, InventoryShortageException,
    ProductDelistedException, DataDeviationException
)
from .audit_service import AuditService
from .inventory_service import InventoryService
import logging

logger = logging.getLogger(__name__)


class ReplenishmentService:
    """补货单服务 - 状态机流转、业务校验、库存联动"""

    STATUS_TRANSITIONS = {
        ReplenishmentStatus.DRAFT: [ReplenishmentStatus.SUBMITTED, ReplenishmentStatus.CANCELLED],
        ReplenishmentStatus.SUBMITTED: [
            ReplenishmentStatus.REVIEWING, ReplenishmentStatus.REJECTED,
            ReplenishmentStatus.CANCELLED
        ],
        ReplenishmentStatus.REVIEWING: [
            ReplenishmentStatus.PROCESSING, ReplenishmentStatus.REJECTED,
            ReplenishmentStatus.CANCELLED
        ],
        ReplenishmentStatus.REJECTED: [],
        ReplenishmentStatus.PROCESSING: [ReplenishmentStatus.SHIPPED],
        ReplenishmentStatus.SHIPPED: [ReplenishmentStatus.RECEIVED],
        ReplenishmentStatus.RECEIVED: [ReplenishmentStatus.COMPLETED],
        ReplenishmentStatus.COMPLETED: [],
        ReplenishmentStatus.CANCELLED: [],
    }

    @classmethod
    def _validate_status_transition(cls, order, target_status):
        allowed = cls.STATUS_TRANSITIONS.get(order.status, [])
        if target_status not in allowed:
            raise StatusConflictException(
                detail=f'无法从状态【{order.get_status_display()}】变更为【{dict(ReplenishmentStatus.choices)[target_status]}】'
            )

    @classmethod
    def _validate_items(cls, order):
        items = order.items.all()
        if not items.exists():
            raise ValidationFailedException(detail='补货单至少需要一条明细')

        for item in items:
            if item.product.status != ProductStatus.LISTED:
                raise ProductDelistedException(
                    detail=f'商品【{item.product.name}】未上架，无法补货'
                )
            if item.requested_quantity <= 0:
                raise ValidationFailedException(
                    detail=f'商品【{item.product.name}】申请数量必须大于0'
                )

    @classmethod
    @transaction.atomic
    def submit(cls, order, user, request=None):
        cls._validate_status_transition(order, ReplenishmentStatus.SUBMITTED)

        role = getattr(user.profile, 'role', None)
        if role == Role.STORE_MANAGER:
            if user.profile.store != order.store:
                raise PermissionDeniedException(detail='只能提交本门店的补货单')

        cls._validate_items(order)

        old_status = order.status
        order.status = ReplenishmentStatus.SUBMITTED
        order.submitted_by = user
        order.submitted_at = timezone.now()
        order.save()

        for item in order.items.all():
            item.unit_price = item.product.cost_price
            item.save()

        AuditService.log_status_change(user, order, old_status, order.status, request)
        logger.info(f'Replenishment order {order.code} submitted by {user.username}')
        return order

    @classmethod
    @transaction.atomic
    def review(cls, order, user, request=None, approved_items=None):
        cls._validate_status_transition(order, ReplenishmentStatus.PROCESSING)

        role = getattr(user.profile, 'role', None)
        if role != Role.WAREHOUSE:
            raise PermissionDeniedException(detail='只有仓管可以审核补货单')

        cls._validate_items(order)

        for item in order.items.all():
            if approved_items and str(item.id) in approved_items:
                approved_qty = approved_items[str(item.id)].get('approved_quantity')
                if approved_qty is not None:
                    if approved_qty < 0:
                        raise ValidationFailedException(detail='批准数量不能为负数')
                    item.approved_quantity = approved_qty
                else:
                    item.approved_quantity = item.requested_quantity
            else:
                item.approved_quantity = item.requested_quantity
            item.save()

        old_status = order.status
        order.status = ReplenishmentStatus.PROCESSING
        order.reviewed_by = user
        order.reviewed_at = timezone.now()
        order.save()

        AuditService.log_status_change(user, order, old_status, order.status, request)
        logger.info(f'Replenishment order {order.code} reviewed by {user.username}')
        return order

    @classmethod
    @transaction.atomic
    def reject(cls, order, user, reason, request=None):
        cls._validate_status_transition(order, ReplenishmentStatus.REJECTED)

        role = getattr(user.profile, 'role', None)
        if role != Role.WAREHOUSE:
            raise PermissionDeniedException(detail='只有仓管可以驳回补货单')

        if not reason or not reason.strip():
            raise ValidationFailedException(detail='驳回原因不能为空')

        old_status = order.status
        order.status = ReplenishmentStatus.REJECTED
        order.reject_reason = reason
        order.reviewed_by = user
        order.reviewed_at = timezone.now()
        order.save()

        AuditService.log_status_change(user, order, old_status, order.status, request, reason)
        logger.info(f'Replenishment order {order.code} rejected by {user.username}: {reason}')
        return order

    @classmethod
    @transaction.atomic
    def ship(cls, order, user, shipped_items=None, tracking_no=None, request=None):
        cls._validate_status_transition(order, ReplenishmentStatus.SHIPPED)

        role = getattr(user.profile, 'role', None)
        if role != Role.WAREHOUSE:
            raise PermissionDeniedException(detail='只有仓管可以发货')

        for item in order.items.all():
            if shipped_items and str(item.id) in shipped_items:
                shipped_qty = shipped_items[str(item.id)].get('shipped_quantity')
                if shipped_qty is not None:
                    if shipped_qty < 0:
                        raise ValidationFailedException(detail='实发数量不能为负数')
                    if shipped_qty > (item.approved_quantity or item.requested_quantity):
                        raise ValidationFailedException(
                            detail=f'商品【{item.product.name}】实发数量不能超过批准数量'
                        )
                    item.shipped_quantity = shipped_qty
                else:
                    item.shipped_quantity = item.approved_quantity or item.requested_quantity
            else:
                item.shipped_quantity = item.approved_quantity or item.requested_quantity

            InventoryService.reserve_stock(
                store=None,
                product=item.product,
                quantity=item.shipped_quantity,
                reason=f'补货单{order.code}发货预留'
            )
            item.save()

        old_status = order.status
        order.status = ReplenishmentStatus.SHIPPED
        order.tracking_no = tracking_no or order.tracking_no
        order.shipped_by = user
        order.shipped_at = timezone.now()
        order.save()

        AuditService.log_status_change(user, order, old_status, order.status, request)
        logger.info(f'Replenishment order {order.code} shipped by {user.username}')
        return order

    @classmethod
    @transaction.atomic
    def receive(cls, order, user, received_items=None, request=None):
        cls._validate_status_transition(order, ReplenishmentStatus.RECEIVED)

        role = getattr(user.profile, 'role', None)
        if role != Role.STORE_MANAGER:
            raise PermissionDeniedException(detail='只有店长可以收货')

        if user.profile.store != order.store:
            raise PermissionDeniedException(detail='只能接收本门店的补货单')

        has_deviation = False
        deviation_details = []

        for item in order.items.all():
            shipped_qty = item.shipped_quantity or 0
            if received_items and str(item.id) in received_items:
                received_qty = received_items[str(item.id)].get('received_quantity')
                if received_qty is not None:
                    if received_qty < 0:
                        raise ValidationFailedException(detail='实收数量不能为负数')
                    if received_qty > shipped_qty:
                        raise ValidationFailedException(
                            detail=f'商品【{item.product.name}】实收数量不能超过实发数量'
                        )
                    item.received_quantity = received_qty
                else:
                    item.received_quantity = shipped_qty
            else:
                item.received_quantity = shipped_qty

            if item.received_quantity != shipped_qty:
                has_deviation = True
                deviation_details.append(
                    f'{item.product.name}: 实发{shipped_qty}, 实收{item.received_quantity}'
                )

            InventoryService.release_reserved_and_add(
                store=order.store,
                product=item.product,
                reserved_quantity=shipped_qty,
                add_quantity=item.received_quantity,
                reason=f'补货单{order.code}收货'
            )
            item.save()

        old_status = order.status
        order.status = ReplenishmentStatus.RECEIVED
        order.received_by = user
        order.received_at = timezone.now()
        order.save()

        change_message = ''
        if has_deviation:
            change_message = '收货存在数量偏差: ' + '; '.join(deviation_details)

        AuditService.log_status_change(user, order, old_status, order.status, request, change_message)
        logger.info(f'Replenishment order {order.code} received by {user.username}')

        if has_deviation:
            raise DataDeviationException(
                detail='收货数量与实发数量存在偏差，请核对后确认完成',
                code='receipt_deviation'
            )

        return order

    @classmethod
    @transaction.atomic
    def complete(cls, order, user, request=None):
        if order.status not in [ReplenishmentStatus.RECEIVED]:
            raise StatusConflictException(
                detail=f'当前状态【{order.get_status_display()}】无法完成'
            )

        role = getattr(user.profile, 'role', None)
        if role not in [Role.WAREHOUSE, Role.PLANNER]:
            raise PermissionDeniedException(detail='只有仓管或企划专员可以完成补货单')

        old_status = order.status
        order.status = ReplenishmentStatus.COMPLETED
        order.completed_at = timezone.now()
        order.save()

        AuditService.log_status_change(user, order, old_status, order.status, request)
        logger.info(f'Replenishment order {order.code} completed by {user.username}')
        return order

    @classmethod
    @transaction.atomic
    def cancel(cls, order, user, reason='', request=None):
        cls._validate_status_transition(order, ReplenishmentStatus.CANCELLED)

        role = getattr(user.profile, 'role', None)
        if role == Role.STORE_MANAGER:
            if user.profile.store != order.store or order.status not in [
                ReplenishmentStatus.DRAFT, ReplenishmentStatus.SUBMITTED
            ]:
                raise PermissionDeniedException(detail='无权取消此补货单')

        if role == Role.WAREHOUSE and order.status not in [
            ReplenishmentStatus.SUBMITTED, ReplenishmentStatus.REVIEWING
        ]:
            raise PermissionDeniedException(detail='当前状态不允许取消')

        if order.status in [ReplenishmentStatus.PROCESSING, ReplenishmentStatus.SHIPPED]:
            for item in order.items.all():
                if item.shipped_quantity and item.shipped_quantity > 0:
                    InventoryService.cancel_reservation(
                        store=None,
                        product=item.product,
                        quantity=item.shipped_quantity,
                        reason=f'补货单{order.code}取消，释放预留'
                    )

        old_status = order.status
        order.status = ReplenishmentStatus.CANCELLED
        order.cancelled_by = user
        order.cancelled_at = timezone.now()
        order.save()

        AuditService.log_status_change(user, order, old_status, order.status, request, reason)
        logger.info(f'Replenishment order {order.code} cancelled by {user.username}: {reason}')
        return order

    @classmethod
    def generate_code(cls):
        today = timezone.localdate().strftime('%Y%m%d')
        prefix = f'RP{today}'
        last = ReplenishmentOrder.objects.filter(code__startswith=prefix).order_by('-code').first()
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
        actions = []
        role = getattr(user.profile, 'role', None)
        user_store = getattr(user.profile, 'store', None)

        if order.status == ReplenishmentStatus.DRAFT:
            if role in [Role.STORE_MANAGER, Role.PLANNER]:
                if role != Role.STORE_MANAGER or user_store == order.store:
                    actions.append({'key': 'submit', 'label': '提交', 'method': 'POST'})
            if role in [Role.STORE_MANAGER, Role.PLANNER, Role.WAREHOUSE]:
                if role != Role.STORE_MANAGER or user_store == order.store:
                    actions.append({'key': 'cancel', 'label': '取消', 'method': 'POST'})

        if order.status == ReplenishmentStatus.SUBMITTED and role == Role.WAREHOUSE:
            actions.append({'key': 'review', 'label': '审核', 'method': 'POST'})
            actions.append({'key': 'reject', 'label': '驳回', 'method': 'POST'})
            actions.append({'key': 'cancel', 'label': '取消', 'method': 'POST'})

        if order.status == ReplenishmentStatus.REVIEWING and role == Role.WAREHOUSE:
            actions.append({'key': 'reject', 'label': '驳回', 'method': 'POST'})
            actions.append({'key': 'ship', 'label': '发货', 'method': 'POST'})
            actions.append({'key': 'cancel', 'label': '取消', 'method': 'POST'})

        if order.status == ReplenishmentStatus.PROCESSING and role == Role.WAREHOUSE:
            actions.append({'key': 'ship', 'label': '发货', 'method': 'POST'})

        if order.status == ReplenishmentStatus.SHIPPED:
            if role == Role.STORE_MANAGER and user_store == order.store:
                actions.append({'key': 'receive', 'label': '收货', 'method': 'POST'})

        if order.status == ReplenishmentStatus.RECEIVED and role in [Role.WAREHOUSE, Role.PLANNER]:
            actions.append({'key': 'complete', 'label': '完成', 'method': 'POST'})

        return actions
