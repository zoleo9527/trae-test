from django.db import models
from django.db.models import Q, Count
from django.utils import timezone
from datetime import timedelta
from .models import Complaint, ComplaintComment
from apps.core.exceptions import StatusConflictException, ResourceNotFoundException, ValidationException
from apps.core.services import AuditService
from apps.core.models_audit import AuditLog


class ComplaintService:
    @staticmethod
    def list_complaints(category=None, priority=None, status=None, assigned_to=None, submitted_by=None,
                        start_date=None, end_date=None, search=None, overdue=False):
        queryset = Complaint.objects.select_related('assigned_to', 'submitted_by', 'student').all()
        if category:
            queryset = queryset.filter(category=category)
        if priority:
            queryset = queryset.filter(priority=priority)
        if status:
            queryset = queryset.filter(status=status)
        if assigned_to:
            queryset = queryset.filter(assigned_to_id=assigned_to)
        if submitted_by:
            queryset = queryset.filter(submitted_by_id=submitted_by)
        if start_date:
            queryset = queryset.filter(created_at__gte=start_date)
        if end_date:
            queryset = queryset.filter(created_at__lte=end_date + timedelta(days=1))
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) |
                Q(description__icontains=search) |
                Q(reporter_name__icontains=search)
            )
        if overdue:
            queryset = queryset.filter(
                expected_resolve_time__isnull=False,
                expected_resolve_time__lt=timezone.now(),
                status__in=[Complaint.Status.SUBMITTED, Complaint.Status.ASSIGNED, Complaint.Status.PROCESSING]
            )
        return queryset

    @staticmethod
    def create_complaint(user, **kwargs):
        kwargs['submitted_by'] = user

        if kwargs.get('priority') == Complaint.Priority.URGENT:
            from apps.core.models import User
            directors = User.objects.filter(role='director').first()
            if directors:
                kwargs['assigned_to'] = directors

        complaint = Complaint.objects.create(**kwargs)

        AuditService.log_action(
            user=user,
            action=AuditLog.Action.CREATE,
            instance=complaint,
            new_value=kwargs
        )

        if complaint.priority == Complaint.Priority.URGENT:
            ComplaintComment.objects.create(
                complaint=complaint,
                author=user,
                content='系统自动标记为紧急问题，已通知馆长',
                is_internal=True
            )

        return complaint

    @staticmethod
    def update_status(user, complaint, new_status, notes=''):
        allowed_transitions = {
            Complaint.Status.SUBMITTED: [Complaint.Status.ASSIGNED, Complaint.Status.PROCESSING, Complaint.Status.CLOSED, Complaint.Status.ESCALATED],
            Complaint.Status.ASSIGNED: [Complaint.Status.PROCESSING, Complaint.Status.RESOLVED, Complaint.Status.CLOSED, Complaint.Status.ESCALATED],
            Complaint.Status.PROCESSING: [Complaint.Status.RESOLVED, Complaint.Status.CLOSED, Complaint.Status.ESCALATED],
            Complaint.Status.RESOLVED: [Complaint.Status.CLOSED, Complaint.Status.PROCESSING],
            Complaint.Status.CLOSED: [],
            Complaint.Status.ESCALATED: [Complaint.Status.PROCESSING, Complaint.Status.RESOLVED, Complaint.Status.CLOSED],
        }

        if new_status not in allowed_transitions.get(complaint.status, []):
            raise StatusConflictException(
                f'无法从 {complaint.get_status_display()} 变更为 {dict(Complaint.Status.choices)[new_status]}'
            )

        is_director = user.role == 'director'
        is_supervisor = user.role in ['director', 'coach_supervisor']
        is_assignee = complaint.assigned_to_id == user.id

        if new_status in [Complaint.Status.RESOLVED, Complaint.Status.CLOSED]:
            if not is_supervisor and not is_assignee:
                raise ValidationException('只有处理人或主管可以关闭或标记解决')

        if new_status in [Complaint.Status.PROCESSING]:
            if not is_supervisor and not is_assignee:
                raise ValidationException('只有处理人或主管可以标记为处理中')

        old_status = complaint.status

        if new_status == Complaint.Status.RESOLVED:
            complaint.actual_resolve_time = timezone.now()

        if notes:
            ComplaintComment.objects.create(
                complaint=complaint,
                author=user,
                content=f'状态变更: {dict(Complaint.Status.choices)[old_status]} → {dict(Complaint.Status.choices)[new_status]}\n{notes}',
                is_internal=True
            )

        complaint.status = new_status
        complaint.save()

        AuditService.log_action(
            user=user,
            action=AuditLog.Action.STATUS_CHANGE,
            instance=complaint,
            old_value={'status': old_status},
            new_value={'status': new_status, 'notes': notes}
        )
        return complaint

    @staticmethod
    def assign_complaint(user, complaint, assigned_to_id, notes=''):
        if complaint.status in [Complaint.Status.CLOSED, Complaint.Status.RESOLVED]:
            raise StatusConflictException('已关闭或已解决的投诉无法分配')

        if user.role not in ['director', 'coach_supervisor']:
            raise ValidationException('只有馆长或教练主管可以分配投诉')

        from apps.core.models import User
        assignee = User.objects.filter(id=assigned_to_id).first()
        if not assignee:
            raise ResourceNotFoundException('处理人不存在')

        old_assignee = complaint.assigned_to
        complaint.assigned_to = assignee
        if complaint.status == Complaint.Status.SUBMITTED:
            complaint.status = Complaint.Status.ASSIGNED
        complaint.save()

        if notes:
            ComplaintComment.objects.create(
                complaint=complaint,
                author=user,
                content=f'分配给: {assignee.username}\n{notes}',
                is_internal=True
            )

        AuditService.log_action(
            user=user,
            action=AuditLog.Action.UPDATE,
            instance=complaint,
            old_value={'assigned_to': str(old_assignee) if old_assignee else None},
            new_value={'assigned_to': str(assignee)}
        )
        return complaint

    @staticmethod
    def add_comment(user, complaint, content, is_internal=False):
        if complaint.status == Complaint.Status.CLOSED:
            raise StatusConflictException('已关闭的投诉无法添加评论')

        comment = ComplaintComment.objects.create(
            complaint=complaint,
            author=user,
            content=content,
            is_internal=is_internal
        )
        return comment

    @staticmethod
    def escalate(user, complaint, reason=''):
        if complaint.status in [Complaint.Status.CLOSED, Complaint.Status.RESOLVED]:
            raise StatusConflictException('已关闭或已解决的投诉无法升级')

        if user.role not in ['director', 'coach_supervisor']:
            raise ValidationException('只有馆长或教练主管可以升级投诉')

        old_priority = complaint.priority
        old_status = complaint.status

        from apps.core.models import User
        director = User.objects.filter(role='director').first()
        if director:
            complaint.assigned_to = director

        complaint.priority = Complaint.Priority.URGENT
        complaint.status = Complaint.Status.ESCALATED
        complaint.save()

        ComplaintComment.objects.create(
            complaint=complaint,
            author=user,
            content=f'问题已升级处理，原因: {reason or "未填写"}',
            is_internal=True
        )

        AuditService.log_action(
            user=user,
            action=AuditLog.Action.STATUS_CHANGE,
            instance=complaint,
            old_value={'priority': old_priority, 'status': old_status},
            new_value={'priority': Complaint.Priority.URGENT, 'status': Complaint.Status.ESCALATED}
        )
        return complaint

    @staticmethod
    def get_statistics():
        total = Complaint.objects.count()
        open_count = Complaint.objects.filter(status__in=[
            Complaint.Status.SUBMITTED,
            Complaint.Status.ASSIGNED,
            Complaint.Status.PROCESSING
        ]).count()
        overdue = Complaint.objects.filter(
            expected_resolve_time__isnull=False,
            expected_resolve_time__lt=timezone.now(),
            status__in=[Complaint.Status.SUBMITTED, Complaint.Status.ASSIGNED, Complaint.Status.PROCESSING]
        ).count()

        by_category = Complaint.objects.values('category').annotate(count=Count('id'))
        by_priority = Complaint.objects.values('priority').annotate(count=Count('id'))
        by_status = Complaint.objects.values('status').annotate(count=Count('id'))

        last_7_days = Complaint.objects.filter(
            created_at__gte=timezone.now() - timedelta(days=7)
        ).count()

        return {
            'total': total,
            'open': open_count,
            'overdue': overdue,
            'last_7_days': last_7_days,
            'by_category': list(by_category),
            'by_priority': list(by_priority),
            'by_status': list(by_status),
        }
