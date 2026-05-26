from django.contrib import admin
from .models import MembershipPlan, MembershipCard, RechargeRecord, ConsumptionRecord


@admin.register(MembershipPlan)
class MembershipPlanAdmin(admin.ModelAdmin):
    list_display = ['name', 'plan_type', 'price', 'value', 'times', 'duration_days', 'is_active']
    list_filter = ['plan_type', 'is_active']
    search_fields = ['name']


@admin.register(MembershipCard)
class MembershipCardAdmin(admin.ModelAdmin):
    list_display = ['card_number', 'student', 'plan', 'balance', 'remaining_times', 'status', 'start_date', 'end_date']
    list_filter = ['status', 'start_date', 'end_date']
    search_fields = ['card_number', 'student__name', 'student__phone']
    date_hierarchy = 'created_at'


@admin.register(RechargeRecord)
class RechargeRecordAdmin(admin.ModelAdmin):
    list_display = ['membership', 'amount', 'value_added', 'payment_method', 'operator', 'created_at']
    list_filter = ['payment_method', 'created_at']
    search_fields = ['membership__card_number', 'transaction_no']
    date_hierarchy = 'created_at'


@admin.register(ConsumptionRecord)
class ConsumptionRecordAdmin(admin.ModelAdmin):
    list_display = ['membership', 'consumption_type', 'amount', 'times_deducted', 'operator', 'created_at']
    list_filter = ['consumption_type', 'created_at']
    search_fields = ['membership__card_number']
    date_hierarchy = 'created_at'
