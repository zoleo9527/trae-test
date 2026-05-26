from rest_framework import serializers
from django.contrib.auth.models import User
from .models import UserRole


class UserRoleSerializer(serializers.ModelSerializer):
    role_display = serializers.CharField(source='get_role_display', read_only=True)

    class Meta:
        model = UserRole
        fields = ['role', 'role_display', 'description']


class UserSerializer(serializers.ModelSerializer):
    role_info = serializers.SerializerMethodField()
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'full_name', 'is_staff', 'is_superuser', 'role_info']

    def get_role_info(self, obj):
        try:
            return UserRoleSerializer(obj.user_role).data
        except UserRole.DoesNotExist:
            return None

    def get_full_name(self, obj):
        return f'{obj.first_name} {obj.last_name}'.strip() or obj.username
