from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from datetime import timedelta
from .models import CreditRecord, RepaymentRecord, CreditReminder
from .serializers import (
    CreditRecordSerializer, CreditRecordListSerializer,
    CreditRecordApproveSerializer, CreditRecordRejectSerializer,
    RepaymentRecordSerializer, RepaymentRecordListSerializer,
    CreditReminderSerializer, CreditReminderListSerializer,
    CreditReminderHandleSerializer
)
from apps.audit.utils import log_action, model_to_dict
from apps.base.permissions import CanManageCredit, CanApproveCredit


class CreditRecordViewSet(viewsets.ModelViewSet):
    queryset = CreditRecord.objects.all()
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['customer', 'status', 'due_date']
    search_fields = ['record_no', 'customer__name']
    ordering_fields = ['created_at', 'due_date', 'amount']

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [IsAuthenticated()]
        elif self.action in ['approve', 'reject']:
            return [CanApproveCredit()]
        return [CanManageCredit()]

    def get_serializer_class(self):
        if self.action == 'list':
            return CreditRecordListSerializer
        return CreditRecordSerializer

    def generate_record_no(self):
        today = timezone.now().strftime('%Y%m%d')
        count = CreditRecord.objects.filter(record_no__startswith=f'SZ{today}').count() + 1
        return f'SZ{today}{count:04d}'

    def perform_create(self, serializer):
        record_no = self.generate_record_no()
        instance = serializer.save(
            record_no=record_no,
            created_by=self.request.user,
            updated_by=self.request.user
        )
        log_action(
            user=self.request.user,
            action='create',
            message=f'创建赊账记录: {instance.record_no}, 金额: {instance.amount}, 客户: {instance.customer.name}',
            instance=instance,
            new_values=model_to_dict(instance),
            request=self.request
        )

    def perform_update(self, serializer):
        old_instance = self.get_object()
        old_values = model_to_dict(old_instance)
        instance = serializer.save(updated_by=self.request.user)
        log_action(
            user=self.request.user,
            action='update',
            message=f'更新赊账记录: {instance.record_no}',
            instance=instance,
            old_values=old_values,
            new_values=model_to_dict(instance),
            request=self.request
        )

    def perform_destroy(self, instance):
        log_action(
            user=self.request.user,
            action='delete',
            message=f'删除赊账记录: {instance.record_no}',
            instance=instance,
            old_values=model_to_dict(instance),
            request=self.request
        )
        instance.delete()

    @action(detail=True, methods=['post'], serializer_class=CreditRecordApproveSerializer)
    def approve(self, request, pk=None):
        credit = self.get_object()
        if credit.status != 'pending':
            return Response(
                {'error': '只有待确认状态的赊账才能确认'},
                status=status.HTTP_400_BAD_REQUEST
            )

        customer = credit.customer
        approved_used = customer.get_approved_used_credit()
        new_total_used = approved_used + credit.amount

        if new_total_used > customer.credit_limit:
            return Response(
                {
                    'error': '客户赊账额度不足，审批后将超出额度',
                    'details': {
                        'credit_limit': float(customer.credit_limit),
                        'current_approved_used': float(approved_used),
                        'current_credit_amount': float(credit.amount),
                        'new_total_if_approved': float(new_total_used),
                        'exceed_amount': float(new_total_used - customer.credit_limit)
                    }
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        old_values = model_to_dict(credit)
        credit.status = 'approved'
        credit.reviewed_by = request.user
        credit.reviewed_at = timezone.now()
        credit.save()

        self._create_due_reminder(credit, request.user)

        log_action(
            user=request.user,
            action='approve',
            message=f'确认赊账: {credit.record_no}, 金额: {credit.amount}',
            instance=credit,
            old_values=old_values,
            new_values=model_to_dict(credit),
            request=request
        )
        return Response({'status': 'success', 'message': '已确认'})

    def _create_due_reminder(self, credit, user):
        today = timezone.now().date()
        due_date = credit.due_date

        if due_date <= today:
            reminder_type = 'overdue'
            title = '赊账已逾期提醒'
            content = f'客户{credit.customer.name}的赊账金额{float(credit.amount)}元已逾期，请立即联系客户回款。'
            reminder_date = today
        elif (due_date - today).days <= 7:
            reminder_type = 'due_soon'
            title = '赊账即将到期提醒'
            content = f'客户{credit.customer.name}的赊账金额{float(credit.amount)}元即将到期，请及时联系客户回款。'
            reminder_date = due_date
        else:
            reminder_type = 'due_soon'
            title = '赊账到期提醒'
            content = f'客户{credit.customer.name}的赊账金额{float(credit.amount)}元将于{due_date}到期，请提前安排回款。'
            reminder_date = due_date - timedelta(days=7)

        CreditReminder.objects.create(
            customer=credit.customer,
            credit_record=credit,
            type=reminder_type,
            title=title,
            content=content,
            reminder_date=reminder_date,
            created_by=user,
            updated_by=user
        )

    @action(detail=True, methods=['post'], serializer_class=CreditRecordRejectSerializer)
    def reject(self, request, pk=None):
        credit = self.get_object()
        if credit.status != 'pending':
            return Response(
                {'error': '只有待确认状态的赊账才能驳回'},
                status=status.HTTP_400_BAD_REQUEST
            )
        serializer = CreditRecordRejectSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        old_values = model_to_dict(credit)
        credit.status = 'rejected'
        credit.reject_reason = serializer.validated_data['reject_reason']
        credit.reviewed_by = request.user
        credit.reviewed_at = timezone.now()
        credit.save()
        log_action(
            user=request.user,
            action='reject',
            message=f'驳回赊账: {credit.record_no}, 原因: {credit.reject_reason}',
            instance=credit,
            old_values=old_values,
            new_values=model_to_dict(credit),
            request=request
        )
        return Response({'status': 'success', 'message': '已驳回'})


class RepaymentRecordViewSet(viewsets.ModelViewSet):
    queryset = RepaymentRecord.objects.all()
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['customer', 'credit_record', 'status', 'payment_method']
    search_fields = ['record_no', 'customer__name']
    ordering_fields = ['created_at', 'payment_time', 'amount']

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [IsAuthenticated()]
        elif self.action in ['approve', 'reject']:
            return [CanApproveCredit()]
        return [CanManageCredit()]

    def get_serializer_class(self):
        if self.action == 'list':
            return RepaymentRecordListSerializer
        return RepaymentRecordSerializer

    def generate_record_no(self):
        today = timezone.now().strftime('%Y%m%d')
        count = RepaymentRecord.objects.filter(record_no__startswith=f'HK{today}').count() + 1
        return f'HK{today}{count:04d}'

    def perform_create(self, serializer):
        record_no = self.generate_record_no()
        instance = serializer.save(
            record_no=record_no,
            created_by=self.request.user,
            updated_by=self.request.user
        )
        log_action(
            user=self.request.user,
            action='create',
            message=f'创建回款记录: {instance.record_no}, 金额: {instance.amount}, 客户: {instance.customer.name}',
            instance=instance,
            new_values=model_to_dict(instance),
            request=self.request
        )

    def perform_update(self, serializer):
        old_instance = self.get_object()
        old_values = model_to_dict(old_instance)
        instance = serializer.save(updated_by=self.request.user)
        log_action(
            user=self.request.user,
            action='update',
            message=f'更新回款记录: {instance.record_no}',
            instance=instance,
            old_values=old_values,
            new_values=model_to_dict(instance),
            request=self.request
        )

    def perform_destroy(self, instance):
        log_action(
            user=self.request.user,
            action='delete',
            message=f'删除回款记录: {instance.record_no}',
            instance=instance,
            old_values=model_to_dict(instance),
            request=self.request
        )
        instance.delete()

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        repayment = self.get_object()
        if repayment.status != 'pending':
            return Response(
                {'error': '只有待确认状态的回款才能确认'},
                status=status.HTTP_400_BAD_REQUEST
            )

        credit = repayment.credit_record
        remaining = credit.get_remaining_amount()
        pending_total = credit.get_pending_repayments_total()
        effective_remaining = credit.get_effective_remaining()

        if repayment.amount > remaining:
            return Response(
                {
                    'error': '回款金额超过当前剩余欠款，无法确认',
                    'details': {
                        'credit_amount': float(credit.amount),
                        'repaid_amount': float(credit.get_repaid_amount()),
                        'remaining_amount': float(remaining),
                        'repayment_amount': float(repayment.amount),
                        'exceed_amount': float(repayment.amount - remaining)
                    }
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        if pending_total > remaining:
            return Response(
                {
                    'error': '存在多笔待确认回款，总额将超过剩余欠款',
                    'details': {
                        'remaining_amount': float(remaining),
                        'pending_total': float(pending_total),
                        'current_repayment': float(repayment.amount),
                        'other_pending': float(pending_total - repayment.amount)
                    }
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        old_values = model_to_dict(repayment)
        repayment.status = 'approved'
        repayment.reviewed_by = request.user
        repayment.reviewed_at = timezone.now()
        repayment.save()

        self._handle_reminders_after_repayment(repayment, request.user)

        log_action(
            user=request.user,
            action='approve',
            message=f'确认回款: {repayment.record_no}, 金额: {repayment.amount}',
            instance=repayment,
            old_values=old_values,
            new_values=model_to_dict(repayment),
            request=request
        )
        return Response({'status': 'success', 'message': '已确认'})

    def _handle_reminders_after_repayment(self, repayment, user):
        credit = repayment.credit_record
        remaining = credit.get_remaining_amount()

        if remaining <= 0:
            CreditReminder.objects.filter(
                credit_record=credit,
                is_handled=False
            ).update(
                is_handled=True,
                handled_by=user,
                handled_at=timezone.now(),
                handle_note=f'客户{credit.customer.name}已全额回款{float(credit.amount)}元，欠款已结清'
            )
        else:
            unhandled_reminders = CreditReminder.objects.filter(
                credit_record=credit,
                is_handled=False
            )
            for reminder in unhandled_reminders:
                reminder.content = (
                    f'客户{credit.customer.name}已回款{float(repayment.amount)}元，'
                    f'剩余欠款{float(remaining)}元，请继续跟进。'
                )
                reminder.save()

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        repayment = self.get_object()
        if repayment.status != 'pending':
            return Response(
                {'error': '只有待确认状态的回款才能驳回'},
                status=status.HTTP_400_BAD_REQUEST
            )
        reject_reason = request.data.get('reject_reason', '')
        old_values = model_to_dict(repayment)
        repayment.status = 'rejected'
        repayment.reject_reason = reject_reason
        repayment.reviewed_by = request.user
        repayment.reviewed_at = timezone.now()
        repayment.save()
        log_action(
            user=request.user,
            action='reject',
            message=f'驳回回款: {repayment.record_no}, 原因: {reject_reason}',
            instance=repayment,
            old_values=old_values,
            new_values=model_to_dict(repayment),
            request=request
        )
        return Response({'status': 'success', 'message': '已驳回'})


class CreditReminderViewSet(viewsets.ModelViewSet):
    queryset = CreditReminder.objects.all()
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['customer', 'type', 'is_read', 'is_handled', 'reminder_date']
    search_fields = ['title', 'customer__name']
    ordering_fields = ['created_at', 'reminder_date']

    def get_serializer_class(self):
        if self.action == 'list':
            return CreditReminderListSerializer
        return CreditReminderSerializer

    def list(self, request, *args, **kwargs):
        self._auto_sync_reminders(request)
        return super().list(request, *args, **kwargs)

    def retrieve(self, request, *args, **kwargs):
        self._auto_sync_single_reminder(request, self.get_object())
        return super().retrieve(request, *args, **kwargs)

    def _auto_sync_single_reminder(self, request, reminder):
        today = timezone.now().date()
        updated = False
        credit = reminder.credit_record

        if credit:
            remaining = credit.get_remaining_amount()
            if remaining <= 0 and credit.status == 'approved':
                reminder.is_handled = True
                reminder.handled_by = request.user
                reminder.handled_at = timezone.now()
                reminder.handle_note = f'系统自动标记：赊账{credit.record_no}已全额结清'
                updated = True
            elif credit.status != 'approved':
                reminder.is_handled = True
                reminder.handled_by = request.user
                reminder.handled_at = timezone.now()
                reminder.handle_note = f'系统自动标记：关联赊账状态已变更为{credit.get_status_display()}'
                updated = True

        if reminder.credit_record and not reminder.is_handled:
            due_date = reminder.credit_record.due_date
            days_until_due = (due_date - today).days
            new_type = None
            new_title = None
            new_content = None

            if days_until_due < 0:
                if reminder.type != 'overdue':
                    new_type = 'overdue'
                    new_title = '赊账已逾期提醒'
                    new_content = f'客户{reminder.customer.name}的赊账已逾期{abs(days_until_due)}天，请立即联系客户回款。'
            elif days_until_due <= 7:
                if reminder.type != 'due_soon':
                    new_type = 'due_soon'
                    new_title = '赊账即将到期提醒'
                    new_content = f'客户{reminder.customer.name}的赊账将在{days_until_due}天后到期，请及时跟进。'
            elif days_until_due > 7 and reminder.type == 'custom':
                new_type = 'due_soon'
                new_title = '赊账即将到期提醒'
                new_content = f'客户{reminder.customer.name}的赊账将在{days_until_due}天后到期，请及时跟进。'

            if new_type and new_type != reminder.type:
                reminder.type = new_type
                if new_title:
                    reminder.title = new_title
                if new_content:
                    reminder.content = new_content
                updated = True

        if updated:
            reminder.updated_by = request.user
            reminder.save()

    def _auto_sync_reminders(self, request):
        today = timezone.now().date()
        reminders = CreditReminder.objects.filter(is_handled=False).select_related('credit_record', 'customer')

        for reminder in reminders:
            updated = False
            credit = reminder.credit_record

            if credit:
                remaining = credit.get_remaining_amount()
                if remaining <= 0 and credit.status == 'approved':
                    reminder.is_handled = True
                    reminder.handled_by = request.user
                    reminder.handled_at = timezone.now()
                    reminder.handle_note = f'系统自动标记：赊账{credit.record_no}已全额结清'
                    updated = True
                elif credit.status != 'approved':
                    reminder.is_handled = True
                    reminder.handled_by = request.user
                    reminder.handled_at = timezone.now()
                    reminder.handle_note = f'系统自动标记：关联赊账状态已变更为{credit.get_status_display()}'
                    updated = True

            if reminder.credit_record and not reminder.is_handled:
                due_date = reminder.credit_record.due_date
                days_until_due = (due_date - today).days
                new_type = None
                new_title = None
                new_content = None

                if days_until_due < 0:
                    if reminder.type != 'overdue':
                        new_type = 'overdue'
                        new_title = '赊账已逾期提醒'
                        new_content = f'客户{reminder.customer.name}的赊账已逾期{abs(days_until_due)}天，请立即联系客户回款。'
                elif days_until_due <= 7:
                    if reminder.type != 'due_soon':
                        new_type = 'due_soon'
                        new_title = '赊账即将到期提醒'
                        new_content = f'客户{reminder.customer.name}的赊账将在{days_until_due}天后到期，请及时跟进。'

                if new_type and new_type != reminder.type:
                    reminder.type = new_type
                    if new_title:
                        reminder.title = new_title
                    if new_content:
                        reminder.content = new_content
                    updated = True

            if updated:
                reminder.updated_by = request.user
                reminder.save()

    @action(detail=False, methods=['post'])
    def sync_reminders(self, request):
        self._auto_sync_reminders(request)
        log_action(
            user=request.user,
            action='update',
            message='手动同步提醒状态',
            request=request
        )
        return Response({'status': 'success', 'message': '提醒同步完成'})

    def perform_create(self, serializer):
        instance = serializer.save(created_by=self.request.user, updated_by=self.request.user)
        log_action(
            user=self.request.user,
            action='create',
            message=f'创建回款提醒: {instance.title}',
            instance=instance,
            new_values=model_to_dict(instance),
            request=self.request
        )

    def perform_update(self, serializer):
        old_instance = self.get_object()
        old_values = model_to_dict(old_instance)
        instance = serializer.save(updated_by=self.request.user)
        log_action(
            user=self.request.user,
            action='update',
            message=f'更新回款提醒: {instance.title}',
            instance=instance,
            old_values=old_values,
            new_values=model_to_dict(instance),
            request=self.request
        )

    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        reminder = self.get_object()
        old_values = model_to_dict(reminder)
        reminder.is_read = True
        reminder.save()
        log_action(
            user=request.user,
            action='update',
            message=f'标记提醒已读: {reminder.title}',
            instance=reminder,
            old_values=old_values,
            new_values=model_to_dict(reminder),
            request=request
        )
        return Response({'status': 'success', 'message': '已标记已读'})

    @action(detail=True, methods=['post'], serializer_class=CreditReminderHandleSerializer)
    def handle(self, request, pk=None):
        reminder = self.get_object()
        serializer = CreditReminderHandleSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        old_values = model_to_dict(reminder)
        reminder.is_handled = True
        reminder.handled_by = request.user
        reminder.handled_at = timezone.now()
        reminder.handle_note = serializer.validated_data['handle_note']
        reminder.save()
        log_action(
            user=request.user,
            action='update',
            message=f'处理提醒: {reminder.title}, 处理备注: {reminder.handle_note}',
            instance=reminder,
            old_values=old_values,
            new_values=model_to_dict(reminder),
            request=request
        )
        return Response({'status': 'success', 'message': '已处理'})
