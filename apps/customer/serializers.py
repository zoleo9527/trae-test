from rest_framework import serializers
from .models import Customer, WasteType


class CustomerSerializer(serializers.ModelSerializer):
    used_credit = serializers.SerializerMethodField()
    remaining_credit = serializers.SerializerMethodField()
    created_by_name = serializers.CharField(source='created_by.username', read_only=True)

    class Meta:
        model = Customer
        fields = '__all__'
        read_only_fields = ('created_by', 'updated_by')

    def get_used_credit(self, obj):
        return float(obj.get_used_credit())

    def get_remaining_credit(self, obj):
        return float(obj.get_remaining_credit())


class CustomerListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = ('id', 'code', 'name', 'type', 'contact', 'phone', 'credit_level', 'is_active')


class WasteTypeSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source='created_by.username', read_only=True)

    class Meta:
        model = WasteType
        fields = '__all__'
        read_only_fields = ('created_by', 'updated_by')


class WasteTypeListSerializer(serializers.ModelSerializer):
    class Meta:
        model = WasteType
        fields = ('id', 'code', 'name', 'category', 'unit', 'default_price', 'is_active')
