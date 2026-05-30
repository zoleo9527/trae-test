from rest_framework import serializers
from .models import RepairTicket, RepairStatus, RepairPriority, RepairCategory, RepairLog
from apps.common.serializers import SimpleVenueSerializer, SimpleVenueAreaSerializer, SimpleUserSerializer, SimpleDeviceSerializer


class SimpleRepairSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = RepairTicket
        fields = ['id', 'ticket_no', 'title', 'status', 'status_display', 'created_at']


class RepairLogSerializer(serializers.ModelSerializer):
    operator_info = SimpleUserSerializer(source='operator', read_only=True)

    class Meta:
        model = RepairLog
        fields = '__all__'


class RepairTicketSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    venue_info = SimpleVenueSerializer(source='venue', read_only=True)
    device_info = SimpleDeviceSerializer(source='device', read_only=True)
    area_info = SimpleVenueAreaSerializer(source='area', read_only=True)
    reporter_info = SimpleUserSerializer(source='reporter', read_only=True)
    assignee_info = SimpleUserSerializer(source='assignee', read_only=True)
    logs = RepairLogSerializer(many=True, read_only=True)
    available_actions = serializers.SerializerMethodField()

    class Meta:
        model = RepairTicket
        fields = '__all__'

    def get_available_actions(self, obj):
        user = self.context['request'].user
        return obj.get_flow_actions(user)


class RepairTicketListSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    venue_name = serializers.CharField(source='venue.name', read_only=True)
    device_name = serializers.CharField(source='device.name', read_only=True)
    assignee_name = serializers.CharField(source='assignee.username', read_only=True)

    class Meta:
        model = RepairTicket
        fields = ['id', 'ticket_no', 'title', 'priority', 'priority_display', 'status',
                  'status_display', 'venue_name', 'device_name', 'assignee_name',
                  'created_at', 'is_overdue']
