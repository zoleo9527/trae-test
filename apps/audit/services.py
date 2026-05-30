from django.utils import timezone
from django.db import transaction
from .models import OverdueReminder, Notification
from apps.borrowing.models import BorrowRecord, BorrowStatus
from apps.inspections.models import InspectionRecord, InspectionStatus
from apps.repairs.models import RepairTicket, RepairStatus


class OverdueReminderService:

    @staticmethod
    def _get_urgent_level(overdue_days):
        if overdue_days >= 7:
            return 'critical', 'urgent'
        elif overdue_days >= 3:
            return 'urgent', 'urgent'
        elif overdue_days >= 1:
            return 'warning', 'warning'
        return 'normal', 'info'

    @staticmethod
    def _get_overdue_base_time(record):
        now = timezone.now()
        module = record.__class__.__name__

        if module == 'BorrowRecord':
            return record.due_date, now > record.due_date

        elif module == 'InspectionRecord':
            if record.status == InspectionStatus.DRAFT:
                base_time = record.created_at
            elif record.status == InspectionStatus.SUBMITTED:
                base_time = record.review_time or record.updated_at or record.created_at
            elif record.status == InspectionStatus.NEEDS_REVIEW:
                base_time = record.updated_at or record.created_at
            else:
                return None, False
            return base_time, True

        elif module == 'RepairTicket':
            if record.status == RepairStatus.PENDING:
                base_time = record.created_at
            elif record.status == RepairStatus.ASSIGNED:
                base_time = record.assigned_time or record.created_at
            elif record.status == RepairStatus.IN_PROGRESS:
                base_time = record.start_time or record.assigned_time or record.created_at
            else:
                return None, False
            return base_time, True

        return None, False

    @staticmethod
    def _calculate_overdue(record):
        base_time, is_active = OverdueReminderService._get_overdue_base_time(record)
        if not base_time or not is_active:
            return 0, False, 'normal'

        now = timezone.now()
        module = record.__class__.__name__

        if module == 'BorrowRecord':
            threshold_days = 0
        elif module == 'InspectionRecord':
            if record.status == InspectionStatus.DRAFT:
                threshold_days = 1
            elif record.status in [InspectionStatus.SUBMITTED, InspectionStatus.NEEDS_REVIEW]:
                threshold_days = 2
            else:
                threshold_days = 999
        elif module == 'RepairTicket':
            if record.status == RepairStatus.PENDING:
                threshold_days = 1
            elif record.status == RepairStatus.ASSIGNED:
                threshold_days = 2
            elif record.status == RepairStatus.IN_PROGRESS:
                threshold_days = 3
            else:
                threshold_days = 999
        else:
            threshold_days = 1

        overdue_days = (now - base_time).days
        is_overdue = overdue_days >= threshold_days
        urgent_level, _ = OverdueReminderService._get_urgent_level(max(0, overdue_days - threshold_days + 1) if is_overdue else 0)

        return overdue_days, is_overdue, urgent_level

    @staticmethod
    def _build_message(record, overdue_days, is_overdue):
        module = record.__class__.__name__
        effective_days = overdue_days

        if module == 'BorrowRecord':
            if is_overdue:
                return f'图书《{record.book.title}》已逾期{effective_days}天，请尽快归还。'
            return f'图书《{record.book.title}》将于{abs(effective_days)}天后到期，请按时归还。'

        elif module == 'InspectionRecord':
            if record.status == InspectionStatus.DRAFT:
                return f'巡检【{record.title}】已创建{effective_days}天，状态为草稿，请尽快提交。'
            elif record.status == InspectionStatus.SUBMITTED:
                return f'巡检【{record.title}】已提交{effective_days}天，等待审核，请尽快处理。'
            elif record.status == InspectionStatus.NEEDS_REVIEW:
                return f'巡检【{record.title}】需回查，已标记{effective_days}天，请尽快复查。'

        elif module == 'RepairTicket':
            if record.status == RepairStatus.PENDING:
                return f'报修单【{record.ticket_no}】{record.title} 待派单，已创建{effective_days}天。'
            elif record.status == RepairStatus.ASSIGNED:
                return f'报修单【{record.ticket_no}】{record.title} 待处理，已派单{effective_days}天。'
            elif record.status == RepairStatus.IN_PROGRESS:
                return f'报修单【{record.ticket_no}】{record.title} 处理中，已开始{effective_days}天。'

        return ''

    @staticmethod
    def _get_assignee(record):
        module = record.__class__.__name__

        if module == 'BorrowRecord':
            return record.borrower

        elif module == 'InspectionRecord':
            if record.status == InspectionStatus.SUBMITTED:
                from apps.users.models import User
                manager = User.objects.filter(role='manager', venues__venue=record.venue).first()
                if manager:
                    return manager
            return record.inspector

        elif module == 'RepairTicket':
            if record.status == RepairStatus.PENDING:
                from apps.users.models import User
                manager = User.objects.filter(role='manager', venues__venue=record.venue).first()
                if manager:
                    return manager
                return record.reporter
            return record.assignee or record.reporter

        return None

    @staticmethod
    def _get_related_object_repr(record):
        module = record.__class__.__name__
        if module == 'BorrowRecord':
            return f'{record.book.title} - {record.borrower.username}'
        elif module == 'InspectionRecord':
            return record.title
        elif module == 'RepairTicket':
            return f'{record.ticket_no} - {record.title}'
        return str(record)

    @staticmethod
    def _get_reminder_type(record):
        module = record.__class__.__name__
        if module == 'BorrowRecord':
            return 'borrow'
        elif module == 'InspectionRecord':
            return 'inspection'
        elif module == 'RepairTicket':
            return 'repair'
        return 'other'

    @staticmethod
    def _update_notification(reminder, title):
        _, notif_type = OverdueReminderService._get_urgent_level(reminder.overdue_days)

        notifications = Notification.objects.filter(
            recipient=reminder.assignee,
            module=reminder.type,
            object_id=str(reminder.related_object_id),
            is_read=False
        )

        if notifications.exists():
            notifications.update(
                type=notif_type,
                title=title,
                content=reminder.message,
                is_urgent=reminder.overdue_days >= 3,
                created_at=timezone.now()
            )
        else:
            Notification.objects.create(
                recipient=reminder.assignee,
                sender=None,
                type=notif_type,
                title=title,
                content=reminder.message,
                module=reminder.type,
                object_id=str(reminder.related_object_id),
                is_read=False,
                is_urgent=reminder.overdue_days >= 3,
            )

    @staticmethod
    def _process_overdue_record(record):
        overdue_days, is_overdue, urgent_level = OverdueReminderService._calculate_overdue(record)

        if not is_overdue or overdue_days <= 0:
            return None, 'skipped'

        module = record.__class__.__name__
        reminder_type = OverdueReminderService._get_reminder_type(record)
        assignee = OverdueReminderService._get_assignee(record)
        message = OverdueReminderService._build_message(record, overdue_days, is_overdue)
        related_repr = OverdueReminderService._get_related_object_repr(record)

        if not assignee:
            return None, 'skipped'

        if hasattr(record, 'is_overdue'):
            record.is_overdue = True
            record.save()

        existing_unhandled = OverdueReminder.objects.filter(
            type=reminder_type,
            related_object_id=str(record.id),
            is_handled=False
        ).first()

        now = timezone.now()
        if existing_unhandled:
            old_days = existing_unhandled.overdue_days
            existing_unhandled.overdue_days = overdue_days
            existing_unhandled.reminder_count += 1
            existing_unhandled.last_reminder_at = now
            existing_unhandled.message = message
            existing_unhandled.related_object_repr = related_repr
            existing_unhandled.assignee = assignee
            existing_unhandled.save()

            if old_days != overdue_days:
                OverdueReminderService._update_notification(existing_unhandled, f'{module.replace("Record", "").replace("Ticket", "")}逾期提醒')

            return existing_unhandled, 'updated'
        else:
            reminder = OverdueReminder.objects.create(
                type=reminder_type,
                related_object_id=str(record.id),
                related_object_repr=related_repr,
                venue=record.venue,
                assignee=assignee,
                overdue_days=overdue_days,
                message=message
            )
            OverdueReminderService._update_notification(reminder, f'{module.replace("Record", "").replace("Ticket", "")}逾期提醒')
            return reminder, 'created'

    @staticmethod
    def check_borrow_overdue():
        now = timezone.now()
        active_records = BorrowRecord.objects.filter(
            status__in=[BorrowStatus.BORROWED, BorrowStatus.RENEWED, BorrowStatus.OVERDUE],
        ).select_related('venue', 'borrower', 'book')

        results = []
        for record in active_records:
            item, status = OverdueReminderService._process_overdue_record(record)
            if item:
                results.append((status, item))
        return results

    @staticmethod
    def check_inspection_overdue():
        overdue_inspections = InspectionRecord.objects.filter(
            status__in=[InspectionStatus.DRAFT, InspectionStatus.SUBMITTED, InspectionStatus.NEEDS_REVIEW],
        ).select_related('venue', 'inspector')

        results = []
        for inspection in overdue_inspections:
            item, status = OverdueReminderService._process_overdue_record(inspection)
            if item:
                results.append((status, item))
        return results

    @staticmethod
    def check_repair_overdue():
        overdue_repairs = RepairTicket.objects.filter(
            status__in=[RepairStatus.PENDING, RepairStatus.ASSIGNED, RepairStatus.IN_PROGRESS],
        ).select_related('venue', 'reporter', 'assignee')

        results = []
        for ticket in overdue_repairs:
            item, status = OverdueReminderService._process_overdue_record(ticket)
            if item:
                results.append((status, item))
        return results

    @staticmethod
    @transaction.atomic
    def check_all_overdue(trigger_type='manual', operator=None):
        results = {
            'borrow': OverdueReminderService.check_borrow_overdue(),
            'inspection': OverdueReminderService.check_inspection_overdue(),
            'repair': OverdueReminderService.check_repair_overdue(),
        }

        summary = {
            'trigger_type': trigger_type,
            'operator': operator.username if operator else None,
            'triggered_at': timezone.now(),
            'total_created': sum(1 for k, v in results.items() for s, _ in v if s == 'created'),
            'total_updated': sum(1 for k, v in results.items() for s, _ in v if s == 'updated'),
            'by_module': {
                k: {
                    'created': sum(1 for s, _ in v if s == 'created'),
                    'updated': sum(1 for s, _ in v if s == 'updated'),
                } for k, v in results.items()
            }
        }

        return results, summary

    @staticmethod
    @transaction.atomic
    def close_reminder_for_object(obj, operator=None, reason='completed'):
        reminder_type = OverdueReminderService._get_reminder_type(obj)
        object_id = str(obj.id)
        related_repr = OverdueReminderService._get_related_object_repr(obj)

        reminders = OverdueReminder.objects.filter(
            type=reminder_type,
            related_object_id=object_id,
            is_handled=False
        )

        now = timezone.now()
        updated = reminders.update(
            is_handled=True,
            handled_by=operator,
            handled_at=now,
            message=f'{reason}: {related_repr} (已处理)'
        )

        unread_notifications = Notification.objects.filter(
            module=reminder_type,
            object_id=object_id,
            is_read=False
        )

        for notif in unread_notifications:
            old_content = notif.content
            Notification.objects.filter(pk=notif.pk).update(
                is_read=True,
                read_at=now,
                content=f'{reason}: 相关逾期已处理 - {old_content}'
            )

        return updated

    @staticmethod
    def close_borrow_reminder(borrow_record, operator=None):
        return OverdueReminderService.close_reminder_for_object(
            borrow_record, operator, reason='图书已归还'
        )

    @staticmethod
    def close_inspection_reminder(inspection_record, operator=None):
        return OverdueReminderService.close_reminder_for_object(
            inspection_record, operator, reason='巡检已完成'
        )

    @staticmethod
    def close_repair_reminder(repair_ticket, operator=None):
        return OverdueReminderService.close_reminder_for_object(
            repair_ticket, operator, reason='工单已完结'
        )

    @staticmethod
    def get_user_overdue_reminders(user):
        from apps.common.views import get_user_venue_ids
        venue_ids = get_user_venue_ids(user)
        qs = OverdueReminder.objects.filter(is_handled=False)
        if venue_ids is not None:
            qs = qs.filter(venue_id__in=venue_ids) if venue_ids else qs.none()
        if user.role not in ['admin', 'manager']:
            qs = qs.filter(assignee=user)
        return qs.select_related('venue', 'assignee').order_by('-overdue_days')

    @staticmethod
    def get_dashboard_overdue_stats(user):
        qs = OverdueReminderService.get_user_overdue_reminders(user)
        return {
            'total': qs.count(),
            'by_type': {
                'borrow': qs.filter(type='borrow').count(),
                'inspection': qs.filter(type='inspection').count(),
                'repair': qs.filter(type='repair').count(),
                'activity': qs.filter(type='activity').count(),
            },
            'urgent': qs.filter(overdue_days__gte=3).count(),
            'critical': qs.filter(overdue_days__gte=7).count(),
        }

    @staticmethod
    def get_overdue_summary():
        qs = OverdueReminder.objects.filter(is_handled=False)
        return {
            'total': qs.count(),
            'by_type': {
                'borrow': qs.filter(type='borrow').count(),
                'inspection': qs.filter(type='inspection').count(),
                'repair': qs.filter(type='repair').count(),
            },
            'by_days': {
                '1-2': qs.filter(overdue_days__gte=1, overdue_days__lte=2).count(),
                '3-6': qs.filter(overdue_days__gte=3, overdue_days__lte=6).count(),
                '7+': qs.filter(overdue_days__gte=7).count(),
            }
        }
