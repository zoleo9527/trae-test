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
from apps.common.permissions import IsInspector, IsManager, IsOwnerOrManager
from apps.common.views import filter_by_venue


class InspectionPlanViewSet(viewsets.ModelViewSet):
    serializer_class = InspectionPlanSerializer
    permission_classes = [IsManager]

    def get_queryset(self):
        qs = InspectionPlan.objects.select_related('venue').all()
        return filter_by_venue(qs, self.request.user, 'venue_id')


class CheckItemViewSet(viewsets.ModelViewSet):
    serializer_class = CheckItemSerializer
    permission_classes = [IsManager]

    def get_queryset(self):
        plan_id = self.request.query_params.get('plan_id')
        qs = CheckItem.objects.select_related('plan').all()
        if plan_id:
            qs = qs.filter(plan_id=plan_id)
        return filter_by_venue(qs, self.request.user, 'plan__venue_id')


class InspectionRecordViewSet(viewsets.ModelViewSet):
    serializer_class = InspectionRecordSerializer
    permission_classes = [IsInspector]

    def get_queryset(self):
        qs = InspectionRecord.objects.select_related('venue', 'inspector', 'reviewer').all()
        user = self.request.user
        qs = filter_by_venue(qs, user, 'venue_id')
        if user.role == 'inspector':
            qs = qs.filter(inspector=user) | qs.filter(status__in=['submitted', 'reviewing', 'needs_review'])
        return qs.distinct()

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
