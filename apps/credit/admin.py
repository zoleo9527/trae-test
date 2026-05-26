from django.contrib import admin
from .models import CreditRecord, RepaymentRecord, CreditReminder


@admin.register(CreditRecord)
class CreditRecordAdmin(admin.ModelAdmin):
    list_display = ('record_no', 'customer', 'amount', 'due_date', 'status', 'created_at')
    list_filter = ('status', 'due_date')
    search_fields = ('record_no', 'customer__name')
    readonly_fields = ('created_at', 'updated_at', 'created_by', 'updated_by')


@admin.register(RepaymentRecord)
class RepaymentRecordAdmin(admin.ModelAdmin):
    list_display = ('record_no', 'customer', 'amount', 'payment_method', 'payment_time', 'status')
    list_filter = ('status', 'payment_method', 'payment_time')
    search_fields = ('record_no', 'customer__name')
    readonly_fields = ('created_at', 'updated_at', 'created_by', 'updated_by')


@admin.register(CreditReminder)
class CreditReminderAdmin(admin.ModelAdmin):
    list_display = ('title', 'customer', 'type', 'reminder_date', 'is_read', 'is_handled', 'created_at')
    list_filter = ('type', 'is_read', 'is_handled', 'reminder_date')
    search_fields = ('title', 'customer__name')
    readonly_fields = ('created_at', 'updated_at', 'created_by', 'updated_by')
