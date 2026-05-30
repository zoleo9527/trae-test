from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from .models import AuditLog, Notification, OverdueReminder
from .serializers import AuditLogSerializer, NotificationSerializer, OverdueReminderSerializer
from apps.common.permissions import IsAdmin, IsManager


class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AuditLog.objects.select_related('user').all()
    serializer_class = AuditLogSerializer
    permission_classes = [IsManager]
    filterset_fields = ['module', 'action', 'username']
    search_fields = ['message', 'object_repr']


class NotificationViewSet(viewsets.ModelViewSet):
    queryset = Notification.objects.select_related('recipient', 'sender').all()
    serializer_class = NotificationSerializer
    permission_classes = [IsManager]

    def get_queryset(self):
        user = self.request.user
        if user.role in ['admin', 'manager']:
            return Notification.objects.all()
        return Notification.objects.filter(recipient=user)

    @action(detail=False, methods=['get'])
    def unread(self, request):
        notifications = self.get_queryset().filter(is_read=False)
        serializer = self.get_serializer(notifications, many=True)
        return Response({
            'count': notifications.count(),
            'results': serializer.data
        })

    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        notification = self.get_object()
        notification.is_read = True
        notification.read_at = timezone.now()
        notification.save()
        serializer = self.get_serializer(notification)
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        self.get_queryset().filter(is_read=False).update(is_read=True, read_at=timezone.now())
        return Response({'status': 'success'})


class OverdueReminderViewSet(viewsets.ModelViewSet):
    queryset = OverdueReminder.objects.all()
    serializer_class = OverdueReminderSerializer
    permission_classes = [IsManager]

    @action(detail=True, methods=['post'])
    def handle(self, request, pk=None):
        reminder = self.get_object()
        reminder.is_handled = True
        reminder.handled_by = request.user
        reminder.handled_at = timezone.now()
        reminder.save()
        serializer = self.get_serializer(reminder)
        return Response(serializer.data)
