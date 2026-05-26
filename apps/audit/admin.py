from django.contrib import admin
from .models import AuditLog


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ('username', 'action', 'model_name', 'object_repr', 'ip_address', 'created_at')
    list_filter = ('action', 'model_name', 'created_at')
    search_fields = ('username', 'model_name', 'object_repr', 'message', 'ip_address')
    readonly_fields = ('user', 'username', 'action', 'model_name', 'object_id', 'object_repr',
                       'ip_address', 'user_agent', 'path', 'method', 'message',
                       'old_values', 'new_values', 'created_at')

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False
