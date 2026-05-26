from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.contrib.auth import login, logout
from .models import User
from .models_audit import AuditLog
from .serializers import UserSerializer, LoginSerializer, AuditLogSerializer
from .services import UserService, AuditService, ExportService
from .permissions import IsDirector
from .exceptions import PermissionDeniedException


class AuthViewSet(viewsets.GenericViewSet):
    permission_classes = [AllowAny]

    @action(detail=False, methods=['post'])
    def login(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        login(request, user)

        AuditService.log_action(
            user=user,
            action=AuditLog.Action.LOGIN,
            ip_address=request.META.get('REMOTE_ADDR'),
            user_agent=request.META.get('HTTP_USER_AGENT', '')[:500]
        )

        return Response({
            'code': 200,
            'message': '登录成功',
            'data': UserSerializer(user).data
        })

    @action(detail=False, methods=['post'])
    def logout(self, request):
        if request.user.is_authenticated:
            AuditService.log_action(
                user=request.user,
                action=AuditLog.Action.LOGOUT,
                ip_address=request.META.get('REMOTE_ADDR')
            )
        logout(request)
        return Response({'code': 200, 'message': '退出成功', 'data': None})

    @action(detail=False, methods=['get'])
    def me(self, request):
        if not request.user.is_authenticated:
            raise PermissionDeniedException('请先登录')
        return Response({
            'code': 200,
            'message': 'success',
            'data': UserSerializer(request.user).data
        })


class UserViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [IsDirector()]
        return super().get_permissions()

    def list(self, request):
        role = request.query_params.get('role')
        is_active = request.query_params.get('is_active')
        search = request.query_params.get('search')

        queryset = UserService.list_users(role=role, is_active=is_active, search=search)
        page = self.paginate_queryset(queryset)
        serializer = self.get_serializer(page, many=True)
        return self.get_paginated_response(serializer.data)


class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AuditLog.objects.all()
    serializer_class = AuditLogSerializer
    permission_classes = [IsDirector]

    def list(self, request):
        action = request.query_params.get('action')
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        content_type = request.query_params.get('content_type')
        object_id = request.query_params.get('object_id')
        search = request.query_params.get('search')

        queryset = AuditService.list_logs(
            action=action,
            start_date=start_date,
            end_date=end_date,
            content_type=content_type,
            object_id=object_id,
            search=search
        )

        if request.query_params.get('export') == '1':
            fields = [
                {'label': '操作时间', 'value': 'created_at', 'width': 20},
                {'label': '操作人', 'value': lambda o: o.user.username if o.user else '系统', 'width': 12},
                {'label': '操作类型', 'value': lambda o: o.get_action_display(), 'width': 12},
                {'label': '操作对象', 'value': 'object_repr', 'width': 30},
                {'label': 'IP地址', 'value': 'ip_address', 'width': 15},
            ]
            return ExportService.export_to_excel(queryset, fields, 'audit_logs')

        page = self.paginate_queryset(queryset)
        serializer = self.get_serializer(page, many=True)
        return self.get_paginated_response(serializer.data)

    @action(detail=False, methods=['get'])
    def trail(self, request):
        content_type = request.query_params.get('content_type')
        object_id = request.query_params.get('object_id')
        if not content_type or not object_id:
            return Response({'code': 400, 'message': '缺少content_type或object_id参数', 'data': None}, status=400)

        queryset = AuditService.get_trail_for_instance(content_type, object_id)
        serializer = self.get_serializer(queryset, many=True)
        return Response({'code': 200, 'message': 'success', 'data': serializer.data})
