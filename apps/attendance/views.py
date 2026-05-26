from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import ReconciliationBatch, ReconciliationRecord, AttendanceSummary
from .serializers import (
    ReconciliationBatchSerializer, ReconciliationRecordSerializer,
    AttendanceSummarySerializer, BatchCreateSerializer
)
from .services import ReconciliationService, AttendanceSummaryService
from apps.core.permissions import IsDirector, IsFrontDesk
from apps.core.services import ExportService
from apps.core.exceptions import PermissionDeniedException


class ReconciliationBatchViewSet(viewsets.ModelViewSet):
    queryset = ReconciliationBatch.objects.all()
    serializer_class = ReconciliationBatchSerializer
    http_method_names = ['get', 'post', 'head', 'options']

    def get_permissions(self):
        if self.action in ['create', 'process']:
            return [IsFrontDesk()]
        return super().get_permissions()

    def list(self, request):
        status_val = request.query_params.get('status')
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')

        queryset = ReconciliationService.list_batches(
            status=status_val, start_date=start_date, end_date=end_date
        )
        page = self.paginate_queryset(queryset)
        serializer = self.get_serializer(page, many=True)
        return self.get_paginated_response(serializer.data)

    def create(self, request):
        serializer = BatchCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        batch = ReconciliationService.create_batch(
            request.user,
            serializer.validated_data['start_date'],
            serializer.validated_data['end_date'],
            serializer.validated_data.get('notes', '')
        )
        return Response({
            'code': 200,
            'message': '对账批次创建成功',
            'data': ReconciliationBatchSerializer(batch).data
        }, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def process(self, request, pk=None):
        batch = ReconciliationService.process_batch(request.user, pk)
        return Response({
            'code': 200,
            'message': '对账处理完成',
            'data': ReconciliationBatchSerializer(batch).data
        })

    @action(detail=False, methods=['post'])
    def generate_summary(self, request):
        date = request.data.get('date')
        summary = AttendanceSummaryService.generate_daily_summary(date)
        return Response({
            'code': 200,
            'message': '汇总生成成功',
            'data': AttendanceSummarySerializer(summary).data
        })


class AttendanceSummaryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AttendanceSummary.objects.all()
    serializer_class = AttendanceSummarySerializer
    permission_classes = [IsDirector]

    def list(self, request):
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        by_week = request.query_params.get('by_week') == '1'

        if by_week:
            data = AttendanceSummaryService.get_summary(start_date, end_date, by_week=True)
            return Response({
                'code': 200,
                'message': 'success',
                'data': list(data)
            })

        queryset = AttendanceSummaryService.get_summary(start_date, end_date)
        page = self.paginate_queryset(queryset)
        serializer = self.get_serializer(page, many=True)
        return self.get_paginated_response(serializer.data)
