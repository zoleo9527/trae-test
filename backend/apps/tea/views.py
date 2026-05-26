from django.db import transaction
from django.db.models import Q
from django.utils import timezone
from rest_framework import status as http_status
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.tea.models import (
    ActivitySubmission, AuditLog, Batch, InventoryRecord, Order, OrderItem,
    PriceApproval, Product, Shipment, ShipmentItem, Store, TrialFollowUp,
    Warehouse,
)
from apps.tea.permissions import (
    CanApproveActivity, CanApprovePrice, CanSubmitActivity, CanSubmitPrice,
    IsAdminOrReadOnly,
)
from apps.tea.serializers import (
    ActivitySubmissionListSerializer, ActivitySubmissionSerializer,
    AuditLogSerializer, BatchSerializer, InventoryRecordSerializer,
    OrderItemSerializer, OrderListSerializer, OrderSerializer,
    PriceApprovalListSerializer, PriceApprovalSerializer,
    PriceApprovalToActivitySerializer,
    ProductSerializer, ShipmentItemSerializer, ShipmentListSerializer,
    ShipmentSerializer, StoreSerializer, TrialFollowUpSerializer,
    WarehouseSerializer,
)
from apps.tea.services import AuditService


class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticated, IsAdminOrReadOnly]
    search_fields = ('sku', 'name')
    filterset_fields = ('category', 'status')
    ordering_fields = ('sku', 'name', 'base_unit_price', 'created_at')


class WarehouseViewSet(viewsets.ModelViewSet):
    queryset = Warehouse.objects.all()
    serializer_class = WarehouseSerializer
    permission_classes = [IsAuthenticated, IsAdminOrReadOnly]
    search_fields = ('code', 'name')
    filterset_fields = ('region', 'is_active')
    ordering_fields = ('code', 'name', 'created_at')


class StoreViewSet(viewsets.ModelViewSet):
    queryset = Store.objects.all()
    serializer_class = StoreSerializer
    permission_classes = [IsAuthenticated]
    search_fields = ('code', 'name', 'phone')
    filterset_fields = ('region', 'is_active', 'responsible_warehouse')
    ordering_fields = ('code', 'name', 'created_at')


class BatchViewSet(viewsets.ModelViewSet):
    queryset = Batch.objects.all()
    serializer_class = BatchSerializer
    permission_classes = [IsAuthenticated]
    search_fields = ('batch_no', 'product__sku', 'product__name')
    filterset_fields = ('status', 'warehouse', 'product')
    ordering_fields = ('batch_no', 'production_date', 'created_at')


class InventoryRecordViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = InventoryRecord.objects.all()
    serializer_class = InventoryRecordSerializer
    permission_classes = [IsAuthenticated]
    search_fields = ('batch__batch_no',)
    filterset_fields = ('change_type', 'reference_type', 'batch')
    ordering_fields = ('created_at',)


