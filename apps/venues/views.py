from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Venue, VenueArea
from .serializers import VenueSerializer, VenueListSerializer, VenueAreaSerializer
from apps.common.permissions import IsManager


class VenueViewSet(viewsets.ModelViewSet):
    queryset = Venue.objects.all()
    serializer_class = VenueSerializer
    permission_classes = [IsManager]

    def get_serializer_class(self):
        if self.action == 'list':
            return VenueListSerializer
        return VenueSerializer

    @action(detail=True, methods=['get'])
    def areas(self, request, pk=None):
        venue = self.get_object()
        areas = VenueArea.objects.filter(venue=venue)
        serializer = VenueAreaSerializer(areas, many=True)
        return Response(serializer.data)


class VenueAreaViewSet(viewsets.ModelViewSet):
    queryset = VenueArea.objects.all()
    serializer_class = VenueAreaSerializer
    permission_classes = [IsManager]
