from django.contrib import admin
from .models import User
from .models_audit import AuditLog


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ['username', 'role', 'email', 'phone', 'is_active', 'date_joined']
    list_filter = ['role', 'is_active']
    search_fields = ['username', 'email', 'phone']


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ['created_at', 'user', 'action', 'object_repr', 'ip_address']
    list_filter = ['action', 'created_at']
    search_fields = ['object_repr', 'user__username']
    readonly_fields = ['created_at']
