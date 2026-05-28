import logging
from django.utils.deprecation import MiddlewareMixin
from django.utils.timezone import now

logger = logging.getLogger(__name__)


class AuditLogMiddleware(MiddlewareMixin):
    """审计日志中间件，记录请求上下文"""

    def process_request(self, request):
        request._audit_start_time = now()
        request._audit_ip = self._get_client_ip(request)
        request._audit_user_agent = request.META.get('HTTP_USER_AGENT', '')[:512]

    def process_response(self, request, response):
        if hasattr(request, '_audit_start_time'):
            duration = (now() - request._audit_start_time).total_seconds()
            if duration > 3:
                logger.warning(
                    f'Slow request: {request.method} {request.path} '
                    f'from {getattr(request, "_audit_ip", "unknown")} '
                    f'took {duration:.2f}s'
                )
        return response

    def _get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            return x_forwarded_for.split(',')[0].strip()
        return request.META.get('REMOTE_ADDR')
