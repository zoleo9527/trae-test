from rest_framework import serializers
from .models import Device
from apps.common.serializers import SimpleVenueSerializer, SimpleVenueAreaSerializer


class DeviceSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    venue_info = SimpleVenueSerializer(source='venue', read_only=True)
    area_info = SimpleVenueAreaSerializer(source='area', read_only=True)

    class Meta:
        model = Device
        fields = '__all__'


class DeviceListSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    venue_name = serializers.CharField(source='venue.name', read_only=True)

    class Meta:
        model = Device
        fields = ['id', 'name', 'code', 'category', 'category_display', 'brand', 'model', 'status', 'status_display', 'venue_name']
