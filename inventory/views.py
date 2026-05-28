from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.db.models import Prefetch, Count, Sum, F
from django_filters.rest_framework import DjangoFilterBackend

from .models import (
    StoreGroup, Store, Product, Inventory,
    ReplenishmentPlan, ReplenishmentOrder, ReplenishmentItem,
    TransferOrder, TransferItem, DisplayRecord, MemberRedemption,
    AuditLog, Role, ProductStatus
)
from .serializers import (
    StoreGroupSerializer, StoreSerializer, ProductSerializer,
    InventorySerializer, ReplenishmentPlanSerializer,
    ReplenishmentOrderSerializer, TransferOrderSerializer,
    DisplayRecordSerializer, MemberRedemptionSerializer,
    AuditLogSerializer
)
from .filters import (
    StoreFilter, ProductFilter, InventoryFilter,
    ReplenishmentOrderFilter, TransferOrderFilter,
    DisplayRecordFilter, MemberRedemptionFilter, AuditLogFilter
)
from .permissions import (
    ReplenishmentPermission, TransferPermission, DisplayRecordPermission,
    IsPlanner, IsWarehouse, IsStoreManagerOrPlanner, IsPlannerOrWarehouse
)
from .services import (
    ReplenishmentService, TransferService, DisplayService,
    RedemptionService, ExportService, InventoryService
)
from .exceptions import ValidationFailedException
import logging

logger = logging.getLogger(__name__)


class BaseViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]

    def get_queryset(self):
        qs = super().get_queryset()
        role = getattr(self.request.user.profile, 'role', None) if hasattr(self.request.user, 'profile') else None
        if role == Role.STORE_MANAGER:
            user_store = getattr(self.request.user.profile, 'store', None)
            if hasattr(self.queryset.model, 'store'):
                qs = qs.filter(store=user_store)
            elif hasattr(self.queryset.model, 'from_store'):
                qs = qs.filter(from_store=user_store) | qs.filter(to_store=user_store)
        return qs


class StoreGroupViewSet(BaseViewSet):
    queryset = StoreGroup.objects.prefetch_related('stores').annotate(
        store_count=Count('stores')
    ).order_by('-created_at')
    serializer_class = StoreGroupSerializer
    permission_classes = [IsAuthenticated, IsPlannerOrWarehouse]
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'created_at']


class StoreViewSet(BaseViewSet):
    queryset = Store.objects.select_related('group', 'manager').filter(
        is_active=True
    ).order_by('code')
    serializer_class = StoreSerializer
    filterset_class = StoreFilter
    permission_classes = [IsAuthenticated]
    search_fields = ['code', 'name', 'address']
    ordering_fields = ['code', 'name', 'created_at']

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsPlannerOrWarehouse()]
        return super().get_permissions()


class ProductViewSet(BaseViewSet):
    queryset = Product.objects.annotate(
        inventory_count=Count('inventories'),
        total_stock=Sum('inventories__quantity')
    ).order_by('sku')
    serializer_class = ProductSerializer
    filterset_class = ProductFilter
    permission_classes = [IsAuthenticated]
    search_fields = ['sku', 'name', 'category', 'collaboration_brand']
    ordering_fields = ['sku', 'name', 'created_at', 'updated_at']

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy', 'sync_status']:
            return [IsPlanner()]
        return super().get_permissions()

    def update(self, request, *args, **kwargs):
        if 'status' in request.data:
            raise ValidationFailedException(
                detail='请使用 /api/products/{id}/sync-status/ 接口修改商品状态'
            )
        return super().update(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        if 'status' in request.data:
            raise ValidationFailedException(
                detail='请使用 /api/products/{id}/sync-status/ 接口修改商品状态'
            )
        return super().partial_update(request, *args, **kwargs)

    @action(detail=True, methods=['post'], url_path='sync-status')
    def sync_status(self, request, pk=None):
        product = self.get_object()
        target_status = request.data.get('status')
        if target_status not in [ProductStatus.LISTED, ProductStatus.DELISTED]:
            raise ValidationFailedException(detail='无效的状态值')

        if product.is_collaboration:
            result = InventoryService.sync_collaboration_product(
                product, target_status, request.user
            )
            return Response({
                'message': '联名商品状态已同步',
                'data': {
                    'old_status': result['old_status'],
                    'new_status': result['new_status'],
                    'affected_stores': result['affected_stores'],
                    'inventory_records': result['inventory_records'],
                }
            }, status=status.HTTP_200_OK)
        else:
            result = InventoryService.update_product_status(
                product, target_status, request.user
            )
            return Response({
                'message': '商品状态已更新',
                'data': {
                    'old_status': result['old_status'],
                    'new_status': result['new_status'],
                }
            }, status=status.HTTP_200_OK)


class InventoryViewSet(BaseViewSet):
    queryset = Inventory.objects.select_related('store', 'product').order_by(
        'store__code', 'product__sku'
    )
    serializer_class = InventorySerializer
    filterset_class = InventoryFilter
    permission_classes = [IsAuthenticated]
    search_fields = ['store__code', 'store__name', 'product__sku', 'product__name']
    ordering_fields = ['quantity', 'updated_at']

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsWarehouse()]
        return super().get_permissions()

    @action(detail=False, methods=['get'], url_path='alerts')
    def alerts(self, request):
        store_id = request.query_params.get('store')
        store = Store.objects.get(id=store_id) if store_id else None
        alerts = InventoryService.get_low_stock_alerts(store=store)
        return Response({
            'count': len(alerts),
            'results': alerts
        })

    @action(detail=False, methods=['post'], url_path='export')
    def export(self, request):
        queryset = self.filter_queryset(self.get_queryset())
        return ExportService.export_inventory(queryset, request.user, request)


