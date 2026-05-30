from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import RepairTicket, RepairStatus, RepairLog
from .serializers import RepairTicketSerializer, RepairTicketListSerializer, RepairLogSerializer
from .services import RepairFlowService
from apps.common.permissions import IsManager, IsMaintenance, IsOwnerOrManager
from apps.common.views import filter_by_venue


class RepairTicketViewSet(viewsets.ModelViewSet):
    serializer_class = RepairTicketSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = RepairTicket.objects.select_related(
            'venue', 'device', 'area', 'reporter', 'assignee'
        ).all()
        user = self.request.user
        qs = filter_by_venue(qs, user, 'venue_id')
        if user.role == 'maintenance':
            qs = qs.filter(assignee=user)
        elif user.role not in ['admin', 'manager']:
            qs = qs.filter(reporter=user)
        return qs

    def get_permissions(self):
        if self.action in ['assign', 'reject']:
            return [IsManager()]
        return super().get_permissions()

    def get_serializer_class(self):
        if self.action == 'list':
            return RepairTicketListSerializer
        return RepairTicketSerializer

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    def check_object_permissions(self, request, obj):
        super().check_object_permissions(request, obj)
        if request.method in ['PUT', 'PATCH', 'DELETE']:
            if request.user.role not in ['admin', 'manager']:
                self.permission_denied(request, message='没有权限修改此工单')

    def perform_create(self, serializer):
        serializer.save(reporter=self.request.user, created_by=self.request.user)

    @action(detail=True, methods=['post'])
    def assign(self, request, pk=None):
        assignee_id = request.data.get('assignee_id')
        from apps.users.models import User
        assignee = User.objects.get(id=assignee_id)
        try:
            ticket = RepairFlowService.assign_repair(pk, assignee, request.user)
            serializer = self.get_serializer(ticket)
            return Response(serializer.data)
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def start(self, request, pk=None):
        try:
            ticket = RepairFlowService.start_repair(pk, request.user)
            serializer = self.get_serializer(ticket)
            return Response(serializer.data)
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        ticket = self.get_object()
        if ticket.assignee != request.user:
            return Response({'error': '只有指定的维修人员可以完成工单'}, status=status.HTTP_403_FORBIDDEN)
        solution = request.data.get('solution', '')
        cost = request.data.get('cost')
        try:
            ticket = RepairFlowService.complete_repair(pk, request.user, solution, cost)
            serializer = self.get_serializer(ticket)
            return Response(serializer.data)
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def confirm(self, request, pk=None):
        rating = request.data.get('rating')
        comments = request.data.get('comments', '')
        try:
            ticket = RepairFlowService.confirm_repair(pk, request.user, rating, comments)
            serializer = self.get_serializer(ticket)
            return Response(serializer.data)
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def reopen(self, request, pk=None):
        reason = request.data.get('reason', '')
        try:
            ticket = RepairFlowService.reopen_repair(pk, request.user, reason)
            serializer = self.get_serializer(ticket)
            return Response(serializer.data)
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        reason = request.data.get('reason', '')
        try:
            ticket = RepairFlowService.reject_repair(pk, request.user, reason)
            serializer = self.get_serializer(ticket)
            return Response(serializer.data)
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['get'])
    def logs(self, request, pk=None):
        ticket = self.get_object()
        logs = RepairLog.objects.filter(ticket=ticket)
        serializer = RepairLogSerializer(logs, many=True)
        return Response(serializer.data)