class PriceApprovalViewSet(viewsets.ModelViewSet):
    queryset = PriceApproval.objects.all()
    permission_classes = [IsAuthenticated]
    search_fields = ('code', 'product__sku', 'product__name')
    filterset_fields = ('status', 'product', 'store', 'submitter')
    ordering_fields = ('code', 'created_at', 'effective_from')

    def get_serializer_class(self):
        if self.action == 'list':
            return PriceApprovalListSerializer
        return PriceApprovalSerializer

    def get_permissions(self):
        if self.action in ('approve', 'reject'):
            return [CanApprovePrice()]
        if self.action in ('create', 'update', 'partial_update', 'create_activity'):
            return [CanSubmitPrice()]
        return super().get_permissions()

    def perform_create(self, serializer):
        instance = serializer.save()
        AuditService.log(instance, 'CREATE', operator=self.request.user)

    def perform_update(self, serializer):
        instance = serializer.save()
        AuditService.log(instance, 'UPDATE', operator=self.request.user)

    def perform_destroy(self, instance):
        AuditService.log(instance, 'DELETE', operator=self.request.user)
        super().perform_destroy(instance)

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        approval = self.get_object()
        if approval.status != 'pending':
            return Response(
                {'detail': '只有待审批状态的审批单可以审批通过'},
                status=http_status.HTTP_400_BAD_REQUEST,
            )
        approval.status = 'approved'
        approval.approver = request.user
        approval.approved_at = timezone.now()
        approval.updated_by = request.user
        approval.save()
        AuditService.log(approval, 'APPROVE', operator=request.user,
                         field_name='status', old_value='pending', new_value='approved')
        return Response(PriceApprovalSerializer(approval, context={'request': request}).data)

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        approval = self.get_object()
        if approval.status != 'pending':
            return Response(
                {'detail': '只有待审批状态的审批单可以驳回'},
                status=http_status.HTTP_400_BAD_REQUEST,
            )
        rejection_reason = request.data.get('rejection_reason', '')
        approval.status = 'rejected'
        approval.approver = request.user
        approval.rejection_reason = rejection_reason
        approval.updated_by = request.user
        approval.save()
        AuditService.log(approval, 'REJECT', operator=request.user,
                         field_name='status', old_value='pending', new_value='rejected')
        return Response(PriceApprovalSerializer(approval, context={'request': request}).data)

    @transaction.atomic
    @action(detail=True, methods=['post'])
    def create_activity(self, request, pk=None):
        approval = self.get_object()
        if approval.status != 'approved':
            return Response(
                {'detail': '只有已通过的价格审批可以生成活动提报'},
                status=http_status.HTTP_400_BAD_REQUEST,
            )
        if hasattr(approval, 'activity') and approval.activity:
            return Response(
                {'detail': '该价格审批已关联活动提报，无法重复创建'},
                status=http_status.HTTP_400_BAD_REQUEST,
            )
        serializer = PriceApprovalToActivitySerializer(
            data=request.data,
            context={'request': request, 'price_approval': approval},
        )
        serializer.is_valid(raise_exception=True)
        activity = serializer.save()
        AuditService.log(activity, 'CREATE', operator=request.user)
        AuditService.log(approval, 'SUBMIT', operator=request.user,
                         field_name='activity', old_value='', new_value=activity.code)
        return Response(
            ActivitySubmissionSerializer(activity, context={'request': request}).data,
            status=http_status.HTTP_201_CREATED,
        )


class ActivitySubmissionViewSet(viewsets.ModelViewSet):
    queryset = ActivitySubmission.objects.all()
    permission_classes = [IsAuthenticated]
    search_fields = ('code', 'activity_name')
    filterset_fields = ('status', 'activity_type', 'submitter')
    ordering_fields = ('code', 'activity_period_from', 'created_at')

    def get_serializer_class(self):
        if self.action == 'list':
            return ActivitySubmissionListSerializer
        return ActivitySubmissionSerializer

    def get_permissions(self):
        if self.action in ('approve', 'reject'):
            return [CanApproveActivity()]
        if self.action in ('create', 'update', 'partial_update'):
            return [CanSubmitActivity()]
        return super().get_permissions()

    def perform_create(self, serializer):
        instance = serializer.save()
        AuditService.log(instance, 'CREATE', operator=self.request.user)

    def perform_update(self, serializer):
        instance = serializer.save()
        AuditService.log(instance, 'UPDATE', operator=self.request.user)

    def perform_destroy(self, instance):
        AuditService.log(instance, 'DELETE', operator=self.request.user)
        super().perform_destroy(instance)

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        activity = self.get_object()
        if activity.status != 'pending':
            return Response(
                {'detail': '只有待审批状态的活动可以审批通过'},
                status=http_status.HTTP_400_BAD_REQUEST,
            )
        activity.status = 'approved'
        activity.approver = request.user
        activity.approved_at = timezone.now()
        activity.updated_by = request.user
        activity.save()
        AuditService.log(activity, 'APPROVE', operator=request.user,
                         field_name='status', old_value='pending', new_value='approved')
        return Response(ActivitySubmissionSerializer(activity, context={'request': request}).data)

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        activity = self.get_object()
        if activity.status != 'pending':
            return Response(
                {'detail': '只有待审批状态的活动可以驳回'},
                status=http_status.HTTP_400_BAD_REQUEST,
            )
        rejection_reason = request.data.get('rejection_reason', '')
        activity.status = 'rejected'
        activity.approver = request.user
        activity.rejection_reason = rejection_reason
        activity.updated_by = request.user
        activity.save()
        AuditService.log(activity, 'REJECT', operator=request.user,
                         field_name='status', old_value='pending', new_value='rejected')
        return Response(ActivitySubmissionSerializer(activity, context={'request': request}).data)


