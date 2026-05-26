from django.db import models
from django.db.models import Q, Sum, Count
from django.utils import timezone
from datetime import datetime, timedelta
from .models import MembershipPlan, MembershipCard, RechargeRecord, ConsumptionRecord
from apps.schedule.models import Student, Enrollment
from apps.core.exceptions import ValidationException, StatusConflictException, ResourceNotFoundException
from apps.core.services import AuditService
from apps.core.models_audit import AuditLog


class MembershipPlanService:
    @staticmethod
    def list_plans(plan_type=None, is_active=None, search=None):
        queryset = MembershipPlan.objects.all()
        if plan_type:
            queryset = queryset.filter(plan_type=plan_type)
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active)
        if search:
            queryset = queryset.filter(name__icontains=search)
        return queryset

    @staticmethod
    def create_plan(user, **kwargs):
        plan = MembershipPlan.objects.create(**kwargs)
        AuditService.log_action(
            user=user,
            action=AuditLog.Action.CREATE,
            instance=plan,
            new_value=kwargs
        )
        return plan


class MembershipCardService:
    @staticmethod
    def generate_card_number():
        import random
        prefix = 'SW' + timezone.now().strftime('%Y%m%d')
        suffix = str(random.randint(1000, 9999))
        return f'{prefix}{suffix}'

    @staticmethod
    def list_cards(student_id=None, status=None, plan_type=None, search=None, expire_soon=False):
        queryset = MembershipCard.objects.select_related('student', 'plan').all()
        if student_id:
            queryset = queryset.filter(student_id=student_id)
        if status:
            queryset = queryset.filter(status=status)
        if plan_type:
            queryset = queryset.filter(plan__plan_type=plan_type)
        if search:
            queryset = queryset.filter(
                Q(card_number__icontains=search) |
                Q(student__name__icontains=search) |
                Q(student__phone__icontains=search)
            )
        if expire_soon:
            thirty_days_later = timezone.now().date() + timedelta(days=30)
            queryset = queryset.filter(
                end_date__isnull=False,
                end_date__lte=thirty_days_later,
                end_date__gte=timezone.now().date(),
                status=MembershipCard.Status.ACTIVE
            )
        return queryset

    @staticmethod
    def create_card(user, student_id, plan_id, start_date=None, notes=''):
        student = Student.objects.filter(id=student_id).first()
        if not student:
            raise ResourceNotFoundException('学员不存在')

        plan = MembershipPlan.objects.filter(id=plan_id).first()
        if not plan:
            raise ResourceNotFoundException('套餐不存在')

        if not plan.is_active:
            raise ValidationException('该套餐已停售')

        start_date = start_date or timezone.now().date()
        end_date = None
        if plan.duration_days:
            end_date = start_date + timedelta(days=plan.duration_days)

        card = MembershipCard.objects.create(
            student=student,
            plan=plan,
            card_number=MembershipCardService.generate_card_number(),
            balance=plan.value,
            remaining_times=plan.times,
            start_date=start_date,
            end_date=end_date,
            notes=notes,
            created_by=user
        )

        RechargeRecord.objects.create(
            membership=card,
            plan=plan,
            amount=plan.price,
            value_added=plan.value,
            times_added=plan.times,
            payment_method=RechargeRecord.PaymentMethod.OTHER,
            operator=user,
            notes='开卡充值'
        )

        AuditService.log_action(
            user=user,
            action=AuditLog.Action.CREATE,
            instance=card,
            new_value={
                'student_id': student_id,
                'plan_id': plan_id,
                'card_number': card.card_number,
                'balance': str(plan.value),
                'remaining_times': plan.times,
            }
        )
        return card

    @staticmethod
    def check_balance(card, amount=0, times=0):
        if card.status != MembershipCard.Status.ACTIVE:
            raise StatusConflictException(f'储值卡状态为{card.get_status_display()}，无法使用')

        if card.end_date and card.end_date < timezone.now().date():
            raise StatusConflictException('储值卡已过期')

        if amount > 0 and card.balance < amount:
            raise ValidationException(f'余额不足，当前余额: {card.balance}, 需要: {amount}')

        if times and card.remaining_times is not None and card.remaining_times < times:
            raise ValidationException(f'次数不足，剩余次数: {card.remaining_times}, 需要: {times}')

        return True

    @staticmethod
    def update_card_status(user, card, new_status, notes=''):
        if card.status == new_status:
            return card

        allowed_transitions = {
            MembershipCard.Status.ACTIVE: [MembershipCard.Status.FROZEN, MembershipCard.Status.CANCELLED, MembershipCard.Status.EXPIRED],
            MembershipCard.Status.FROZEN: [MembershipCard.Status.ACTIVE, MembershipCard.Status.CANCELLED],
            MembershipCard.Status.EXPIRED: [],
            MembershipCard.Status.CANCELLED: [],
        }

        if new_status not in allowed_transitions.get(card.status, []):
            raise StatusConflictException(
                f'无法从 {card.get_status_display()} 变更为 {dict(MembershipCard.Status.choices)[new_status]}'
            )

        old_status = card.status
        card.status = new_status
        if notes:
            card.notes = (card.notes or '') + f'\n[{timezone.now()}] 状态变更: {notes}'
        card.save()

        AuditService.log_action(
            user=user,
            action=AuditLog.Action.STATUS_CHANGE,
            instance=card,
            old_value={'status': old_status},
            new_value={'status': new_status, 'notes': notes}
        )
        return card

    @staticmethod
    def get_card_chain(card_id):
        card = MembershipCard.objects.filter(id=card_id).select_related('student', 'plan').first()
        if not card:
            raise ResourceNotFoundException('储值卡不存在')

        recharges = card.recharges.select_related('operator').all()
        consumptions = card.consumptions.select_related('operator', 'related_schedule', 'related_schedule__course').all()

        return {
            'card': card,
            'recharges': recharges,
            'consumptions': consumptions,
            'stats': {
                'total_recharged': recharges.aggregate(Sum('amount'))['amount__sum'] or 0,
                'total_consumed': consumptions.aggregate(Sum('amount'))['amount__sum'] or 0,
                'recharge_count': recharges.count(),
                'consumption_count': consumptions.count(),
            }
        }


