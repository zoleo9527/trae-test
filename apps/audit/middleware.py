import json
from django.utils.deprecation import MiddlewareMixin
from .models import AuditLog


class AuditLogMiddleware(MiddlewareMixin):
    def process_response(self, request, response):
        if not request.user.is_authenticated:
            return response

        path = request.path
        if not path.startswith('/api/') or path.startswith('/api/token/'):
            return response

        method = request.method
        if method in ['GET', 'HEAD', 'OPTIONS']:
            return response

        module = self._get_module_from_path(path)
        action = self._get_action_from_method(method)

        AuditLog.objects.create(
            user=request.user,
            username=request.user.username,
            action=action,
            module=module,
            ip_address=self._get_ip_address(request),
            user_agent=request.META.get('HTTP_USER_AGENT', ''),
            message=f'{request.user.username} 执行了 {action} 操作',
        )

        return response

    def _get_module_from_path(self, path):
        parts = path.strip('/').split('/')
        if len(parts) >= 2:
            return parts[1]
        return 'unknown'

    def _get_action_from_method(self, method):
        mapping = {
            'POST': 'create',
            'PUT': 'update',
            'PATCH': 'update',
            'DELETE': 'delete',
        }
        return mapping.get(method, 'other')

    def _get_ip_address(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip
