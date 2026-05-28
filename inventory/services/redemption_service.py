from django.db import transaction
from django.utils import timezone
from ..models import MemberRedemption, RedemptionStatus, ProductStatus, Role
from ..exceptions import (
    StatusConflictException, ValidationFailedException,
    PermissionDeniedException, InventoryShortageException,
    ProductDelistedException
)
from .audit_service import AuditService
from .inventory_service import InventoryService
import logging

logger = logging.getLogger(__name__)


class RedemptionService:
    """会员兑换服务"""

    STATUS_TRANSITIONS = {
        RedemptionStatus.PENDING: [
            RedemptionStatus.PROCESSING, RedemptionStatus.REJECTED,
            RedemptionStatus.CANCELLED
        ],
        RedemptionStatus.PROCESSING: [
            RedemptionStatus.SHIPPED, RedemptionStatus.CANCELLED
        ],
        RedemptionStatus.SHIPPED: [RedemptionStatus.COMPLETED],
        RedemptionStatus.COMPLETED: [],
        RedemptionStatus.REJECTED: [],
        RedemptionStatus.CANCELLED: [],
    }

    @classmethod
    def _validate_status_transition(cls, redemption, target_status):
        allowed = cls.STATUS_TRANSITIONS.get(redemption.status, [])
        if target_status not in allowed:
            raise StatusConflictException(
                detail=f'无法从状态【{redemption.get_status_display()}】变更为【{dict(RedemptionStatus.choices)[target_status]}】'
            )

    @classmethod
    def validate_redemption(cls, redemption):
        """验证兑换申请"""
        if redemption.product.status != ProductStatus.LISTED:
            raise ProductDelistedException(
                detail=f'商品【{redemption.product.name}】已下架，无法兑换'
            )

        required_points = redemption.product.points_required * redemption.quantity
        if redemption.points_used < required_points:
            raise ValidationFailedException(
                detail=f'积分不足，需要 {required_points} 积分，当前使用 {redemption.points_used} 积分'
            )

        if redemption.member_points < required_points:
            raise ValidationFailedException(
                detail=f'会员积分不足，需要 {required_points} 积分，会员仅有 {redemption.member_points} 积分'
            )

        inv = InventoryService.get_inventory(redemption.store, redemption.product)
        if inv.available_quantity < redemption.quantity:
            raise InventoryShortageException(
                detail=f'门店【{redemption.store.name}】商品【{redemption.product.name}】库存不足'
            )

    @classmethod
    @transaction.atomic
    def process(cls, redemption, user, request=None):
        """处理兑换申请"""
        cls._validate_status_transition(redemption, RedemptionStatus.PROCESSING)

        role = getattr(user.profile, 'role', None)
        if role not in [Role.STORE_MANAGER, Role.WAREHOUSE]:
            raise PermissionDeniedException(detail='只有店长或仓管可以处理兑换')

        if role == Role.STORE_MANAGER and user.profile.store != redemption.store:
            raise PermissionDeniedException(detail='只能处理本门店的兑换')

        cls.validate_redemption(redemption)

        InventoryService.reserve_stock(
            store=redemption.store,
            product=redemption.product,
            quantity=redemption.quantity,
            reason=f'兑换单{redemption.code}预留'
        )

        old_status = redemption.status
        redemption.status = RedemptionStatus.PROCESSING
        redemption.processed_by = user
        redemption.processed_at = timezone.now()
        redemption.save()

        AuditService.log_status_change(user, redemption, old_status, redemption.status, request)
        logger.info(f'Redemption {redemption.code} processed by {user.username}')
        return redemption

    @classmethod
    @transaction.atomic
    def reject(cls, redemption, user, reason, request=None):
        """拒绝兑换"""
        cls._validate_status_transition(redemption, RedemptionStatus.REJECTED)

        role = getattr(user.profile, 'role', None)
        if role not in [Role.STORE_MANAGER, Role.WAREHOUSE]:
            raise PermissionDeniedException(detail='只有店长或仓管可以拒绝兑换')

        if not reason or not reason.strip():
            raise ValidationFailedException(detail='拒绝原因不能为空')

        old_status = redemption.status
        redemption.status = RedemptionStatus.REJECTED
        redemption.reject_reason = reason
        redemption.processed_by = user
        redemption.processed_at = timezone.now()
        redemption.save()

        AuditService.log_status_change(user, redemption, old_status, redemption.status, request, reason)
        logger.info(f'Redemption {redemption.code} rejected by {user.username}: {reason}')
        return redemption

    @classmethod
    @transaction.atomic
    def ship(cls, redemption, user, tracking_no=None, request=None):
        """发货"""
        cls._validate_status_transition(redemption, RedemptionStatus.SHIPPED)

        role = getattr(user.profile, 'role', None)
        if role not in [Role.STORE_MANAGER, Role.WAREHOUSE]:
            raise PermissionDeniedException(detail='只有店长或仓管可以发货')

        old_status = redemption.status
        redemption.status = RedemptionStatus.SHIPPED
        redemption.tracking_no = tracking_no or redemption.tracking_no
        redemption.save()

        AuditService.log_status_change(user, redemption, old_status, redemption.status, request)
        logger.info(f'Redemption {redemption.code} shipped by {user.username}')
        return redemption

    @classmethod
    @transaction.atomic
    def complete(cls, redemption, user, request=None):
        """完成兑换"""
        cls._validate_status_transition(redemption, RedemptionStatus.COMPLETED)

        role = getattr(user.profile, 'role', None)
        if role not in [Role.STORE_MANAGER, Role.WAREHOUSE]:
            raise PermissionDeniedException(detail='只有店长或仓管可以完成兑换')

        if role == Role.STORE_MANAGER and user.profile.store != redemption.store:
            raise PermissionDeniedException(detail='只能完成本门店的兑换')

        InventoryService.release_reservation(
            store=redemption.store,
            product=redemption.product,
            quantity=redemption.quantity,
            reason=f'兑换单{redemption.code}完成，释放预留并扣减'
        )
        InventoryService.reduce_stock(
            store=redemption.store,
            product=redemption.product,
            quantity=redemption.quantity,
            reason=f'兑换单{redemption.code}'
        )

        old_status = redemption.status
        redemption.status = RedemptionStatus.COMPLETED
        redemption.completed_by = user
        redemption.completed_at = timezone.now()
        redemption.save()

        AuditService.log_status_change(user, redemption, old_status, redemption.status, request)
        logger.info(f'Redemption {redemption.code} completed by {user.username}')
        return redemption

    @classmethod
    @transaction.atomic
    def cancel(cls, redemption, user, reason='', request=None):
        """取消兑换"""
        cls._validate_status_transition(redemption, RedemptionStatus.CANCELLED)

        if redemption.status in [RedemptionStatus.PROCESSING, RedemptionStatus.SHIPPED]:
            InventoryService.cancel_reservation(
                store=redemption.store,
                product=redemption.product,
                quantity=redemption.quantity,
                reason=f'兑换单{redemption.code}取消'
            )

        old_status = redemption.status
        redemption.status = RedemptionStatus.CANCELLED
        redemption.save()

        AuditService.log_status_change(user, redemption, old_status, redemption.status, request, reason)
        logger.info(f'Redemption {redemption.code} cancelled by {user.username}: {reason}')
        return redemption

    @classmethod
    def generate_code(cls):
        """生成兑换单号"""
        today = timezone.localdate().strftime('%Y%m%d')
        prefix = f'RD{today}'
        from ..models import MemberRedemption
        last = MemberRedemption.objects.filter(code__startswith=prefix).order_by('-code').first()
        if last:
            try:
                seq = int(last.code[-4:]) + 1
            except (ValueError, IndexError):
                seq = 1
        else:
            seq = 1
        return f'{prefix}{seq:04d}'

    @classmethod
    def get_available_actions(cls, redemption, user):
        """获取当前用户可执行的操作"""
        actions = []
        role = getattr(user.profile, 'role', None)
        user_store = getattr(user.profile, 'store', None)

        if redemption.status == RedemptionStatus.PENDING:
            if role in [Role.STORE_MANAGER, Role.WAREHOUSE]:
                if role != Role.STORE_MANAGER or user_store == redemption.store:
                    actions.append({'key': 'process', 'label': '处理', 'method': 'POST'})
                    actions.append({'key': 'reject', 'label': '拒绝', 'method': 'POST'})

        if redemption.status == RedemptionStatus.PROCESSING:
            if role in [Role.STORE_MANAGER, Role.WAREHOUSE]:
                actions.append({'key': 'ship', 'label': '发货', 'method': 'POST'})

        if redemption.status == RedemptionStatus.SHIPPED:
            if role in [Role.STORE_MANAGER, Role.WAREHOUSE]:
                if role != Role.STORE_MANAGER or user_store == redemption.store:
                    actions.append({'key': 'complete', 'label': '完成', 'method': 'POST'})

        return actions
