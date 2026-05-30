from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AuditLogViewSet, NotificationViewSet, OverdueReminderViewSet

router = DefaultRouter()
router.register(r'audit-logs', AuditLogViewSet)
router.register(r'notifications', NotificationViewSet)
router.register(r'overdue-reminders', OverdueReminderViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
