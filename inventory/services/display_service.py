from django.db import transaction
from django.utils import timezone
from ..models import DisplayRecord, DisplayRecordStatus, Role
from ..exceptions import (
    StatusConflictException, ValidationFailedException,
    PermissionDeniedException
)
from .audit_service import AuditService
import logging

logger = logging.getLogger(__name__)


class DisplayService:
    """陈列检查服务 - 巡店问题闭环处理"""

    STATUS_TRANSITIONS = {
        DisplayRecordStatus.PENDING: [DisplayRecordStatus.FIXED, DisplayRecordStatus.VERIFIED],
        DisplayRecordStatus.FIXED: [DisplayRecordStatus.VERIFIED],
        DisplayRecordStatus.VERIFIED: [],
    }

    @classmethod
    def _validate_status_transition(cls, record, target_status):
        allowed = cls.STATUS_TRANSITIONS.get(record.status, [])
        if target_status not in allowed:
            raise StatusConflictException(
                detail=f'无法从状态【{record.get_status_display()}】变更为【{dict(DisplayRecordStatus.choices)[target_status]}】'
            )

    @classmethod
    @transaction.atomic
    def fix(cls, record, user, fix_note, fix_photo_url=None, request=None):
        """店长整改陈列问题"""
        cls._validate_status_transition(record, DisplayRecordStatus.FIXED)

        role = getattr(user.profile, 'role', None)
        if role != Role.STORE_MANAGER:
            raise PermissionDeniedException(detail='只有店长可以整改陈列问题')

        if user.profile.store != record.store:
            raise PermissionDeniedException(detail='只能整改本门店的陈列问题')

        if not fix_note or not fix_note.strip():
            raise ValidationFailedException(detail='整改说明不能为空')

        old_status = record.status
        record.status = DisplayRecordStatus.FIXED
        record.fix_note = fix_note
        record.fix_photo_url = fix_photo_url or record.fix_photo_url
        record.fixed_by = user
        record.fixed_at = timezone.now()
        record.save()

        AuditService.log_status_change(user, record, old_status, record.status, request)
        logger.info(f'Display record {record.id} fixed by {user.username}')
        return record

    @classmethod
    @transaction.atomic
    def verify(cls, record, user, passed=True, remark='', request=None):
        """企划专员或仓管复核整改结果"""
        if not passed and record.status == DisplayRecordStatus.FIXED:
            cls._validate_status_transition(record, DisplayRecordStatus.PENDING)
            old_status = record.status
            record.status = DisplayRecordStatus.PENDING
            record.fix_note = (record.fix_note or '') + f'\n[复核不通过] {remark}'
            record.verified_by = user
            record.verified_at = timezone.now()
            record.save()
            AuditService.log_status_change(
                user, record, old_status, record.status, request, f'复核不通过: {remark}'
            )
            logger.info(f'Display record {record.id} verification failed by {user.username}: {remark}')
            return record

        cls._validate_status_transition(record, DisplayRecordStatus.VERIFIED)

        role = getattr(user.profile, 'role', None)
        if role not in [Role.PLANNER, Role.WAREHOUSE]:
            raise PermissionDeniedException(detail='只有企划专员或仓管可以复核')

        old_status = record.status
        record.status = DisplayRecordStatus.VERIFIED
        record.verified_by = user
        record.verified_at = timezone.now()
        record.save()

        AuditService.log_status_change(user, record, old_status, record.status, request, remark)
        logger.info(f'Display record {record.id} verified by {user.username}')
        return record

    @classmethod
    def get_overdue_records(cls, days=7):
        """获取超期未整改的记录"""
        from django.db.models import Q
        cutoff = timezone.localdate() - timezone.timedelta(days=days)
        return DisplayRecord.objects.filter(
            status=DisplayRecordStatus.PENDING,
            check_date__lte=cutoff
        ).select_related('store', 'product', 'checked_by').order_by('check_date')

    @classmethod
    def get_store_pending_count(cls, store):
        """获取门店待处理问题数"""
        return DisplayRecord.objects.filter(
            store=store,
            status=DisplayRecordStatus.PENDING
        ).count()

    @classmethod
    def get_available_actions(cls, record, user):
        """获取当前用户可执行的操作"""
        actions = []
        role = getattr(user.profile, 'role', None)
        user_store = getattr(user.profile, 'store', None)

        if record.status == DisplayRecordStatus.PENDING:
            if role == Role.STORE_MANAGER and user_store == record.store:
                actions.append({'key': 'fix', 'label': '整改', 'method': 'POST'})
            if role in [Role.PLANNER, Role.WAREHOUSE]:
                actions.append({'key': 'verify', 'label': '直接复核', 'method': 'POST'})

        if record.status == DisplayRecordStatus.FIXED:
            if role in [Role.PLANNER, Role.WAREHOUSE]:
                actions.append({'key': 'verify', 'label': '复核', 'method': 'POST'})

        return actions
