from django.contrib import admin
from .models import WeightTicket, PriceAdjustment


@admin.register(WeightTicket)
class WeightTicketAdmin(admin.ModelAdmin):
    list_display = ('ticket_no', 'customer', 'waste_type', 'net_weight', 'unit_price', 'total_amount', 'payment_method', 'status', 'weigh_time')
    list_filter = ('status', 'payment_method', 'waste_type')
    search_fields = ('ticket_no', 'customer__name', 'vehicle_no')
    readonly_fields = ('created_at', 'updated_at', 'created_by', 'updated_by')


@admin.register(PriceAdjustment)
class PriceAdjustmentAdmin(admin.ModelAdmin):
    list_display = ('waste_type', 'old_price', 'new_price', 'effective_date', 'is_effective', 'created_at')
    list_filter = ('is_effective', 'waste_type')
    search_fields = ('waste_type__name',)
    readonly_fields = ('created_at', 'updated_at', 'created_by', 'updated_by')