class ReplenishmentPlanViewSet(BaseViewSet):
    queryset = ReplenishmentPlan.objects.prefetch_related('stores').annotate(
        order_count=Count('orders')
    ).order_by('-created_at')
    serializer_class = ReplenishmentPlanSerializer
    permission_classes = [IsAuthenticated, IsPlanner]
    search_fields = ['code', 'name', 'description']
    ordering_fields = ['plan_date', 'created_at']

    @action(detail=True, methods=['post'], url_path='generate-orders')
    def generate_orders(self, request, pk=None):
        plan = self.get_object()
        stores = plan.stores.all()
        if plan.store_group:
            stores = stores | plan.store_group.stores.all()
        stores = stores.distinct()

        if not stores.exists():
            raise ValidationFailedException(detail='该计划没有关联的门店')

        created_orders = []
        for store in stores:
            low_stock_products = Inventory.objects.filter(
                store=store,
                quantity__lte=F('product__safe_stock')
            ).select_related('product')

            if not low_stock_products.exists():
                continue

            order = ReplenishmentOrder.objects.create(
                code=ReplenishmentService.generate_code(),
                plan=plan,
                store=store,
                created_by=request.user,
                remark=f'根据补货计划【{plan.name}】自动生成'
            )

            for inv in low_stock_products:
                need_qty = max(
                    inv.product.safe_stock * 2 - inv.quantity,
                    inv.product.safe_stock
                )
                ReplenishmentItem.objects.create(
                    order=order,
                    product=inv.product,
                    requested_quantity=need_qty,
                    unit_price=inv.product.cost_price
                )

            created_orders.append(order)

        return Response({
            'message': f'已为 {len(created_orders)} 家门店生成补货单',
            'order_codes': [o.code for o in created_orders]
        }, status=status.HTTP_201_CREATED)


