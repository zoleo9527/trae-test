from rest_framework import serializers
from .models import WeightTicket, PriceAdjustment
from apps.customer.serializers import CustomerListSerializer, WasteTypeListSerializer


class WeightTicketSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    waste_type_name = serializers.CharField(source='waste_type.name', read_only=True)
    reviewed_by_name = serializers.CharField(source='reviewed_by.username', read_only=True)
    created_by_name = serializers.CharField(source='created_by.username', read_only=True)

    class Meta:
        model = WeightTicket
        fields = '__all__'
        read_only_fields = (
            'created_by', 'updated_by', 'reviewed_by', 'reviewed_at',
            'ticket_no', 'net_weight', 'total_amount'
        )

    def validate(self, data):
        if data.get('gross_weight') and data.get('tare_weight'):
            if data['gross_weight'] < data['tare_weight']:
                raise serializers.ValidationError('毛重不能小于皮重')
        if not data.get('gross_weight') or not data.get('tare_weight'):
            raise serializers.ValidationError('毛重和皮重为必填项')
        if not data.get('unit_price'):
            raise serializers.ValidationError('单价为必填项')
        return data


class WeightTicketListSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    waste_type_name = serializers.CharField(source='waste_type.name', read_only=True)

    class Meta:
        model = WeightTicket
        fields = ('id', 'ticket_no', 'customer_name', 'waste_type_name',
                  'net_weight', 'total_amount', 'payment_method', 'status', 'weigh_time')


class WeightTicketApproveSerializer(serializers.Serializer):
    remark = serializers.CharField(required=False, allow_blank=True)


class WeightTicketRejectSerializer(serializers.Serializer):
    reject_reason = serializers.CharField(required=True)


class PriceAdjustmentSerializer(serializers.ModelSerializer):
    waste_type_name = serializers.CharField(source='waste_type.name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.username', read_only=True)

    class Meta:
        model = PriceAdjustment
        fields = '__all__'
        read_only_fields = ('created_by', 'updated_by')


class PriceAdjustmentListSerializer(serializers.ModelSerializer):
    waste_type_name = serializers.CharField(source='waste_type.name', read_only=True)

    class Meta:
        model = PriceAdjustment
        fields = ('id', 'waste_type_name', 'old_price', 'new_price', 'effective_date', 'is_effective', 'created_at')
