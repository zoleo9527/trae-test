from rest_framework import serializers
from .models import Venue, VenueArea
from apps.common.serializers import SimpleUserSerializer


class VenueAreaSerializer(serializers.ModelSerializer):
    class Meta:
        model = VenueArea
        fields = '__all__'


class VenueSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    manager_info = SimpleUserSerializer(source='manager', read_only=True)
    areas = VenueAreaSerializer(many=True, read_only=True)

    class Meta:
        model = Venue
        fields = '__all__'


class VenueListSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    manager_name = serializers.CharField(source='manager.username', read_only=True)

    class Meta:
        model = Venue
        fields = ['id', 'name', 'code', 'address', 'status', 'status_display', 'phone', 'manager_name']
