from django.utils import timezone
from .models import RepairTicket, RepairStatus, RepairLog
from apps.devices.models import DeviceStatus
from apps.audit.models import Notification
from apps.audit.services import OverdueReminderService


class RepairFlowService:
    @staticmethod
    def assign_repair(ticket_id, assignee, assigner):
        if assigner.role not in ['admin', 'manager']:
            raise ValueError('只有经理或管理员可以派单')
        ticket = RepairTicket.objects.get(id=ticket_id)
        if ticket.status != RepairStatus.PENDING:
            raise ValueError('只有待处理状态的工单可以派单')

        old_status = ticket.status
        ticket.status = RepairStatus.ASSIGNED
        ticket.assignee = assignee
        ticket.assigned_time = timezone.now()
        ticket.updated_by = assigner
        ticket.save()

        RepairLog.objects.create(
            ticket=ticket,
            action='派单',
            operator=assigner,
            from_status=old_status,
            to_status=ticket.status,
            remarks=f'指派给 {assignee.username}',
        )

        Notification.objects.create(
            recipient=assignee,
            sender=assigner,
            type='info',
            title='新的报修工单',
            content=f'您收到一个新的报修工单：{ticket.title}',
            module='repairs',
            object_id=str(ticket.id),
        )

        return ticket

    @staticmethod
    def start_repair(ticket_id, user):
        ticket = RepairTicket.objects.get(id=ticket_id)
        if ticket.status != RepairStatus.ASSIGNED:
            raise ValueError('只有已派单状态的工单可以开始处理')
        if ticket.assignee != user and user.role not in ['admin', 'manager']:
            raise ValueError('只有指定的维修人员可以开始处理')

        old_status = ticket.status
        ticket.status = RepairStatus.IN_PROGRESS
        ticket.start_time = timezone.now()
        ticket.save()

        if ticket.device:
            ticket.device.status = DeviceStatus.REPAIRING
            ticket.device.save()

        RepairLog.objects.create(
            ticket=ticket,
            action='开始处理',
            operator=user,
            from_status=old_status,
            to_status=ticket.status,
        )

        return ticket

    @staticmethod
    def complete_repair(ticket_id, user, solution='', cost=None):
        ticket = RepairTicket.objects.get(id=ticket_id)
        if ticket.status != RepairStatus.IN_PROGRESS:
            raise ValueError('只有处理中的工单可以完成')
        if ticket.assignee != user:
            raise ValueError('只有指定的维修人员可以完成工单')

        old_status = ticket.status
        ticket.status = RepairStatus.NEEDS_CONFIRM
        ticket.completed_time = timezone.now()
        ticket.solution = solution
        if cost is not None:
            ticket.actual_cost = cost
        ticket.save()

        RepairLog.objects.create(
            ticket=ticket,
            action='完成维修',
            operator=user,
            from_status=old_status,
            to_status=ticket.status,
            remarks=solution,
        )

        Notification.objects.create(
            recipient=ticket.reporter,
            sender=user,
            type='info',
            title='报修待确认',
            content=f'报修工单"{ticket.title}"已处理完成，请确认',
            module='repairs',
            object_id=str(ticket.id),
        )

        return ticket

    @staticmethod
    def confirm_repair(ticket_id, user, rating=None, comments=''):
        ticket = RepairTicket.objects.get(id=ticket_id)
        if ticket.status != RepairStatus.NEEDS_CONFIRM:
            raise ValueError('只有待确认状态的工单可以确认')
        if ticket.reporter != user and user.role not in ['admin', 'manager']:
            raise ValueError('只有报修人或经理可以确认工单')

        old_status = ticket.status
        ticket.status = RepairStatus.COMPLETED
        ticket.feedback_rating = rating
        ticket.feedback_comments = comments
        ticket.save()

        if ticket.device:
            ticket.device.status = DeviceStatus.NORMAL
            ticket.device.save()

        RepairLog.objects.create(
            ticket=ticket,
            action='确认完成',
            operator=user,
            from_status=old_status,
            to_status=ticket.status,
            remarks=comments,
        )

        OverdueReminderService.close_repair_reminder(ticket, operator=user)

        return ticket

    @staticmethod
    def reopen_repair(ticket_id, user, reason=''):
        ticket = RepairTicket.objects.get(id=ticket_id)
        if ticket.status != RepairStatus.NEEDS_CONFIRM:
            raise ValueError('只有待确认状态的工单可以重新打开')
        if ticket.reporter != user and user.role not in ['admin', 'manager']:
            raise ValueError('只有报修人或经理可以重新打开工单')

        old_status = ticket.status
        ticket.status = RepairStatus.IN_PROGRESS
        ticket.save()

        RepairLog.objects.create(
            ticket=ticket,
            action='重新打开',
            operator=user,
            from_status=old_status,
            to_status=ticket.status,
            remarks=reason,
        )

        Notification.objects.create(
            recipient=ticket.assignee,
            sender=user,
            type='warning',
            title='工单重新打开',
            content=f'报修工单"{ticket.title}"被重新打开，原因：{reason}',
            module='repairs',
            object_id=str(ticket.id),
        )

        return ticket

    @staticmethod
    def reject_repair(ticket_id, user, reason=''):
        if user.role not in ['admin', 'manager']:
            raise ValueError('只有经理或管理员可以驳回工单')
        ticket = RepairTicket.objects.get(id=ticket_id)
        if ticket.status != RepairStatus.PENDING:
            raise ValueError('只有待处理状态的工单可以驳回')

        old_status = ticket.status
        ticket.status = RepairStatus.REJECTED
        ticket.reject_reason = reason
        ticket.save()

        RepairLog.objects.create(
            ticket=ticket,
            action='驳回',
            operator=user,
            from_status=old_status,
            to_status=ticket.status,
            remarks=reason,
        )

        Notification.objects.create(
            recipient=ticket.reporter,
            sender=user,
            type='error',
            title='报修被驳回',
            content=f'报修工单"{ticket.title}"已被驳回，原因：{reason}',
            module='repairs',
            object_id=str(ticket.id),
        )

        OverdueReminderService.close_repair_reminder(ticket, operator=user)

        return ticket
