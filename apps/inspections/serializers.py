from rest_framework import serializers
from .models import (
    InspectionRecord, InspectionStatus, InspectionType,
    InspectionItemResult, CheckItemCategory,
    InspectionPlan, CheckItem
)
from apps.common.serializers import SimpleVenueSerializer, SimpleUserSerializer, SimpleDeviceSerializer
from apps.repairs.serializers import SimpleRepairSerializer


class CheckItemSerializer(serializers.ModelSerializer):
    category_display = serializers.CharField(source='get_category_display', read_only=True)

    class Meta:
        model = CheckItem
        fields = '__all__'


class InspectionPlanSerializer(serializers.ModelSerializer):
    type_display = serializers.CharField(source='get_type_display', read_only=True)
    venue_info = SimpleVenueSerializer(source='venue', read_only=True)
    check_items = CheckItemSerializer(many=True, read_only=True)

    class Meta:
        model = InspectionPlan
        fields = '__all__'


class InspectionItemResultSerializer(serializers.ModelSerializer):
    item_category_display = serializers.CharField(source='get_item_category_display', read_only=True)
    device_info = SimpleDeviceSerializer(source='device', read_only=True)

    class Meta:
        model = InspectionItemResult
        fields = '__all__'


class InspectionRecordSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    type_display = serializers.CharField(source='get_type_display', read_only=True)
    venue_info = SimpleVenueSerializer(source='venue', read_only=True)
    inspector_info = SimpleUserSerializer(source='inspector', read_only=True)
    reviewer_info = SimpleUserSerializer(source='reviewer', read_only=True)
    item_results = InspectionItemResultSerializer(many=True, read_only=True)
    repair_tickets = SimpleRepairSerializer(many=True, read_only=True)
    available_actions = serializers.SerializerMethodField()
    can_create_repair = serializers.SerializerMethodField()

    class Meta:
        model = InspectionRecord
        fields = '__all__'

    def get_available_actions(self, obj):
        user = self.context['request'].user
        actions = []
        if obj.status == InspectionStatus.DRAFT:
            if user == obj.inspector or user.role in ['admin', 'manager']:
                actions.append('submit')
        elif obj.status in [InspectionStatus.SUBMITTED, InspectionStatus.REVIEWING, InspectionStatus.NEEDS_REVIEW]:
            if user.role in ['admin', 'manager']:
                actions.append('approve')
                actions.append('reject')
                actions.append('needs_review')
        elif obj.status == InspectionStatus.APPROVED:
            if user.role in ['admin', 'manager']:
                actions.append('complete')
        return actions

    def get_can_create_repair(self, obj):
        return obj.can_create_repair()


class InspectionRecordListSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    type_display = serializers.CharField(source='get_type_display', read_only=True)
    venue_name = serializers.CharField(source='venue.name', read_only=True)
    inspector_name = serializers.CharField(source='inspector.username', read_only=True)

    class Meta:
        model = InspectionRecord
        fields = ['id', 'title', 'type', 'type_display', 'status', 'status_display',
                  'venue_name', 'inspector_name', 'created_at', 'is_overdue']
