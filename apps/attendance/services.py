from django.db import models
from django.db.models import Sum, Count, Q
from django.utils import timezone
from datetime import datetime, timedelta
from .models import ReconciliationBatch, ReconciliationRecord, AttendanceSummary
from apps.schedule.models import Schedule, Enrollment
from apps.membership.services import ConsumptionService
from apps.core.exceptions import StatusConflictException
from apps.core.services import AuditService
from apps.core.models_audit import AuditLog


class ReconciliationService:
    @staticmethod
    def list_batches(status=None, start_date=None, end_date=None):
        queryset = ReconciliationBatch.objects.select_related('operator').all()
        if status:
            queryset = queryset.filter(status=status)
        if start_date:
            queryset = queryset.filter(start_date__gte=start_date)
        if end_date:
            queryset = queryset.filter(end_date__lte=end_date)
        return queryset

    @staticmethod
    def create_batch(user, start_date, end_date, notes=''):
        schedules = Schedule.objects.filter(
            start_time__date__gte=start_date,
            start_time__date__lte=end_date,
            status=Schedule.Status.COMPLETED
        )

        batch = ReconciliationBatch.objects.create(
            start_date=start_date,
            end_date=end_date,
            total_schedules=schedules.count(),
            operator=user,
            notes=notes
        )

        AuditService.log_action(
            user=user,
            action=AuditLog.Action.CREATE,
            instance=batch,
            new_value={'start_date': str(start_date), 'end_date': str(end_date)}
        )
        return batch

    @staticmethod
    def process_batch(user, batch_id):
        batch = ReconciliationBatch.objects.filter(id=batch_id).first()
        if not batch:
            raise ValueError('对账批次不存在')

        if batch.status in [ReconciliationBatch.Status.PROCESSING, ReconciliationBatch.Status.COMPLETED]:
            raise StatusConflictException('该批次已在处理中或已完成')

        batch.status = ReconciliationBatch.Status.PROCESSING
        batch.save()

        schedules = Schedule.objects.filter(
            start_time__date__gte=batch.start_date,
            start_time__date__lte=batch.end_date,
            status=Schedule.Status.COMPLETED
        )

        success_count = 0
        fail_count = 0
        total_amount = 0

        for schedule in schedules:
            try:
                results = ConsumptionService.reconcile_for_schedule(user, schedule.id)
                s_count = sum(1 for r in results if r['success'])
                f_count = len(results) - s_count

                ReconciliationRecord.objects.create(
                    batch=batch,
                    schedule=schedule,
                    status=ReconciliationRecord.Status.SUCCESS if f_count == 0 else
                           ReconciliationRecord.Status.PARTIAL if s_count > 0 else ReconciliationRecord.Status.FAILED,
                    total_students=len(results),
                    success_count=s_count,
                    fail_count=f_count,
                    error_details='; '.join([r.get('error', '') for r in results if not r['success']])
                )

                success_count += s_count
                fail_count += f_count

                from apps.membership.models import ConsumptionRecord
                schedule_amount = ConsumptionRecord.objects.filter(
                    related_schedule_id=schedule.id
                ).aggregate(total=models.Sum('amount'))['total'] or 0
                total_amount += schedule_amount

            except Exception as e:
                ReconciliationRecord.objects.create(
                    batch=batch,
                    schedule=schedule,
                    status=ReconciliationRecord.Status.FAILED,
                    error_details=str(e)
                )
                fail_count += schedule.enrollments.count()

        batch.processed_schedules = schedules.count()
        batch.success_count = success_count
        batch.fail_count = fail_count
        batch.total_amount = total_amount
        batch.status = ReconciliationBatch.Status.COMPLETED if fail_count == 0 else ReconciliationBatch.Status.PARTIAL
        batch.completed_at = timezone.now()
        batch.save()

        AuditService.log_action(
            user=user,
            action=AuditLog.Action.UPDATE,
            instance=batch,
            old_value={'status': ReconciliationBatch.Status.PROCESSING},
            new_value={
                'status': batch.status,
                'success_count': success_count,
                'fail_count': fail_count,
                'total_amount': str(total_amount)
            }
        )
        return batch


class AttendanceSummaryService:
    @staticmethod
    def get_summary(start_date=None, end_date=None, by_week=False):
        queryset = AttendanceSummary.objects.all()
        if start_date:
            queryset = queryset.filter(date__gte=start_date)
        if end_date:
            queryset = queryset.filter(date__lte=end_date)

        if by_week:
            from django.db.models.functions import TruncWeek
            return queryset.annotate(
                week=TruncWeek('date')
            ).values('week').annotate(
                total_schedules=Sum('total_schedules'),
                total_enrollments=Sum('total_enrollments'),
                attended_count=Sum('attended_count'),
                absent_count=Sum('absent_count'),
                leave_count=Sum('leave_count'),
                total_consumption=Sum('total_consumption'),
            ).order_by('-week')

        return queryset

    @staticmethod
    def generate_daily_summary(date=None):
        date = date or (timezone.now() - timedelta(days=1)).date()

        schedules = Schedule.objects.filter(
            start_time__date=date,
            status__in=[Schedule.Status.COMPLETED, Schedule.Status.CONFIRMED]
        )

        enrollments = Enrollment.objects.filter(
            schedule__in=schedules
        )

        summary, created = AttendanceSummary.objects.update_or_create(
            date=date,
            defaults={
                'total_schedules': schedules.count(),
                'total_enrollments': enrollments.count(),
                'attended_count': enrollments.filter(status=Enrollment.Status.ATTENDED).count(),
                'absent_count': enrollments.filter(status=Enrollment.Status.ABSENT).count(),
                'leave_count': enrollments.filter(status=Enrollment.Status.LEAVE_APPROVED).count(),
                'attendance_rate': round(
                    enrollments.filter(status=Enrollment.Status.ATTENDED).count() /
                    enrollments.filter(status__in=[
                        Enrollment.Status.ATTENDED,
                        Enrollment.Status.ABSENT
                    ]).count() * 100 if enrollments.count() > 0 else 0,
                    2
                ),
            }
        )
        return summary