class ReplenishmentOrderViewSet(BaseViewSet):
    queryset = ReplenishmentOrder.objects.select_related(
        'store', 'plan', 'submitted_by', 'reviewed_by',
        'shipped_by', 'received_by'
    ).prefetch_related(
        Prefetch('items', queryset=ReplenishmentItem.objects.select_related('product'))
    ).order_by('-created_at')
    serializer_class = ReplenishmentOrderSerializer
    filterset_class = ReplenishmentOrderFilter
    permission_classes = [IsAuthenticated, ReplenishmentPermission]
    search_fields = ['code', 'remark', 'store__name', 'store__code']
    ordering_fields = ['created_at', 'submitted_at', 'priority']

    @action(detail=True, methods=['post'], url_path='submit')
    def submit(self, request, pk=None):
        order = self.get_object()
        order = ReplenishmentService.submit(order, request.user, request)
        return Response({
            'message': '补货单已提交',
            'status': order.status,
            'status_label': order.get_status_display()
        })

    @action(detail=True, methods=['post'], url_path='review')
    def review(self, request, pk=None):
        order = self.get_object()
        approved_items = request.data.get('approved_items')
        order = ReplenishmentService.review(order, request.user, request, approved_items)
        return Response({
            'message': '补货单已审核通过',
            'status': order.status,
            'status_label': order.get_status_display()
        })

    @action(detail=True, methods=['post'], url_path='reject')
    def reject(self, request, pk=None):
        order = self.get_object()
        reason = request.data.get('reason', '')
        order = ReplenishmentService.reject(order, request.user, reason, request)
        return Response({
            'message': '补货单已驳回',
            'status': order.status,
            'status_label': order.get_status_display(),
            'reject_reason': order.reject_reason
        })

    @action(detail=True, methods=['post'], url_path='ship')
    def ship(self, request, pk=None):
        order = self.get_object()
        shipped_items = request.data.get('shipped_items')
        tracking_no = request.data.get('tracking_no')
        order = ReplenishmentService.ship(order, request.user, shipped_items, tracking_no, request)
        return Response({
            'message': '补货单已发货',
            'status': order.status,
            'status_label': order.get_status_display(),
            'tracking_no': order.tracking_no
        })

    @action(detail=True, methods=['post'], url_path='receive')
    def receive(self, request, pk=None):
        order = self.get_object()
        received_items = request.data.get('received_items')
        order = ReplenishmentService.receive(order, request.user, received_items, request)
        return Response({
            'message': '补货单已收货',
            'status': order.status,
            'status_label': order.get_status_display()
        })

    @action(detail=True, methods=['post'], url_path='complete')
    def complete(self, request, pk=None):
        order = self.get_object()
        order = ReplenishmentService.complete(order, request.user, request)
        return Response({
            'message': '补货单已完成',
            'status': order.status,
            'status_label': order.get_status_display()
        })

    @action(detail=True, methods=['post'], url_path='cancel')
    def cancel(self, request, pk=None):
        order = self.get_object()
        reason = request.data.get('reason', '')
        order = ReplenishmentService.cancel(order, request.user, reason, request)
        return Response({
            'message': '补货单已取消',
            'status': order.status,
            'status_label': order.get_status_display()
        })

    @action(detail=False, methods=['post'], url_path='export')
    def export(self, request):
        queryset = self.filter_queryset(self.get_queryset())
        return ExportService.export_replenishment_orders(queryset, request.user, request)


class TransferOrderViewSet(BaseViewSet):
    queryset = TransferOrder.objects.select_related(
        'from_store', 'to_store', 'submitted_by',
        'out_confirmed_by', 'in_confirmed_by'
    ).prefetch_related(
        Prefetch('items', queryset=TransferItem.objects.select_related('product'))
    ).order_by('-created_at')
    serializer_class = TransferOrderSerializer
    filterset_class = TransferOrderFilter
    permission_classes = [IsAuthenticated, TransferPermission]
    search_fields = ['code', 'reason', 'from_store__name', 'to_store__name']
    ordering_fields = ['created_at', 'submitted_at']

    @action(detail=True, methods=['post'], url_path='submit')
    def submit(self, request, pk=None):
        order = self.get_object()
        order = TransferService.submit(order, request.user, request)
        return Response({
            'message': '调拨单已提交',
            'status': order.status,
            'status_label': order.get_status_display()
        })

    @action(detail=True, methods=['post'], url_path='out-confirm')
    def out_confirm(self, request, pk=None):
        order = self.get_object()
        out_items = request.data.get('out_items')
        order = TransferService.out_confirm(order, request.user, out_items, request)
        return Response({
            'message': '调拨单已确认转出',
            'status': order.status,
            'status_label': order.get_status_display()
        })

    @action(detail=True, methods=['post'], url_path='out-reject')
    def out_reject(self, request, pk=None):
        order = self.get_object()
        reason = request.data.get('reason', '')
        order = TransferService.out_reject(order, request.user, reason, request)
        return Response({
            'message': '调拨单已拒绝转出',
            'status': order.status,
            'status_label': order.get_status_display(),
            'reject_reason': order.reject_reason
        })

    @action(detail=True, methods=['post'], url_path='in-confirm')
    def in_confirm(self, request, pk=None):
        order = self.get_object()
        in_items = request.data.get('in_items')
        order = TransferService.in_confirm(order, request.user, in_items, request)
        return Response({
            'message': '调拨单已确认转入',
            'status': order.status,
            'status_label': order.get_status_display()
        })

    @action(detail=True, methods=['post'], url_path='in-reject')
    def in_reject(self, request, pk=None):
        order = self.get_object()
        reason = request.data.get('reason', '')
        order = TransferService.in_reject(order, request.user, reason, request)
        return Response({
            'message': '调拨单已拒绝转入',
            'status': order.status,
            'status_label': order.get_status_display(),
            'reject_reason': order.reject_reason
        })

    @action(detail=True, methods=['post'], url_path='cancel')
    def cancel(self, request, pk=None):
        order = self.get_object()
        reason = request.data.get('reason', '')
        order = TransferService.cancel(order, request.user, reason, request)
        return Response({
            'message': '调拨单已取消',
            'status': order.status,
            'status_label': order.get_status_display()
        })

    @action(detail=False, methods=['post'], url_path='export')
    def export(self, request):
        queryset = self.filter_queryset(self.get_queryset())
        return ExportService.export_transfer_orders(queryset, request.user, request)


