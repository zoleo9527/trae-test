from rest_framework import serializers
from .models import CreditRecord, RepaymentRecord, CreditReminder
from apps.weight.models import WeightTicket


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
        read_only_fields = (
            'created_by', 'updated_by', 'reviewed_by', 'reviewed_at',
            'record_no', 'amount', 'customer'
        )

    def validate_weight_ticket(self, value):
        if not value:
            raise serializers.ValidationError('必须关联磅单')
        if value.status != 'approved':
            raise serializers.ValidationError('只有已审核通过的磅单才能生成赊账')
        if value.payment_method != 'credit':
            raise serializers.ValidationError('只有付款方式为赊账的磅单才能生成赊账')
        existing_credit = CreditRecord.objects.filter(weight_ticket=value).first()
        if existing_credit:
            raise serializers.ValidationError(f'该磅单已生成赊账记录: {existing_credit.record_no}')
        return value

    def validate(self, data):
        weight_ticket = data.get('weight_ticket')
        if weight_ticket:
            customer = weight_ticket.customer
            data['customer'] = customer
            data['amount'] = weight_ticket.total_amount
            used_credit = customer.get_used_credit()
            remaining_limit = customer.credit_limit - used_credit
            if weight_ticket.total_amount > remaining_limit:
                raise serializers.ValidationError(
                    f'客户赊账额度不足，剩余额度: {float(remaining_limit)}元，当前赊账金额: {float(weight_ticket.total_amount)}元'
                )
        return data

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
        read_only_fields = (
            'created_by', 'updated_by', 'reviewed_by', 'reviewed_at',
            'record_no', 'customer'
        )

    def validate_credit_record(self, value):
        if not value:
            raise serializers.ValidationError('必须关联赊账记录')
        if value.status != 'approved':
            raise serializers.ValidationError('只能对已确认的赊账记录进行回款')
        return value

    def validate(self, data):
        credit_record = data.get('credit_record')
        if credit_record:
            customer = credit_record.customer
            input_customer = data.get('customer')

            if input_customer and input_customer != customer:
                raise serializers.ValidationError(
                    f'客户不匹配，该赊账记录属于客户: {customer.name}'
                )

            data['customer'] = customer

            remaining = credit_record.get_remaining_amount()
            pending_total = credit_record.get_pending_repayments_total()
            effective_remaining = remaining - pending_total

            if data['amount'] > effective_remaining:
                raise serializers.ValidationError(
                    f'回款金额将超额，剩余可用额度: {float(effective_remaining)}元，'
                    f'当前剩余欠款: {float(remaining)}元，'
                    f'已有待确认回款: {float(pending_total)}元'
                )

            if data['amount'] <= 0:
                raise serializers.ValidationError('回款金额必须大于0')

        return data


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