class RechargeService:
    @staticmethod
    def list_records(membership_id=None, payment_method=None, start_date=None, end_date=None, operator_id=None):
        queryset = RechargeRecord.objects.select_related('membership', 'membership__student', 'operator').all()
        if membership_id:
            queryset = queryset.filter(membership_id=membership_id)
        if payment_method:
            queryset = queryset.filter(payment_method=payment_method)
        if start_date:
            queryset = queryset.filter(created_at__gte=start_date)
        if end_date:
            queryset = queryset.filter(created_at__lte=end_date + timedelta(days=1))
        if operator_id:
            queryset = queryset.filter(operator_id=operator_id)
        return queryset

    @staticmethod
    def recharge(user, membership_id, plan_id, payment_method, transaction_no='', notes=''):
        card = MembershipCard.objects.filter(id=membership_id).first()
        if not card:
            raise ResourceNotFoundException('储值卡不存在')

        if card.status not in [MembershipCard.Status.ACTIVE, MembershipCard.Status.FROZEN]:
            raise StatusConflictException(f'储值卡状态为{card.get_status_display()}，无法充值')

        plan = MembershipPlan.objects.filter(id=plan_id).first()
        if not plan:
            raise ResourceNotFoundException('套餐不存在')

        record = RechargeRecord.objects.create(
            membership=card,
            plan=plan,
            amount=plan.price,
            value_added=plan.value,
            times_added=plan.times,
            payment_method=payment_method,
            transaction_no=transaction_no,
            operator=user,
            notes=notes
        )

        card.balance = models.F('balance') + plan.value
        if plan.times:
            card.remaining_times = models.F('remaining_times') + plan.times
        if card.status == MembershipCard.Status.FROZEN:
            card.status = MembershipCard.Status.ACTIVE
        card.save()
        card.refresh_from_db()

        AuditService.log_action(
            user=user,
            action=AuditLog.Action.CREATE,
            instance=record,
            new_value={
                'membership_id': membership_id,
                'plan_id': plan_id,
                'amount': str(plan.price),
                'payment_method': payment_method
            }
        )
        return record


