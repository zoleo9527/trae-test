from rest_framework import serializers
from apps.users.models import User
from apps.venues.models import Venue, VenueArea
from apps.devices.models import Device
from apps.inspections.models import InspectionRecord, InspectionItemResult
from apps.repairs.models import RepairTicket, RepairLog


class SimpleUserSerializer(serializers.ModelSerializer):
    role_display = serializers.CharField(source='get_role_display', read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'role', 'role_display', 'phone']


class SimpleVenueSerializer(serializers.ModelSerializer):
    class Meta:
        model = Venue
        fields = ['id', 'name', 'code', 'address']


class SimpleVenueAreaSerializer(serializers.ModelSerializer):
    class Meta:
        model = VenueArea
        fields = ['id', 'name', 'code']


class SimpleDeviceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Device
        fields = ['id', 'name', 'code', 'category', 'status']


class SimpleInspectionSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = InspectionRecord
        fields = ['id', 'title', 'status', 'status_display', 'created_at']


class SimpleRepairSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = RepairTicket
        fields = ['id', 'ticket_no', 'title', 'status', 'status_display', 'created_at']
