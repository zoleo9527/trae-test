from django.contrib import admin
from .models import Customer, WasteType


@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = ('code', 'name', 'type', 'contact', 'phone', 'credit_limit', 'credit_level', 'is_active', 'created_at')
    list_filter = ('type', 'credit_level', 'is_active')
    search_fields = ('code', 'name', 'contact', 'phone')
    readonly_fields = ('created_at', 'updated_at', 'created_by', 'updated_by')


@admin.register(WasteType)
class WasteTypeAdmin(admin.ModelAdmin):
    list_display = ('code', 'name', 'category', 'unit', 'default_price', 'is_active')
    list_filter = ('category', 'is_active')
    search_fields = ('code', 'name')
    readonly_fields = ('created_at', 'updated_at', 'created_by', 'updated_by')
