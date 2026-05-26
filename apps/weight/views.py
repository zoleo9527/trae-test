from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from datetime import datetime
from .models import WeightTicket, PriceAdjustment
from .serializers import (
    WeightTicketSerializer, WeightTicketListSerializer,
    WeightTicketApproveSerializer, WeightTicketRejectSerializer,
    PriceAdjustmentSerializer, PriceAdjustmentListSerializer
)
from apps.audit.utils import log_action, model_to_dict


class WeightTicketViewSet(viewsets.ModelViewSet):
    queryset = WeightTicket.objects.all()
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['customer', 'waste_type', 'status', 'payment_method']
    search_fields = ['ticket_no', 'customer__name', 'vehicle_no']
    ordering_fields = ['created_at', 'weigh_time', 'total_amount']

    def get_serializer_class(self):
        if self.action == 'list':
            return WeightTicketListSerializer
        return WeightTicketSerializer

    def generate_ticket_no(self):
        today = timezone.now().strftime('%Y%m%d')
        count = WeightTicket.objects.filter(ticket_no__startswith=f'BD{today}').count() + 1
        return f'BD{today}{count:04d}'

    def perform_create(self, serializer):
        ticket_no = self.generate_ticket_no()
        instance = serializer.save(
            ticket_no=ticket_no,
            created_by=self.request.user,
            updated_by=self.request.user
        )
        log_action(
            user=self.request.user,
            action='create',
            message=f'创建磅单: {instance.ticket_no}',
            instance=instance,
            new_values=model_to_dict(instance),
            request=self.request
        )

    def perform_update(self, serializer):
        old_instance = self.get_object()
        old_values = model_to_dict(old_instance)
        instance = serializer.save(updated_by=self.request.user)
        log_action(
            user=self.request.user,
            action='update',
            message=f'更新磅单: {instance.ticket_no}',
            instance=instance,
            old_values=old_values,
            new_values=model_to_dict(instance),
            request=self.request
        )

    def perform_destroy(self, instance):
        log_action(
            user=self.request.user,
            action='delete',
            message=f'删除磅单: {instance.ticket_no}',
            instance=instance,
            old_values=model_to_dict(instance),
            request=self.request
        )
        instance.delete()

    @action(detail=True, methods=['post'], serializer_class=WeightTicketApproveSerializer)
    def approve(self, request, pk=None):
        ticket = self.get_object()
        if ticket.status != 'pending':
            return Response(
                {'error': '只有待审核状态的磅单才能通过'},
                status=status.HTTP_400_BAD_REQUEST
            )
        old_values = model_to_dict(ticket)
        ticket.status = 'approved'
        ticket.reviewed_by = request.user
        ticket.reviewed_at = timezone.now()
        ticket.save()
        log_action(
            user=request.user,
            action='approve',
            message=f'审核通过磅单: {ticket.ticket_no}',
            instance=ticket,
            old_values=old_values,
            new_values=model_to_dict(ticket),
            request=request
        )
        return Response({'status': 'success', 'message': '审核通过'})

    @action(detail=True, methods=['post'], serializer_class=WeightTicketRejectSerializer)
    def reject(self, request, pk=None):
        ticket = self.get_object()
        if ticket.status != 'pending':
            return Response(
                {'error': '只有待审核状态的磅单才能驳回'},
                status=status.HTTP_400_BAD_REQUEST
            )
        serializer = WeightTicketRejectSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        old_values = model_to_dict(ticket)
        ticket.status = 'rejected'
        ticket.reject_reason = serializer.validated_data['reject_reason']
        ticket.reviewed_by = request.user
        ticket.reviewed_at = timezone.now()
        ticket.save()
        log_action(
            user=request.user,
            action='reject',
            message=f'审核驳回磅单: {ticket.ticket_no}, 原因: {ticket.reject_reason}',
            instance=ticket,
            old_values=old_values,
            new_values=model_to_dict(ticket),
            request=request
        )
        return Response({'status': 'success', 'message': '已驳回'})

    @action(detail=True, methods=['post'])
    def mark_review(self, request, pk=None):
        ticket = self.get_object()
        old_values = model_to_dict(ticket)
        ticket.status = 'review'
        ticket.save()
        log_action(
            user=request.user,
            action='review',
            message=f'标记磅单需回查: {ticket.ticket_no}',
            instance=ticket,
            old_values=old_values,
            new_values=model_to_dict(ticket),
            request=request
        )
        return Response({'status': 'success', 'message': '已标记需回查'})


class PriceAdjustmentViewSet(viewsets.ModelViewSet):
    queryset = PriceAdjustment.objects.all()
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['waste_type', 'is_effective']
    search_fields = ['waste_type__name', 'reason']

    def get_serializer_class(self):
        if self.action == 'list':
            return PriceAdjustmentListSerializer
        return PriceAdjustmentSerializer

    def perform_create(self, serializer):
        instance = serializer.save(created_by=self.request.user, updated_by=self.request.user)
        instance.waste_type.default_price = instance.new_price
        instance.waste_type.save()
        log_action(
            user=self.request.user,
            action='create',
            message=f'创建价格调整: {instance.waste_type.name} 从 {instance.old_price} 调整为 {instance.new_price}',
            instance=instance,
            new_values=model_to_dict(instance),
            request=self.request
        )

    def perform_update(self, serializer):
        old_instance = self.get_object()
        old_values = model_to_dict(old_instance)
        instance = serializer.save(updated_by=self.request.user)
        log_action(
            user=self.request.user,
            action='update',
            message=f'更新价格调整记录',
            instance=instance,
            old_values=old_values,
            new_values=model_to_dict(instance),
            request=self.request
        )

    def perform_destroy(self, instance):
        log_action(
            user=self.request.user,
            action='delete',
            message=f'删除价格调整记录',
            instance=instance,
            old_values=model_to_dict(instance),
            request=self.request
        )
        instance.delete()