class OrderViewSet(viewsets.ModelViewSet):
    queryset = Order.objects.all()
    permission_classes = [IsAuthenticated]
    search_fields = ('code', 'store__name')
    filterset_fields = ('status', 'store', 'activity')
    ordering_fields = ('code', 'created_at', 'total_amount')

    def get_serializer_class(self):
        if self.action == 'list':
            return OrderListSerializer
        return OrderSerializer

    def perform_create(self, serializer):
        instance = serializer.save()
        AuditService.log(instance, 'CREATE', operator=self.request.user)

    def perform_update(self, serializer):
        instance = serializer.save()
        AuditService.log(instance, 'UPDATE', operator=self.request.user)

    def perform_destroy(self, instance):
        AuditService.log(instance, 'DELETE', operator=self.request.user)
        super().perform_destroy(instance)

    @action(detail=True, methods=['post'])
    def confirm(self, request, pk=None):
        order = self.get_object()
        if order.status != 'draft':
            return Response(
                {'detail': '只有草稿状态的订货单可以确认'},
                status=http_status.HTTP_400_BAD_REQUEST,
            )
        if not order.items.exists():
            return Response(
                {'detail': '订货单必须包含物料明细'},
                status=http_status.HTTP_400_BAD_REQUEST,
            )
        order.status = 'confirmed'
        order.confirmed_at = timezone.now()
        order.updated_by = request.user
        order.save()
        AuditService.log(order, 'CONFIRM', operator=request.user,
                         field_name='status', old_value='draft', new_value='confirmed')
        return Response(OrderSerializer(order, context={'request': request}).data)

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        order = self.get_object()
        if order.status not in ('draft', 'confirmed'):
            return Response(
                {'detail': '当前状态不允许取消'},
                status=http_status.HTTP_400_BAD_REQUEST,
            )
        order.status = 'cancelled'
        order.cancelled_at = timezone.now()
        order.updated_by = request.user
        order.save()
        AuditService.log(order, 'CANCEL', operator=request.user,
                         field_name='status', new_value='cancelled')
        return Response(OrderSerializer(order, context={'request': request}).data)


class ShipmentViewSet(viewsets.ModelViewSet):
    queryset = Shipment.objects.all()
    permission_classes = [IsAuthenticated]
    search_fields = ('code', 'tracking_no', 'order__code')
    filterset_fields = ('status', 'from_warehouse')
    ordering_fields = ('code', 'shipped_at', 'created_at')

    def get_serializer_class(self):
        if self.action == 'list':
            return ShipmentListSerializer
        return ShipmentSerializer

    def perform_create(self, serializer):
        instance = serializer.save()
        AuditService.log(instance, 'CREATE', operator=self.request.user)

    def perform_update(self, serializer):
        instance = serializer.save()
        AuditService.log(instance, 'UPDATE', operator=self.request.user)

    def perform_destroy(self, instance):
        AuditService.log(instance, 'DELETE', operator=self.request.user)
        super().perform_destroy(instance)

    @transaction.atomic
    @action(detail=True, methods=['post'])
    def ship(self, request, pk=None):
        shipment = self.get_object()
        if shipment.status != 'pending':
            return Response(
                {'detail': '只有待发货状态的发货单可以发货'},
                status=http_status.HTTP_400_BAD_REQUEST,
            )
        if not shipment.items.exists():
            return Response(
                {'detail': '发货单必须包含发货明细'},
                status=http_status.HTTP_400_BAD_REQUEST,
            )
        for item in shipment.items.all():
            batch = item.batch
            if batch.current_quantity < item.shipped_quantity:
                return Response(
                    {'detail': f'批次 {batch.batch_no} 库存不足'},
                    status=http_status.HTTP_400_BAD_REQUEST,
                )
        for item in shipment.items.all():
            batch = item.batch
            InventoryRecord.objects.create(
                batch=batch,
                change_type='outbound',
                direction=-1,
                change_quantity=item.shipped_quantity,
                balance_after=batch.current_quantity - item.shipped_quantity,
                reference_type='shipment',
                reference_id=shipment.code,
                created_by=request.user,
            )
        shipment.status = 'shipped'
        shipment.shipped_at = timezone.now()
        shipment.updated_by = request.user
        shipment.save()
        if shipment.order.status in ('draft', 'confirmed'):
            shipment.order.status = 'shipped'
            shipment.order.save(update_fields=['status', 'updated_at'])
        AuditService.log(shipment, 'SHIP', operator=request.user,
                         field_name='status', old_value='pending', new_value='shipped')
        return Response(ShipmentSerializer(shipment, context={'request': request}).data)

    @action(detail=True, methods=['post'])
    def receive(self, request, pk=None):
        shipment = self.get_object()
        if shipment.status != 'shipped':
            return Response(
                {'detail': '只有已发货状态的发货单可以签收'},
                status=http_status.HTTP_400_BAD_REQUEST,
            )
        shipment.status = 'received'
        shipment.received_at = timezone.now()
        shipment.updated_by = request.user
        shipment.save()
        if shipment.order.status == 'shipped':
            has_unreceived = shipment.order.shipments.filter(
                status__in=['pending', 'shipped']
            ).exists()
            if not has_unreceived:
                shipment.order.status = 'received'
                shipment.order.save(update_fields=['status', 'updated_at'])
        AuditService.log(shipment, 'RECEIVE', operator=request.user,
                         field_name='status', old_value='shipped', new_value='received')
        return Response(ShipmentSerializer(shipment, context={'request': request}).data)