class DisplayRecordViewSet(BaseViewSet):
    queryset = DisplayRecord.objects.select_related(
        'store', 'product', 'checked_by', 'fixed_by', 'verified_by'
    ).order_by('-created_at')
    serializer_class = DisplayRecordSerializer
    filterset_class = DisplayRecordFilter
    permission_classes = [IsAuthenticated, DisplayRecordPermission]
    search_fields = ['description', 'fix_note', 'store__name', 'product__name']
    ordering_fields = ['check_date', 'created_at']

    @action(detail=True, methods=['post'], url_path='fix')
    def fix(self, request, pk=None):
        record = self.get_object()
        fix_note = request.data.get('fix_note', '')
        fix_photo_url = request.data.get('fix_photo_url')
        record = DisplayService.fix(record, request.user, fix_note, fix_photo_url, request)
        return Response({
            'message': '陈列问题已整改',
            'status': record.status,
            'status_label': record.get_status_display()
        })

    @action(detail=True, methods=['post'], url_path='verify')
    def verify(self, request, pk=None):
        record = self.get_object()
        passed = request.data.get('passed', True)
        remark = request.data.get('remark', '')
        record = DisplayService.verify(record, request.user, passed, remark, request)
        return Response({
            'message': '陈列问题已复核' + ('通过' if passed else '不通过'),
            'status': record.status,
            'status_label': record.get_status_display()
        })

    @action(detail=False, methods=['get'], url_path='overdue')
    def overdue(self, request):
        days = int(request.query_params.get('days', 7))
        records = DisplayService.get_overdue_records(days=days)
        page = self.paginate_queryset(records)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(records, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['post'], url_path='export')
    def export(self, request):
        queryset = self.filter_queryset(self.get_queryset())
        return ExportService.export_display_records(queryset, request.user, request)


class MemberRedemptionViewSet(BaseViewSet):
    queryset = MemberRedemption.objects.select_related(
        'store', 'product', 'processed_by', 'completed_by'
    ).order_by('-created_at')
    serializer_class = MemberRedemptionSerializer
    filterset_class = MemberRedemptionFilter
    permission_classes = [IsAuthenticated]
    search_fields = ['code', 'member_name', 'member_phone', 'product__name']
    ordering_fields = ['created_at', 'processed_at']

    def get_permissions(self):
        if self.action in ['process', 'reject', 'ship', 'complete', 'cancel']:
            return [IsAuthenticated(), IsStoreManagerOrPlanner()]
        return super().get_permissions()

    @action(detail=True, methods=['post'], url_path='process')
    def process(self, request, pk=None):
        redemption = self.get_object()
        redemption = RedemptionService.process(redemption, request.user, request)
        return Response({
            'message': '兑换申请已处理',
            'status': redemption.status,
            'status_label': redemption.get_status_display()
        })

    @action(detail=True, methods=['post'], url_path='reject')
    def reject(self, request, pk=None):
        redemption = self.get_object()
        reason = request.data.get('reason', '')
        redemption = RedemptionService.reject(redemption, request.user, reason, request)
        return Response({
            'message': '兑换申请已拒绝',
            'status': redemption.status,
            'status_label': redemption.get_status_display(),
            'reject_reason': redemption.reject_reason
        })

    @action(detail=True, methods=['post'], url_path='ship')
    def ship(self, request, pk=None):
        redemption = self.get_object()
        tracking_no = request.data.get('tracking_no')
        redemption = RedemptionService.ship(redemption, request.user, tracking_no, request)
        return Response({
            'message': '兑换商品已发货',
            'status': redemption.status,
            'status_label': redemption.get_status_display(),
            'tracking_no': redemption.tracking_no
        })

    @action(detail=True, methods=['post'], url_path='complete')
    def complete(self, request, pk=None):
        redemption = self.get_object()
        redemption = RedemptionService.complete(redemption, request.user, request)
        return Response({
            'message': '兑换已完成',
            'status': redemption.status,
            'status_label': redemption.get_status_display()
        })

    @action(detail=True, methods=['post'], url_path='cancel')
    def cancel(self, request, pk=None):
        redemption = self.get_object()
        reason = request.data.get('reason', '')
        redemption = RedemptionService.cancel(redemption, request.user, reason, request)
        return Response({
            'message': '兑换已取消',
            'status': redemption.status,
            'status_label': redemption.get_status_display()
        })

    @action(detail=False, methods=['post'], url_path='export')
    def export(self, request):
        queryset = self.filter_queryset(self.get_queryset())
        return ExportService.export_redemptions(queryset, request.user, request)


