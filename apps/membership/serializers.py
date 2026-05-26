from rest_framework import serializers
from .models import MembershipPlan, MembershipCard, RechargeRecord, ConsumptionRecord
from apps.schedule.serializers import SimpleStudentSerializer
from apps.core.serializers import UserSerializer


class MembershipPlanSerializer(serializers.ModelSerializer):
    plan_type_display = serializers.CharField(source='get_plan_type_display', read_only=True)

    class Meta:
        model = MembershipPlan
        fields = '__all__'


class MembershipCardSerializer(serializers.ModelSerializer):
    student_info = SimpleStudentSerializer(source='student', read_only=True)
    plan_info = MembershipPlanSerializer(source='plan', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    created_by_info = UserSerializer(source='created_by', read_only=True)

    class Meta:
        model = MembershipCard
        fields = '__all__'
        read_only_fields = ['card_number', 'created_by', 'balance', 'remaining_times']


class RechargeRecordSerializer(serializers.ModelSerializer):
    membership_info = MembershipCardSerializer(source='membership', read_only=True)
    plan_info = MembershipPlanSerializer(source='plan', read_only=True)
    payment_method_display = serializers.CharField(source='get_payment_method_display', read_only=True)
    operator_info = UserSerializer(source='operator', read_only=True)

    class Meta:
        model = RechargeRecord
        fields = '__all__'
        read_only_fields = ['operator']


class ConsumptionRecordSerializer(serializers.ModelSerializer):
    membership_info = MembershipCardSerializer(source='membership', read_only=True)
    consumption_type_display = serializers.CharField(source='get_consumption_type_display', read_only=True)
    operator_info = UserSerializer(source='operator', read_only=True)

    class Meta:
        model = ConsumptionRecord
        fields = '__all__'
        read_only_fields = ['operator']


class RechargeCreateSerializer(serializers.Serializer):
    membership_id = serializers.IntegerField(required=True)
    plan_id = serializers.IntegerField(required=True)
    payment_method = serializers.ChoiceField(choices=RechargeRecord.PaymentMethod.choices)
    transaction_no = serializers.CharField(required=False, max_length=100)
    notes = serializers.CharField(required=False, max_length=500)


class ConsumptionCreateSerializer(serializers.Serializer):
    membership_id = serializers.IntegerField(required=True)
    consumption_type = serializers.ChoiceField(choices=ConsumptionRecord.ConsumptionType.choices)
    amount = serializers.DecimalField(required=True, max_digits=10, decimal_places=2, min_value=0)
    times = serializers.IntegerField(required=False, min_value=0, default=0)
    schedule_id = serializers.IntegerField(required=False)
    enrollment_id = serializers.IntegerField(required=False)
    notes = serializers.CharField(required=False, max_length=500)


class CardCreateSerializer(serializers.Serializer):
    student_id = serializers.IntegerField(required=True)
    plan_id = serializers.IntegerField(required=True)
    start_date = serializers.DateField(required=False)
    notes = serializers.CharField(required=False, max_length=500)


class CardStatusUpdateSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=MembershipCard.Status.choices)
    notes = serializers.CharField(required=False, max_length=500)
