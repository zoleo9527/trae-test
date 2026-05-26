from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Complaint, ComplaintComment
from .serializers import (
    ComplaintSerializer, ComplaintCommentSerializer,
    ComplaintCreateSerializer, StatusUpdateSerializer,
    AssignSerializer, CommentSerializer, EscalateSerializer
)
from .services import ComplaintService
from apps.core.permissions import IsDirector, IsCoachSupervisor, IsFrontDesk, IsCoach
from apps.core.services import ExportService
from apps.core.exceptions import PermissionDeniedException


class ComplaintViewSet(viewsets.ModelViewSet):
    queryset = Complaint.objects.all()
    serializer_class = ComplaintSerializer

    def get_permissions(self):
        if self.action in ['create']:
            return [IsFrontDesk()]
        if self.action in ['destroy', 'statistics']:
            return [IsDirector()]
        if self.action in ['assign', 'escalate']:
            return [IsCoachSupervisor()]
        if self.action in ['update_status']:
            return [IsCoach()]
        return super().get_permissions()

    def list(self, request):
        category = request.query_params.get('category')
        priority = request.query_params.get('priority')
        status_val = request.query_params.get('status')
        assigned_to = request.query_params.get('assigned_to')
        submitted_by = request.query_params.get('submitted_by')
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        search = request.query_params.get('search')
        overdue = request.query_params.get('overdue') == '1'
        my = request.query_params.get('my') == '1'

        if request.user.role == 'director':
            pass
        elif request.user.role == 'coach_supervisor':
            assigned_to = assigned_to or request.user.id
        elif request.user.role == 'front_desk':
            submitted_by = submitted_by or request.user.id
        elif request.user.role == 'coach':
            assigned_to = assigned_to or request.user.id

        if my:
            assigned_to = request.user.id

        queryset = ComplaintService.list_complaints(
            category=category, priority=priority, status=status_val,
            assigned_to=assigned_to, submitted_by=submitted_by,
            start_date=start_date, end_date=end_date,
            search=search, overdue=overdue
        )

        if request.query_params.get('export') == '1':
            if request.user.role != 'director':
                raise PermissionDeniedException('只有馆长可以导出数据')
            fields = [
                {'label': '创建时间', 'value': 'created_at', 'width': 20},
                {'label': '标题', 'value': 'title', 'width': 30},
                {'label': '分类', 'value': lambda o: o.get_category_display(), 'width': 12},
                {'label': '优先级', 'value': lambda o: o.get_priority_display(), 'width': 10},
                {'label': '状态', 'value': lambda o: o.get_status_display(), 'width': 12},
                {'label': '报修人', 'value': 'reporter_name', 'width': 12},
                {'label': '处理人', 'value': lambda o: o.assigned_to.username if o.assigned_to else '', 'width': 12},
                {'label': '提交人', 'value': lambda o: o.submitted_by.username if o.submitted_by else '', 'width': 12},
            ]
            return ExportService.export_to_excel(queryset, fields, 'complaints')

        page = self.paginate_queryset(queryset)
        serializer = self.get_serializer(page, many=True)
        return self.get_paginated_response(serializer.data)

    def retrieve(self, request, pk=None):
        complaint = self.get_object()
        self._check_data_visibility(request, complaint)
        serializer = self.get_serializer(complaint)
        return Response({
            'code': 200,
            'message': 'success',
            'data': serializer.data
        })

    @staticmethod
    def _check_data_visibility(request, complaint):
        if request.user.role == 'director':
            return
        if request.user.role in ['coach_supervisor', 'coach']:
            if complaint.assigned_to_id != request.user.id:
                raise PermissionDeniedException('无权查看此投诉详情')
        if request.user.role == 'front_desk':
            if complaint.submitted_by_id != request.user.id:
                raise PermissionDeniedException('无权查看此投诉详情')

    def create(self, request):
        serializer = ComplaintCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        data = serializer.validated_data
        if 'student_id' in data:
            data['student_id'] = data.pop('student_id')

        complaint = ComplaintService.create_complaint(request.user, **data)
        return Response({
            'code': 200,
            'message': '问题提交成功',
            'data': ComplaintSerializer(complaint).data
        }, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def update_status(self, request, pk=None):
        complaint = self.get_object()
        self._check_data_visibility(request, complaint)
        serializer = StatusUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        complaint = ComplaintService.update_status(
            request.user, complaint,
            serializer.validated_data['status'],
            serializer.validated_data.get('notes', '')
        )
        return Response({
            'code': 200,
            'message': '状态更新成功',
            'data': ComplaintSerializer(complaint).data
        })

    @action(detail=True, methods=['post'])
    def assign(self, request, pk=None):
        complaint = self.get_object()
        self._check_data_visibility(request, complaint)
        serializer = AssignSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        complaint = ComplaintService.assign_complaint(
            request.user, complaint,
            serializer.validated_data['assigned_to_id'],
            serializer.validated_data.get('notes', '')
        )
        return Response({
            'code': 200,
            'message': '分配成功',
            'data': ComplaintSerializer(complaint).data
        })

    @action(detail=True, methods=['post'])
    def add_comment(self, request, pk=None):
        complaint = self.get_object()
        self._check_data_visibility(request, complaint)
        serializer = CommentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        comment = ComplaintService.add_comment(
            request.user, complaint,
            serializer.validated_data['content'],
            serializer.validated_data.get('is_internal', False)
        )
        return Response({
            'code': 200,
            'message': '评论添加成功',
            'data': ComplaintCommentSerializer(comment).data
        })

    @action(detail=True, methods=['post'])
    def escalate(self, request, pk=None):
        complaint = self.get_object()
        self._check_data_visibility(request, complaint)
        serializer = EscalateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        complaint = ComplaintService.escalate(
            request.user, complaint,
            serializer.validated_data.get('reason', '')
        )
        return Response({
            'code': 200,
            'message': '已升级处理',
            'data': ComplaintSerializer(complaint).data
        })

    @action(detail=False, methods=['get'])
    def statistics(self, request):
        stats = ComplaintService.get_statistics()
        return Response({
            'code': 200,
            'message': 'success',
            'data': stats
        })
