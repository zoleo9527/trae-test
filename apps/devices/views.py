from rest_framework import viewsets
from .models import Device
from .serializers import DeviceSerializer, DeviceListSerializer
from apps.common.permissions import IsManager, IsInspector


class DeviceViewSet(viewsets.ModelViewSet):
    queryset = Device.objects.select_related('venue', 'area').all()
    serializer_class = DeviceSerializer
    permission_classes = [IsInspector]

    def get_serializer_class(self):
        if self.action == 'list':
            return DeviceListSerializer
        return DeviceSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [IsInspector()]
        return [IsManager()]