class TrialFollowUpViewSet(viewsets.ModelViewSet):
    queryset = TrialFollowUp.objects.all()
    serializer_class = TrialFollowUpSerializer
    permission_classes = [IsAuthenticated]
    search_fields = ('code', 'store__name')
    filterset_fields = ('result', 'activity', 'store')
    ordering_fields = ('code', 'visit_date', 'created_at')

    def perform_create(self, serializer):
        instance = serializer.save()
        AuditService.log(instance, 'CREATE', operator=self.request.user)

    def perform_update(self, serializer):
        instance = serializer.save()
        AuditService.log(instance, 'UPDATE', operator=self.request.user)


class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AuditLog.objects.all()
    serializer_class = AuditLogSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ('model_name', 'action', 'operator')
    search_fields = ('record_code', 'record_id')
    ordering_fields = ('created_at',)


class DashboardViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    def list(self, request):
        return Response({
            'summary': {
                'pending_price_approvals': PriceApproval.objects.filter(status='pending').count(),
                'pending_activity_submissions': ActivitySubmission.objects.filter(status='pending').count(),
                'rejected_price_approvals': PriceApproval.objects.filter(status='rejected').count(),
                'rejected_activity_submissions': ActivitySubmission.objects.filter(status='rejected').count(),
                'review_needed_activities': ActivitySubmission.objects.filter(
                    status__in=['approved', 'completed'],
                    activity_period_to__lt=timezone.now().date(),
                ).exclude(trial_followups__isnull=False).count(),
                'pending_shipments': Shipment.objects.filter(status='pending').count(),
                'draft_orders': Order.objects.filter(status='draft').count(),
            }
        })

    @action(detail=False, methods=['get'])
    def pending(self, request):
        data = {
            'price_approvals': PriceApprovalListSerializer(
                PriceApproval.objects.filter(status='pending').select_related(
                    'product', 'store', 'submitter'), many=True
            ).data,
            'activity_submissions': ActivitySubmissionListSerializer(
                ActivitySubmission.objects.filter(status='pending').select_related(
                    'price_approval', 'submitter'), many=True
            ).data,
            'draft_orders': OrderListSerializer(
                Order.objects.filter(status='draft').select_related('store'), many=True
            ).data,
            'pending_shipments': ShipmentListSerializer(
                Shipment.objects.filter(status='pending').select_related(
                    'order', 'from_warehouse'), many=True
            ).data,
        }
        return Response(data)

    @action(detail=False, methods=['get'])
    def rejected(self, request):
        data = {
            'price_approvals': PriceApprovalListSerializer(
                PriceApproval.objects.filter(status='rejected').select_related(
                    'product', 'store', 'submitter'), many=True
            ).data,
            'activity_submissions': ActivitySubmissionListSerializer(
                ActivitySubmission.objects.filter(status='rejected').select_related(
                    'price_approval', 'submitter'), many=True
            ).data,
        }
        return Response(data)

    @action(detail=False, methods=['get'])
    def review_needed(self, request):
        today = timezone.now().date()
        activities = ActivitySubmission.objects.filter(
            status__in=['approved', 'completed'],
            activity_period_to__lt=today,
        ).exclude(trial_followups__isnull=False).select_related(
            'price_approval', 'submitter',
        )
        data = {
            'activities': ActivitySubmissionListSerializer(activities, many=True).data,
        }
        return Response(data)
