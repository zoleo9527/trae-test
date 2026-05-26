from rest_framework import serializers
from .models import CreditRecord, RepaymentRecord, CreditReminder


class CreditRecordSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    ticket_no = serializers.CharField(source='weight_ticket.ticket_no', read_only=True)
    reviewed_by_name = serializers.CharField(source='reviewed_by.username', read_only=True)
    created_by_name = serializers.CharField(source='created_by.username', read_only=True)
    repaid_amount = serializers.SerializerMethodField()
    remaining_amount = serializers.SerializerMethodField()

    class Meta:
        model = CreditRecord
        fields = '__all__'
        read_only_fields = ('created_by', 'updated_by', 'reviewed_by', 'reviewed_at', 'record_no')

    def get_repaid_amount(self, obj):
        return float(obj.get_repaid_amount())

    def get_remaining_amount(self, obj):
        return float(obj.get_remaining_amount())


class CreditRecordListSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.name', read_only=True)

    class Meta:
        model = CreditRecord
        fields = ('id', 'record_no', 'customer_name', 'amount', 'due_date', 'status', 'created_at')


class CreditRecordApproveSerializer(serializers.Serializer):
    remark = serializers.CharField(required=False, allow_blank=True)


class CreditRecordRejectSerializer(serializers.Serializer):
    reject_reason = serializers.CharField(required=True)


class RepaymentRecordSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    credit_record_no = serializers.CharField(source='credit_record.record_no', read_only=True)
    reviewed_by_name = serializers.CharField(source='reviewed_by.username', read_only=True)
    created_by_name = serializers.CharField(source='created_by.username', read_only=True)

    class Meta:
        model = RepaymentRecord
        fields = '__all__'
        read_only_fields = ('created_by', 'updated_by', 'reviewed_by', 'reviewed_at', 'record_no')


class RepaymentRecordListSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.name', read_only=True)

    class Meta:
        model = RepaymentRecord
        fields = ('id', 'record_no', 'customer_name', 'amount', 'payment_method', 'payment_time', 'status')


class CreditReminderSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    credit_record_no = serializers.CharField(source='credit_record.record_no', read_only=True)
    handled_by_name = serializers.CharField(source='handled_by.username', read_only=True)

    class Meta:
        model = CreditReminder
        fields = '__all__'


class CreditReminderListSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.name', read_only=True)

    class Meta:
        model = CreditReminder
        fields = ('id', 'title', 'customer_name', 'type', 'reminder_date', 'is_read', 'is_handled')


class CreditReminderHandleSerializer(serializers.Serializer):
    handle_note = serializers.CharField(required=True)
