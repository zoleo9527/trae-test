from django.contrib import admin

from apps.tea.models import (
    ActivitySubmission, AuditLog, Batch, InventoryRecord, Order, OrderItem,
    PriceApproval, Product, Shipment, ShipmentItem, Store, TrialFollowUp,
    Warehouse,
)


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('sku', 'name', 'category', 'base_unit_price', 'unit', 'status')
    list_filter = ('category', 'status')
    search_fields = ('sku', 'name')


@admin.register(Warehouse)
class WarehouseAdmin(admin.ModelAdmin):
    list_display = ('code', 'name', 'region', 'manager', 'is_active')
    list_filter = ('region', 'is_active')
    search_fields = ('code', 'name')


@admin.register(Store)
class StoreAdmin(admin.ModelAdmin):
    list_display = ('code', 'name', 'region', 'phone', 'responsible_warehouse', 'is_active')
    list_filter = ('region', 'is_active')
    search_fields = ('code', 'name', 'phone')


@admin.register(Batch)
class BatchAdmin(admin.ModelAdmin):
    list_display = ('batch_no', 'product', 'warehouse', 'production_date', 'initial_quantity', 'status')
    list_filter = ('status', 'warehouse')
    search_fields = ('batch_no', 'product__sku', 'product__name')


@admin.register(InventoryRecord)
class InventoryRecordAdmin(admin.ModelAdmin):
    list_display = ('batch', 'change_type', 'direction', 'change_quantity', 'balance_after', 'created_at')
    list_filter = ('change_type', 'reference_type')
    search_fields = ('batch__batch_no',)


@admin.register(PriceApproval)
class PriceApprovalAdmin(admin.ModelAdmin):
    list_display = ('code', 'product', 'store', 'proposed_unit_price', 'status', 'submitter', 'approver', 'created_at')
    list_filter = ('status',)
    search_fields = ('code', 'product__sku', 'product__name')
    readonly_fields = ('approved_at',)


@admin.register(ActivitySubmission)
class ActivitySubmissionAdmin(admin.ModelAdmin):
    list_display = ('code', 'activity_name', 'activity_type', 'price_approval', 'status', 'submitter', 'approver')
    list_filter = ('status', 'activity_type')
    search_fields = ('code', 'activity_name')


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('code', 'store', 'activity', 'status', 'total_amount', 'submitter', 'created_at')
    list_filter = ('status',)
    search_fields = ('code', 'store__name')


@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    list_display = ('order', 'product', 'quantity', 'unit_price', 'activity_price_applied')
    list_filter = ('activity_price_applied',)


@admin.register(Shipment)
class ShipmentAdmin(admin.ModelAdmin):
    list_display = ('code', 'order', 'from_warehouse', 'status', 'shipped_at', 'received_at')
    list_filter = ('status',)
    search_fields = ('code', 'tracking_no')


@admin.register(ShipmentItem)
class ShipmentItemAdmin(admin.ModelAdmin):
    list_display = ('shipment', 'order_item', 'batch', 'shipped_quantity')


@admin.register(TrialFollowUp)
class TrialFollowUpAdmin(admin.ModelAdmin):
    list_display = ('code', 'activity', 'store', 'visit_date', 'result', 'next_visit_date')
    list_filter = ('result',)
    search_fields = ('code', 'store__name')


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ('model_name', 'record_id', 'action', 'field_name', 'operator', 'created_at')
    list_filter = ('model_name', 'action')
    search_fields = ('record_id', 'record_code')
    readonly_fields = (
        'model_name', 'record_id', 'record_code', 'action', 'field_name',
        'old_value', 'new_value', 'operator', 'ip_address', 'created_at',
    )

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False
