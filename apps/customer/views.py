from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.permissions import IsAuthenticated
from .models import Customer, WasteType
from .serializers import (
    CustomerSerializer, CustomerListSerializer,
    WasteTypeSerializer, WasteTypeListSerializer
)
from apps.audit.utils import log_action, model_to_dict
from apps.base.permissions import CanManageCustomer


class CustomerViewSet(viewsets.ModelViewSet):
    queryset = Customer.objects.all()
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['type', 'credit_level', 'is_active']
    search_fields = ['code', 'name', 'contact', 'phone']

    def get_permissions(self):
        if self.action in ['list', 'retrieve', 'credit_info']:
            return [IsAuthenticated()]
        return [CanManageCustomer()]

    def get_serializer_class(self):
        if self.action == 'list':
            return CustomerListSerializer
        return CustomerSerializer

    def perform_create(self, serializer):
        instance = serializer.save(created_by=self.request.user, updated_by=self.request.user)
        log_action(
            user=self.request.user,
            action='create',
            message=f'创建客户: {instance.name}',
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
            message=f'更新客户: {instance.name}',
            instance=instance,
            old_values=old_values,
            new_values=model_to_dict(instance),
            request=self.request
        )

    def perform_destroy(self, instance):
        log_action(
            user=self.request.user,
            action='delete',
            message=f'删除客户: {instance.name}',
            instance=instance,
            old_values=model_to_dict(instance),
            request=self.request
        )
        instance.delete()

    @action(detail=True, methods=['get'])
    def credit_info(self, request, pk=None):
        customer = self.get_object()
        return Response({
            'credit_limit': float(customer.credit_limit),
            'used_credit': float(customer.get_used_credit()),
            'remaining_credit': float(customer.get_remaining_credit())
        })


class WasteTypeViewSet(viewsets.ModelViewSet):
    queryset = WasteType.objects.all()
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['category', 'is_active']
    search_fields = ['code', 'name']

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [IsAuthenticated()]
        return [CanManageCustomer()]

    def get_serializer_class(self):
        if self.action == 'list':
            return WasteTypeListSerializer
        return WasteTypeSerializer

    def perform_create(self, serializer):
        instance = serializer.save(created_by=self.request.user, updated_by=self.request.user)
        log_action(
            user=self.request.user,
            action='create',
            message=f'创建废品类型: {instance.name}',
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
            message=f'更新废品类型: {instance.name}',
            instance=instance,
            old_values=old_values,
            new_values=model_to_dict(instance),
            request=self.request
        )

    def perform_destroy(self, instance):
        log_action(
            user=self.request.user,
            action='delete',
            message=f'删除废品类型: {instance.name}',
            instance=instance,
            old_values=model_to_dict(instance),
            request=self.request
        )
        instance.delete()