class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AuditLog.objects.select_related('user').order_by('-created_at')
    serializer_class = AuditLogSerializer
    filterset_class = AuditLogFilter
    permission_classes = [IsAuthenticated, IsPlannerOrWarehouse]
    search_fields = ['object_repr', 'change_message', 'field_name', 'user__username']
    ordering_fields = ['created_at']

    def get_queryset(self):
        qs = super().get_queryset()
        model_name = self.request.query_params.get('model_name')
        object_id = self.request.query_params.get('object_id')
        if model_name and object_id:
            qs = qs.filter(model_name=model_name, object_id=object_id)
        return qs


class DashboardViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['get'], url_path='stats')
    def stats(self, request):
        role = getattr(request.user.profile, 'role', None)
        user_store = getattr(request.user.profile, 'store', None)

        base_filter = {}
        if role == Role.STORE_MANAGER and user_store:
            base_filter['store'] = user_store

        replenishment_stats = {
            'draft': ReplenishmentOrder.objects.filter(status='draft', **base_filter).count(),
            'submitted': ReplenishmentOrder.objects.filter(status='submitted', **base_filter).count(),
            'processing': ReplenishmentOrder.objects.filter(
                status__in=['reviewing', 'processing', 'shipped'], **base_filter
            ).count(),
            'completed': ReplenishmentOrder.objects.filter(status='completed', **base_filter).count(),
        }

        transfer_base = {}
        if role == Role.STORE_MANAGER and user_store:
            transfer_base = {
                'from_store': user_store
            }
        transfer_out_stats = {
            'pending': TransferOrder.objects.filter(status__in=['submitted', 'out_review'], **transfer_base).count(),
            'completed': TransferOrder.objects.filter(status='completed', **transfer_base).count(),
        }

        transfer_in_base = {}
        if role == Role.STORE_MANAGER and user_store:
            transfer_in_base = {'to_store': user_store}
        transfer_in_stats = {
            'pending': TransferOrder.objects.filter(
                status__in=['out_confirmed', 'in_review'], **transfer_in_base
            ).count(),
            'completed': TransferOrder.objects.filter(status='completed', **transfer_in_base).count(),
        }

        display_base = {}
        if role == Role.STORE_MANAGER and user_store:
            display_base = {'store': user_store}
        display_stats = {
            'pending': DisplayRecord.objects.filter(status='pending', **display_base).count(),
            'overdue': len(DisplayService.get_overdue_records(days=7)),
            'completed': DisplayRecord.objects.filter(status='verified', **display_base).count(),
        }

        low_stock_alerts = InventoryService.get_low_stock_alerts(store=user_store)[:10]

        return Response({
            'replenishment': replenishment_stats,
            'transfer_out': transfer_out_stats,
            'transfer_in': transfer_in_stats,
            'display': display_stats,
            'low_stock_alerts': low_stock_alerts,
            'user_role': role,
            'user_store': user_store.code if user_store else None,
        })
