from django.utils import timezone
from .models import InspectionRecord, InspectionStatus, InspectionItemResult
from apps.repairs.models import RepairTicket, RepairStatus, RepairPriority, RepairCategory
from apps.devices.models import DeviceStatus
from apps.audit.models import Notification


class InspectionFlowService:
    @staticmethod
    def submit_inspection(inspection_id, user):
        inspection = InspectionRecord.objects.get(id=inspection_id)
        if inspection.inspector != user and user.role not in ['admin', 'manager']:
            raise ValueError('只有巡检人本人或经理可以提交巡检')
        if inspection.status != InspectionStatus.DRAFT:
            raise ValueError('只有草稿状态的巡检可以提交')

        inspection.status = InspectionStatus.SUBMITTED
        inspection.save()

        has_issues = InspectionItemResult.objects.filter(
            inspection=inspection,
            has_issue=True
        ).exists()

        if has_issues:
            inspection.status = InspectionStatus.REVIEWING
            inspection.save()

        return inspection

    @staticmethod
    def approve_inspection(inspection_id, user, comments=''):
        if user.role not in ['admin', 'manager']:
            raise ValueError('只有经理或管理员可以审核巡检')
        inspection = InspectionRecord.objects.get(id=inspection_id)
        if inspection.status not in [InspectionStatus.SUBMITTED, InspectionStatus.REVIEWING, InspectionStatus.NEEDS_REVIEW]:
            raise ValueError('当前状态不允许审核通过')

        inspection.status = InspectionStatus.APPROVED
        inspection.reviewer = user
        inspection.review_time = timezone.now()
        inspection.review_comments = comments
        inspection.save()

        items_needing_repair = InspectionItemResult.objects.filter(
            inspection=inspection,
            need_repair=True
        )

        for item in items_needing_repair:
            if not RepairTicket.objects.filter(inspection_item=item).exists():
                InspectionFlowService._create_repair_from_inspection(item, user)

        return inspection

    @staticmethod
    def reject_inspection(inspection_id, user, comments=''):
        if user.role not in ['admin', 'manager']:
            raise ValueError('只有经理或管理员可以驳回巡检')
        inspection = InspectionRecord.objects.get(id=inspection_id)
        if inspection.status not in [InspectionStatus.SUBMITTED, InspectionStatus.REVIEWING]:
            raise ValueError('当前状态不允许驳回')

        inspection.status = InspectionStatus.REJECTED
        inspection.reviewer = user
        inspection.review_time = timezone.now()
        inspection.review_comments = comments
        inspection.save()

        Notification.objects.create(
            recipient=inspection.inspector,
            sender=user,
            type='warning',
            title='巡检被驳回',
            content=f'您提交的巡检"{inspection.title}"已被驳回，原因：{comments}',
            module='inspections',
            object_id=str(inspection.id),
        )

        return inspection

    @staticmethod
    def mark_needs_review(inspection_id, user, reason=''):
        if user.role not in ['admin', 'manager']:
            raise ValueError('只有经理或管理员可以标记需回查')
        inspection = InspectionRecord.objects.get(id=inspection_id)
        if inspection.status not in [InspectionStatus.SUBMITTED, InspectionStatus.REVIEWING]:
            raise ValueError('当前状态不允许标记需回查')

        inspection.status = InspectionStatus.NEEDS_REVIEW
        inspection.reviewer = user
        inspection.review_time = timezone.now()
        inspection.needs_review_reason = reason
        inspection.save()

        Notification.objects.create(
            recipient=inspection.inspector,
            sender=user,
            type='warning',
            title='巡检需回查',
            content=f'巡检"{inspection.title}"需要回查，原因：{reason}',
            module='inspections',
            object_id=str(inspection.id),
        )

        return inspection

    @staticmethod
    def _create_repair_from_inspection(inspection_item, created_by):
        inspection = inspection_item.inspection
        device = inspection_item.device

        if device:
            device.status = DeviceStatus.FAULTY
            device.save()

        repair = RepairTicket.objects.create(
            venue=inspection.venue,
            device=device,
            area=device.area if device else None,
            reporter=created_by,
            inspection=inspection,
            inspection_item=inspection_item,
            category=RepairCategory.OTHER,
            priority=RepairPriority.MEDIUM,
            status=RepairStatus.PENDING,
            title=f'巡检发现问题：{inspection_item.item_name}',
            description=inspection_item.issue_description or inspection_item.remarks,
            location=device.location if device else '',
            created_by=created_by,
        )

        return repair

    @staticmethod
    def complete_inspection(inspection_id, user):
        if user.role not in ['admin', 'manager']:
            raise ValueError('只有经理或管理员可以完成巡检')
        inspection = InspectionRecord.objects.get(id=inspection_id)
        if inspection.status != InspectionStatus.APPROVED:
            raise ValueError('只有已通过的巡检可以标记完成')

        pending_repairs = RepairTicket.objects.filter(
            inspection=inspection,
            status__in=[RepairStatus.PENDING, RepairStatus.ASSIGNED, RepairStatus.IN_PROGRESS]
        ).exists()

        if pending_repairs:
            raise ValueError('还有未完成的报修工单，无法完成巡检')

        inspection.status = InspectionStatus.COMPLETED
        inspection.end_time = timezone.now()
        inspection.save()

        return inspection
