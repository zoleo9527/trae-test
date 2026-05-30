from django.utils import timezone
from django.db import transaction
from .models import OverdueReminder, Notification
from apps.borrowing.models import BorrowRecord, BorrowStatus
from apps.inspections.models import InspectionRecord, InspectionStatus
from apps.repairs.models import RepairTicket, RepairStatus


class OverdueReminderService:

    @staticmethod
    def check_borrow_overdue():
        now = timezone.now()
        active_records = BorrowRecord.objects.filter(
            status__in=[BorrowStatus.BORROWED, BorrowStatus.RENEWED, BorrowStatus.OVERDUE],
        ).select_related('venue', 'borrower', 'book')

        results = []
        for record in active_records:
            is_overdue = record.calculate_overdue()
            if is_overdue and record.overdue_days > 0:
                existing_unhandled = OverdueReminder.objects.filter(
                    type='borrow',
                    related_object_id=str(record.id),
                    is_handled=False
                ).first()
                if existing_unhandled:
                    existing_unhandled.overdue_days = record.overdue_days
                    existing_unhandled.reminder_count += 1
                    existing_unhandled.last_reminder_at = now
                    existing_unhandled.save()
                    results.append(('updated', existing_unhandled))
                    OverdueReminderService._send_notification(existing_unhandled, '借阅逾期提醒')
                else:
                    reminder = OverdueReminder.objects.create(
                        type='borrow',
                        related_object_id=str(record.id),
                        related_object_repr=f'{record.book.title} - {record.borrower.username}',
                        venue=record.venue,
                        assignee=record.borrower,
                        overdue_days=record.overdue_days,
                        message=f'图书《{record.book.title}》已逾期{record.overdue_days}天，请尽快归还。'
                    )
                    results.append(('created', reminder))
                    OverdueReminderService._send_notification(reminder, '借阅逾期提醒')

        return results

    @staticmethod
    def check_inspection_overdue():
        now = timezone.now()
        overdue_inspections = InspectionRecord.objects.filter(
            status__in=[InspectionStatus.DRAFT, InspectionStatus.SUBMITTED, InspectionStatus.NEEDS_REVIEW],
        ).select_related('venue', 'inspector')

        results = []
        for inspection in overdue_inspections:
            overdue_days = (now - inspection.created_at).days
            assignee = inspection.inspector

            if not assignee:
                continue

            if inspection.status == InspectionStatus.DRAFT:
                threshold_days = 1
                message = f'巡检【{inspection.title}】已创建{overdue_days}天，状态为草稿，请尽快提交。'
            elif inspection.status == InspectionStatus.SUBMITTED:
                threshold_days = 2
                from apps.users.models import User
                manager = User.objects.filter(role='manager', venues__venue=inspection.venue).first()
                if manager:
                    assignee = manager
                message = f'巡检【{inspection.title}】已提交{overdue_days}天，等待审核，请尽快处理。'
            elif inspection.status == InspectionStatus.NEEDS_REVIEW:
                threshold_days = 2
                message = f'巡检【{inspection.title}】需回查，已标记{overdue_days}天，请尽快复查。'
            else:
                continue

            if overdue_days < threshold_days:
                continue

            inspection.is_overdue = True
            inspection.save()

            existing_unhandled = OverdueReminder.objects.filter(
                type='inspection',
                related_object_id=str(inspection.id),
                is_handled=False
            ).first()
            if existing_unhandled:
                existing_unhandled.overdue_days = overdue_days
                existing_unhandled.reminder_count += 1
                existing_unhandled.last_reminder_at = now
                existing_unhandled.save()
                results.append(('updated', existing_unhandled))
                OverdueReminderService._send_notification(existing_unhandled, '巡检逾期提醒')
            else:
                reminder = OverdueReminder.objects.create(
                    type='inspection',
                    related_object_id=str(inspection.id),
                    related_object_repr=inspection.title,
                    venue=inspection.venue,
                    assignee=assignee,
                    overdue_days=overdue_days,
                    message=message
                )
                results.append(('created', reminder))
                OverdueReminderService._send_notification(reminder, '巡检逾期提醒')

        return results

    @staticmethod
    def check_repair_overdue():
        now = timezone.now()
        overdue_repairs = RepairTicket.objects.filter(
            status__in=[RepairStatus.PENDING, RepairStatus.ASSIGNED, RepairStatus.IN_PROGRESS],
        ).select_related('venue', 'reporter', 'assignee')

        results = []
        for ticket in overdue_repairs:
            overdue_days = (now - ticket.created_at).days

            if ticket.status == RepairStatus.PENDING:
                threshold_days = 1
                from apps.users.models import User
                manager = User.objects.filter(role='manager', venues__venue=ticket.venue).first()
                assignee = manager if manager else ticket.reporter
                message = f'报修单【{ticket.ticket_no}】{ticket.title} 待派单，已创建{overdue_days}天。'
            elif ticket.status == RepairStatus.ASSIGNED:
                threshold_days = 2
                assignee = ticket.assignee if ticket.assignee else ticket.reporter
                message = f'报修单【{ticket.ticket_no}】{ticket.title} 待处理，已派单{overdue_days}天。'
            elif ticket.status == RepairStatus.IN_PROGRESS:
                threshold_days = 3
                assignee = ticket.assignee if ticket.assignee else ticket.reporter
                message = f'报修单【{ticket.ticket_no}】{ticket.title} 处理中，已开始{overdue_days}天。'
            else:
                continue

            if not assignee or overdue_days < threshold_days:
                continue

            ticket.is_overdue = True
            ticket.save()

            existing_unhandled = OverdueReminder.objects.filter(
                type='repair',
                related_object_id=str(ticket.id),
                is_handled=False
            ).first()
            if existing_unhandled:
                existing_unhandled.overdue_days = overdue_days
                existing_unhandled.reminder_count += 1
                existing_unhandled.last_reminder_at = now
                existing_unhandled.save()
                results.append(('updated', existing_unhandled))
                OverdueReminderService._send_notification(existing_unhandled, '报修逾期提醒')
            else:
                reminder = OverdueReminder.objects.create(
                    type='repair',
                    related_object_id=str(ticket.id),
                    related_object_repr=f'{ticket.ticket_no} - {ticket.title}',
                    venue=ticket.venue,
                    assignee=assignee,
                    overdue_days=overdue_days,
                    message=message
                )
                results.append(('created', reminder))
                OverdueReminderService._send_notification(reminder, '报修逾期提醒')

        return results

    @staticmethod
    @transaction.atomic
    def check_all_overdue():
        results = {
            'borrow': OverdueReminderService.check_borrow_overdue(),
            'inspection': OverdueReminderService.check_inspection_overdue(),
            'repair': OverdueReminderService.check_repair_overdue(),
        }
        return results

    @staticmethod
    def _send_notification(reminder, title):
        Notification.objects.get_or_create(
            recipient=reminder.assignee,
            module=reminder.type,
            object_id=str(reminder.related_object_id),
            is_read=False,
            defaults={
                'sender': None,
                'type': 'warning' if reminder.overdue_days < 3 else 'urgent',
                'title': title,
                'content': reminder.message,
                'is_urgent': reminder.overdue_days >= 3,
            }
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
        }
