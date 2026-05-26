from rest_framework import serializers
from .models import ReconciliationBatch, ReconciliationRecord, AttendanceSummary
from apps.core.serializers import UserSerializer


class ReconciliationRecordSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = ReconciliationRecord
        fields = '__all__'


class ReconciliationBatchSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    operator_info = UserSerializer(source='operator', read_only=True)
    records = ReconciliationRecordSerializer(many=True, read_only=True)

    class Meta:
        model = ReconciliationBatch
        fields = '__all__'
        read_only_fields = ['operator', 'total_schedules', 'processed_schedules', 'success_count', 'fail_count', 'total_amount']


class AttendanceSummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = AttendanceSummary
        fields = '__all__'


class BatchCreateSerializer(serializers.Serializer):
    start_date = serializers.DateField(required=True)
    end_date = serializers.DateField(required=True)
    notes = serializers.CharField(required=False, max_length=500)
