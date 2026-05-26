from django.utils.deprecation import MiddlewareMixin
from .models_audit import AuditLog
from django.contrib.contenttypes.models import ContentType
import json


class AuditLogMiddleware(MiddlewareMixin):
    def process_request(self, request):
        if request.method in ['POST', 'PUT', 'PATCH', 'DELETE'] and request.user.is_authenticated:
            request._audit_body = request.body

    def process_response(self, request, response):
        try:
            if request.method in ['POST', 'PUT', 'PATCH', 'DELETE'] and request.user.is_authenticated:
                if hasattr(request, '_audit_body') and request._audit_body:
                    try:
                        body = json.loads(request._audit_body)
                    except:
                        body = None

                    if body:
                        AuditLog.objects.create(
                            user=request.user,
                            action=AuditLog.Action.UPDATE if request.method in ['PUT', 'PATCH'] else
                                   AuditLog.Action.CREATE if request.method == 'POST' else AuditLog.Action.DELETE,
                            object_repr=request.path,
                            new_value=body if request.method in ['POST', 'PUT', 'PATCH'] else None,
                            ip_address=request.META.get('REMOTE_ADDR'),
                            user_agent=request.META.get('HTTP_USER_AGENT', '')[:500]
                        )
        except Exception:
            pass
        return response
