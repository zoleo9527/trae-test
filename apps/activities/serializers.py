from rest_framework import serializers
from .models import Activity, ActivityRegistration, ActivityCategory, VolunteerFeedback, ActivityStatus, RegistrationStatus
from apps.common.serializers import SimpleVenueSerializer, SimpleVenueAreaSerializer, SimpleUserSerializer


class ActivityCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ActivityCategory
        fields = '__all__'


class ActivitySerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    venue_info = SimpleVenueSerializer(source='venue', read_only=True)
    area_info = SimpleVenueAreaSerializer(source='area', read_only=True)
    organizer_info = SimpleUserSerializer(source='organizer', read_only=True)

    class Meta:
        model = Activity
        fields = '__all__'


class ActivityListSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    venue_name = serializers.CharField(source='venue.name', read_only=True)

    class Meta:
        model = Activity
        fields = ['id', 'title', 'status', 'status_display', 'venue_name', 'start_time', 'end_time',
                  'max_participants', 'current_participants']


class ActivityRegistrationSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    activity_info = ActivityListSerializer(source='activity', read_only=True)
    user_info = SimpleUserSerializer(source='user', read_only=True)

    class Meta:
        model = ActivityRegistration
        fields = '__all__'


class VolunteerFeedbackSerializer(serializers.ModelSerializer):
    activity_info = ActivityListSerializer(source='activity', read_only=True)
    volunteer_info = SimpleUserSerializer(source='volunteer', read_only=True)
    handler_info = SimpleUserSerializer(source='handler', read_only=True)

    class Meta:
        model = VolunteerFeedback
        fields = '__all__'
