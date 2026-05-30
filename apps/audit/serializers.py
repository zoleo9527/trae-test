from rest_framework import serializers
from .models import AuditLog, Notification, OverdueReminder
from apps.common.serializers import SimpleUserSerializer


class AuditLogSerializer(serializers.ModelSerializer):
    action_display = serializers.CharField(source='get_action_display', read_only=True)
    user_info = SimpleUserSerializer(source='user', read_only=True)

    class Meta:
        model = AuditLog
        fields = '__all__'


class NotificationSerializer(serializers.ModelSerializer):
    type_display = serializers.CharField(source='get_type_display', read_only=True)
    recipient_info = SimpleUserSerializer(source='recipient', read_only=True)
    sender_info = SimpleUserSerializer(source='sender', read_only=True)

    class Meta:
        model = Notification
        fields = '__all__'


class OverdueReminderSerializer(serializers.ModelSerializer):
    type_display = serializers.CharField(source='get_type_display', read_only=True)

    class Meta:
        model = OverdueReminder
        fields = '__all__'
