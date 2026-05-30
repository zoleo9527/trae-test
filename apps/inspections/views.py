from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from .models import InspectionRecord, InspectionStatus, InspectionPlan, CheckItem, InspectionItemResult
from .serializers import (
    InspectionRecordSerializer, InspectionRecordListSerializer,
    InspectionPlanSerializer, CheckItemSerializer, InspectionItemResultSerializer
)
from .services import InspectionFlowService
from apps.common.permissions import IsInspector, IsManager


class InspectionPlanViewSet(viewsets.ModelViewSet):
    queryset = InspectionPlan.objects.select_related('venue').all()
    serializer_class = InspectionPlanSerializer
    permission_classes = [IsManager]


class CheckItemViewSet(viewsets.ModelViewSet):
    queryset = CheckItem.objects.select_related('plan').all()
    serializer_class = CheckItemSerializer
    permission_classes = [IsManager]


class InspectionRecordViewSet(viewsets.ModelViewSet):
    queryset = InspectionRecord.objects.select_related('venue', 'inspector', 'reviewer').all()
    serializer_class = InspectionRecordSerializer
    permission_classes = [IsInspector]

    def get_serializer_class(self):
        if self.action == 'list':
            return InspectionRecordListSerializer
        return InspectionRecordSerializer

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    def perform_create(self, serializer):
        serializer.save(inspector=self.request.user, created_by=self.request.user)

    @action(detail=True, methods=['post'])
    def submit(self, request, pk=None):
        try:
            inspection = InspectionFlowService.submit_inspection(pk, request.user)
            serializer = self.get_serializer(inspection)
            return Response(serializer.data)
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        comments = request.data.get('comments', '')
        try:
            inspection = InspectionFlowService.approve_inspection(pk, request.user, comments)
            serializer = self.get_serializer(inspection)
            return Response(serializer.data)
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        comments = request.data.get('comments', '')
        try:
            inspection = InspectionFlowService.reject_inspection(pk, request.user, comments)
            serializer = self.get_serializer(inspection)
            return Response(serializer.data)
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def needs_review(self, request, pk=None):
        reason = request.data.get('reason', '')
        try:
            inspection = InspectionFlowService.mark_needs_review(pk, request.user, reason)
            serializer = self.get_serializer(inspection)
            return Response(serializer.data)
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        try:
            inspection = InspectionFlowService.complete_inspection(pk, request.user)
            serializer = self.get_serializer(inspection)
            return Response(serializer.data)
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['get', 'post'])
    def items(self, request, pk=None):
        inspection = self.get_object()
        if request.method == 'GET':
            items = InspectionItemResult.objects.filter(inspection=inspection)
            serializer = InspectionItemResultSerializer(items, many=True)
            return Response(serializer.data)
        else:
            serializer = InspectionItemResultSerializer(data=request.data)
            if serializer.is_valid():
                serializer.save(inspection=inspection, created_by=request.user)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
