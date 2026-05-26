from rest_framework import viewsets, mixins
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from .models import AuditLog
from .serializers import AuditLogSerializer, AuditLogListSerializer
from apps.base.permissions import CanViewAuditLog


class AuditLogViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    queryset = AuditLog.objects.all()
    permission_classes = [CanViewAuditLog]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['user', 'action', 'model_name', 'object_id']
    search_fields = ['username', 'model_name', 'object_repr', 'message', 'ip_address']
    ordering_fields = ['-created_at']

    def get_serializer_class(self):
        if self.action == 'list':
            return AuditLogListSerializer
        return AuditLogSerializer

    def get_queryset(self):
        queryset = AuditLog.objects.all()
        from apps.base.permissions import get_user_role
        user_role = get_user_role(self.request.user)
        if user_role != 'site_admin' and not self.request.user.is_superuser:
            queryset = queryset.filter(user=self.request.user)
        return queryset
