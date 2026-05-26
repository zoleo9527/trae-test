from django.contrib import admin
from .models import ReconciliationBatch, ReconciliationRecord, AttendanceSummary


@admin.register(ReconciliationBatch)
class ReconciliationBatchAdmin(admin.ModelAdmin):
    list_display = ['start_date', 'end_date', 'status', 'total_schedules', 'success_count', 'fail_count', 'operator', 'created_at']
    list_filter = ['status', 'created_at']
    date_hierarchy = 'created_at'


@admin.register(ReconciliationRecord)
class ReconciliationRecordAdmin(admin.ModelAdmin):
    list_display = ['batch', 'schedule', 'status', 'total_students', 'success_count', 'fail_count', 'processed_at']
    list_filter = ['status', 'processed_at']


@admin.register(AttendanceSummary)
class AttendanceSummaryAdmin(admin.ModelAdmin):
    list_display = ['date', 'total_schedules', 'total_enrollments', 'attended_count', 'attendance_rate', 'total_consumption']
    date_hierarchy = 'date'
