from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AuditLogViewSet, NotificationViewSet, OverdueReminderViewSet

router = DefaultRouter()
router.register(r'audit-logs', AuditLogViewSet, basename='audit-log')
router.register(r'notifications', NotificationViewSet, basename='notification')
router.register(r'overdue-reminders', OverdueReminderViewSet, basename='overdue-reminder')

urlpatterns = [
    path('', include(router.urls)),
]