class ConsumptionService:
    @staticmethod
    def list_records(membership_id=None, consumption_type=None, start_date=None, end_date=None, operator_id=None, schedule_id=None):
        queryset = ConsumptionRecord.objects.select_related(
            'membership', 'membership__student', 'operator', 'related_schedule', 'related_schedule__course'
        ).all()
        if membership_id:
            queryset = queryset.filter(membership_id=membership_id)
        if consumption_type:
            queryset = queryset.filter(consumption_type=consumption_type)
        if start_date:
            queryset = queryset.filter(created_at__gte=start_date)
        if end_date:
            queryset = queryset.filter(created_at__lte=end_date + timedelta(days=1))
        if operator_id:
            queryset = queryset.filter(operator_id=operator_id)
        if schedule_id:
            queryset = queryset.filter(related_schedule_id=schedule_id)
        return queryset

    @staticmethod
    def consume(user, membership_id, consumption_type, amount=0, times=0, schedule_id=None, enrollment_id=None, notes=''):
        card = MembershipCard.objects.filter(id=membership_id).first()
        if not card:
            raise ResourceNotFoundException('储值卡不存在')

        MembershipCardService.check_balance(card, amount, times)

        schedule = None
        enrollment = None
        if schedule_id:
            from apps.schedule.models import Schedule
            schedule = Schedule.objects.filter(id=schedule_id).first()
        if enrollment_id:
            enrollment = Enrollment.objects.filter(id=enrollment_id).first()

        if ConsumptionRecord.objects.filter(related_enrollment_id=enrollment_id).exists():
            raise StatusConflictException('该报名已产生消费记录，请勿重复扣费')

        record = ConsumptionRecord.objects.create(
            membership=card,
            consumption_type=consumption_type,
            amount=amount,
            times_deducted=times,
            related_schedule=schedule,
            related_enrollment=enrollment,
            operator=user,
            notes=notes
        )

        if amount > 0:
            card.balance = models.F('balance') - amount
        if times and card.remaining_times is not None:
            card.remaining_times = models.F('remaining_times') - times
        card.save()
        card.refresh_from_db()

        AuditService.log_action(
            user=user,
            action=AuditLog.Action.CREATE,
            instance=record,
            new_value={
                'membership_id': membership_id,
                'consumption_type': consumption_type,
                'amount': str(amount),
                'times': times,
                'enrollment_id': enrollment_id
            }
        )
        return record

    @staticmethod
    def reconcile_for_schedule(user, schedule_id):
        from apps.schedule.models import Schedule, Enrollment
        schedule = Schedule.objects.filter(id=schedule_id).first()
        if not schedule:
            raise ResourceNotFoundException('排班不存在')

        if schedule.status != Schedule.Status.COMPLETED:
            raise StatusConflictException('只有已完成的排班才能进行消课对账')

        enrollments = schedule.enrollments.filter(status=Enrollment.Status.ATTENDED)
        results = []

        for enrollment in enrollments:
            if ConsumptionRecord.objects.filter(related_enrollment_id=enrollment.id).exists():
                results.append({
                    'enrollment_id': enrollment.id,
                    'student_name': enrollment.student.name,
                    'success': False,
                    'error': '已存在消费记录'
                })
                continue

            membership = MembershipCard.objects.filter(
                student_id=enrollment.student_id,
                status=MembershipCard.Status.ACTIVE
            ).first()

            if not membership:
                results.append({
                    'enrollment_id': enrollment.id,
                    'student_name': enrollment.student.name,
                    'success': False,
                    'error': '无有效储值卡'
                })
                continue

            try:
                consumption = ConsumptionService.consume(
                    user=user,
                    membership_id=membership.id,
                    consumption_type=ConsumptionRecord.ConsumptionType.COURSE,
                    amount=0,
                    times=1,
                    schedule_id=schedule_id,
                    enrollment_id=enrollment.id,
                    notes=f'系统自动消课: {schedule.course.name}'
                )
                results.append({
                    'enrollment_id': enrollment.id,
                    'student_name': enrollment.student.name,
                    'success': True,
                    'consumption_id': consumption.id,
                    'times_deducted': consumption.times_deducted
                })
            except Exception as e:
                results.append({
                    'enrollment_id': enrollment.id,
                    'student_name': enrollment.student.name,
                    'success': False,
                    'error': str(e)
                })

        AuditService.log_action(
            user=user,
            action=AuditLog.Action.UPDATE,
            instance=schedule,
            new_value={'reconcile_results': results}
        )

        return results

    @staticmethod
    def get_financial_report(start_date=None, end_date=None):
        recharges = RechargeService.list_records(start_date=start_date, end_date=end_date)
        consumptions = ConsumptionService.list_records(start_date=start_date, end_date=end_date)

        recharge_stats = recharges.values('payment_method').annotate(
            total=Sum('amount'),
            count=Count('id')
        )

        consumption_stats = consumptions.values('consumption_type').annotate(
            total=Sum('amount'),
            count=Count('id')
        )

        return {
            'period': {
                'start_date': start_date,
                'end_date': end_date
            },
            'total_recharge': recharges.aggregate(Sum('amount'))['amount__sum'] or 0,
            'total_consumption': consumptions.aggregate(Sum('amount'))['amount__sum'] or 0,
            'recharge_count': recharges.count(),
            'consumption_count': consumptions.count(),
            'recharge_by_method': list(recharge_stats),
            'consumption_by_type': list(consumption_stats),
            'net_cash_flow': (recharges.aggregate(Sum('amount'))['amount__sum'] or 0) -
                            (consumptions.aggregate(Sum('amount'))['amount__sum'] or 0)
        }
