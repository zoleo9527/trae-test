from rest_framework import serializers
from django.contrib.auth.models import User
from .models import (
    UserProfile, Role, StoreGroup, Store, Product, ProductStatus,
    Inventory, ReplenishmentPlan, ReplenishmentOrder, ReplenishmentStatus,
    ReplenishmentItem, TransferOrder, TransferStatus, TransferItem,
    DisplayRecord, DisplayRecordStatus, MemberRedemption, RedemptionStatus,
    AuditLog
)
from .services import (
    ReplenishmentService, TransferService, DisplayService,
    RedemptionService, InventoryService
)


class UserProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    full_name = serializers.CharField(source='user.get_full_name', read_only=True)
    role_label = serializers.CharField(source='get_role_display', read_only=True)
    store_name = serializers.CharField(source='store.name', read_only=True, allow_null=True)

    class Meta:
        model = UserProfile
        fields = ['id', 'username', 'full_name', 'role', 'role_label',
                  'store', 'store_name', 'phone']


class StoreGroupSerializer(serializers.ModelSerializer):
    manager_name = serializers.CharField(source='manager.username', read_only=True, allow_null=True)
    store_count = serializers.IntegerField(source='stores.count', read_only=True)
    _links = serializers.SerializerMethodField()

    class Meta:
        model = StoreGroup
        fields = ['id', 'name', 'description', 'manager', 'manager_name',
                  'store_count', 'created_at', '_links']

    def get__links(self, obj):
        request = self.context.get('request')
        if not request:
            return {}
        return {
            'self': request.build_absolute_uri(f'/api/store-groups/{obj.id}/'),
            'stores': request.build_absolute_uri(f'/api/stores/?group={obj.id}'),
            'plans': request.build_absolute_uri(f'/api/replenishment-plans/?store_group={obj.id}'),
        }


class StoreSerializer(serializers.ModelSerializer):
    group_name = serializers.CharField(source='group.name', read_only=True, allow_null=True)
    manager_name = serializers.CharField(source='manager.username', read_only=True, allow_null=True)
    pending_issues = serializers.SerializerMethodField()
    low_stock_count = serializers.SerializerMethodField()
    _links = serializers.SerializerMethodField()

    class Meta:
        model = Store
        fields = ['id', 'code', 'name', 'address', 'group', 'group_name',
                  'manager', 'manager_name', 'is_active', 'created_at',
                  'pending_issues', 'low_stock_count', '_links']

    def get_pending_issues(self, obj):
        return DisplayService.get_store_pending_count(obj)

    def get_low_stock_count(self, obj):
        from django.db.models import F
        return Inventory.objects.filter(
            store=obj, quantity__lte=F('product__safe_stock')
        ).count()

    def get__links(self, obj):
        request = self.context.get('request')
        if not request:
            return {}
        return {
            'self': request.build_absolute_uri(f'/api/stores/{obj.id}/'),
            'inventory': request.build_absolute_uri(f'/api/inventories/?store={obj.id}'),
            'replenishments': request.build_absolute_uri(f'/api/replenishment-orders/?store={obj.id}'),
            'transfers_in': request.build_absolute_uri(f'/api/transfer-orders/?to_store={obj.id}'),
            'transfers_out': request.build_absolute_uri(f'/api/transfer-orders/?from_store={obj.id}'),
            'displays': request.build_absolute_uri(f'/api/display-records/?store={obj.id}'),
            'redemptions': request.build_absolute_uri(f'/api/redemptions/?store={obj.id}'),
        }


class ProductSerializer(serializers.ModelSerializer):
    status_label = serializers.CharField(source='get_status_display', read_only=True)
    inventory_count = serializers.IntegerField(read_only=True, default=0)
    total_stock = serializers.IntegerField(read_only=True, default=0)
    deviations = serializers.SerializerMethodField()
    _links = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = ['id', 'sku', 'name', 'category', 'is_collaboration',
                  'collaboration_brand', 'status', 'status_label',
                  'cost_price', 'retail_price', 'points_required', 'safe_stock',
                  'inventory_count', 'total_stock', 'deviations',
                  'created_at', 'updated_at', '_links']

    def get_deviations(self, obj):
        if obj.is_collaboration:
            return InventoryService.check_deviation(obj)
        return []

    def get__links(self, obj):
        request = self.context.get('request')
        if not request:
            return {}
        return {
            'self': request.build_absolute_uri(f'/api/products/{obj.id}/'),
            'inventory': request.build_absolute_uri(f'/api/inventories/?product={obj.id}'),
            'replenishment_items': request.build_absolute_uri(f'/api/replenishment-orders/?has_deviation=true'),
        }


class InventorySerializer(serializers.ModelSerializer):
    store_code = serializers.CharField(source='store.code', read_only=True)
    store_name = serializers.CharField(source='store.name', read_only=True)
    product_sku = serializers.CharField(source='product.sku', read_only=True)
    product_name = serializers.CharField(source='product.name', read_only=True)
    safe_stock = serializers.IntegerField(source='product.safe_stock', read_only=True)
    available_quantity = serializers.IntegerField(read_only=True)
    stock_status = serializers.SerializerMethodField()
    _links = serializers.SerializerMethodField()

    class Meta:
        model = Inventory
        fields = ['id', 'store', 'store_code', 'store_name',
                  'product', 'product_sku', 'product_name',
                  'quantity', 'reserved_quantity', 'available_quantity',
                  'safe_stock', 'stock_status', 'last_counted_at',
                  'updated_at', '_links']

    def get_stock_status(self, obj):
        if obj.quantity <= 0:
            return '缺货'
        elif obj.quantity <= obj.product.safe_stock:
            return '低于安全库存'
        return '正常'

    def get__links(self, obj):
        request = self.context.get('request')
        if not request:
            return {}
        return {
            'self': request.build_absolute_uri(f'/api/inventories/{obj.id}/'),
            'store': request.build_absolute_uri(f'/api/stores/{obj.store_id}/'),
            'product': request.build_absolute_uri(f'/api/products/{obj.product_id}/'),
            'create_replenishment': request.build_absolute_uri(f'/api/replenishment-orders/'),
        }


class ReplenishmentItemSerializer(serializers.ModelSerializer):
    product_sku = serializers.CharField(source='product.sku', read_only=True)
    product_name = serializers.CharField(source='product.name', read_only=True)
    is_collaboration = serializers.BooleanField(source='product.is_collaboration', read_only=True)
    amount = serializers.SerializerMethodField()

    class Meta:
        model = ReplenishmentItem
        fields = ['id', 'product', 'product_sku', 'product_name', 'is_collaboration',
                  'requested_quantity', 'approved_quantity', 'shipped_quantity',
                  'received_quantity', 'unit_price', 'amount', 'remark']

    def get_amount(self, obj):
        qty = obj.received_quantity or obj.shipped_quantity or obj.approved_quantity or obj.requested_quantity
        return float(qty * obj.unit_price)


class ReplenishmentOrderSerializer(serializers.ModelSerializer):
    store_code = serializers.CharField(source='store.code', read_only=True)
    store_name = serializers.CharField(source='store.name', read_only=True)
    plan_name = serializers.CharField(source='plan.name', read_only=True, allow_null=True)
    status_label = serializers.CharField(source='get_status_display', read_only=True)
    priority_label = serializers.CharField(source='get_priority_display', read_only=True)
    items = ReplenishmentItemSerializer(many=True, read_only=True)
    items_data = serializers.ListField(write_only=True, required=False)
    total_amount = serializers.SerializerMethodField()
    total_requested = serializers.SerializerMethodField()
    total_shipped = serializers.SerializerMethodField()
    total_received = serializers.SerializerMethodField()
    submitted_by_name = serializers.CharField(source='submitted_by.username', read_only=True, allow_null=True)
    reviewed_by_name = serializers.CharField(source='reviewed_by.username', read_only=True, allow_null=True)
    shipped_by_name = serializers.CharField(source='shipped_by.username', read_only=True, allow_null=True)
    received_by_name = serializers.CharField(source='received_by.username', read_only=True, allow_null=True)
    available_actions = serializers.SerializerMethodField()
    audit_logs = serializers.SerializerMethodField()
    _links = serializers.SerializerMethodField()

    class Meta:
        model = ReplenishmentOrder
        fields = ['id', 'code', 'store', 'store_code', 'store_name',
                  'plan', 'plan_name', 'status', 'status_label',
                  'priority', 'priority_label', 'remark', 'reject_reason',
                  'tracking_no', 'items', 'items_data',
                  'total_requested', 'total_shipped', 'total_received', 'total_amount',
                  'submitted_by', 'submitted_by_name', 'submitted_at',
                  'reviewed_by', 'reviewed_by_name', 'reviewed_at',
                  'shipped_by', 'shipped_by_name', 'shipped_at',
                  'received_by', 'received_by_name', 'received_at',
                  'completed_at', 'cancelled_by', 'cancelled_at',
                  'created_by', 'created_at', 'updated_at',
                  'available_actions', 'audit_logs', '_links']
        read_only_fields = ['code', 'created_by']

    def get_total_requested(self, obj):
        return sum(i.requested_quantity for i in obj.items.all())

    def get_total_shipped(self, obj):
        return sum(i.shipped_quantity or 0 for i in obj.items.all())

    def get_total_received(self, obj):
        return sum(i.received_quantity or 0 for i in obj.items.all())

    def get_total_amount(self, obj):
        return float(sum(
            (i.received_quantity or i.shipped_quantity or i.approved_quantity or i.requested_quantity) * i.unit_price
            for i in obj.items.all()
        ))

    def get_available_actions(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return []
        return ReplenishmentService.get_available_actions(obj, request.user)

    def get_audit_logs(self, obj):
        from .services import AuditService
        logs = AuditService.get_object_logs(obj)[:10]
        return [{
            'action': log.get_action_display(),
            'user': log.user.username if log.user else '系统',
            'message': log.change_message,
            'created_at': log.created_at.strftime('%Y-%m-%d %H:%M')
        } for log in logs]

    def get__links(self, obj):
        request = self.context.get('request')
        if not request:
            return {}
        base = request.build_absolute_uri(f'/api/replenishment-orders/{obj.id}/')
        links = {
            'self': base,
            'store': request.build_absolute_uri(f'/api/stores/{obj.store_id}/'),
            'list': request.build_absolute_uri('/api/replenishment-orders/'),
        }
        for action in ReplenishmentService.get_available_actions(obj, request.user):
            links[action['key']] = f'{base}{action["key"]}/'
        return links

    def create(self, validated_data):
        items_data = validated_data.pop('items_data', [])
        request = self.context.get('request')
        validated_data['created_by'] = request.user
        validated_data['code'] = ReplenishmentService.generate_code()

        if not validated_data.get('store') and request.user.profile.role == Role.STORE_MANAGER:
            validated_data['store'] = request.user.profile.store

        order = ReplenishmentOrder.objects.create(**validated_data)

        for item_data in items_data:
            ReplenishmentItem.objects.create(order=order, **item_data)

        from .services import AuditService
        AuditService.log_create(request.user, order, request)
        return order

    def update(self, instance, validated_data):
        if instance.status not in [ReplenishmentStatus.DRAFT]:
            raise serializers.ValidationError('只能编辑草稿状态的补货单')

        items_data = validated_data.pop('items_data', None)
        request = self.context.get('request')

        old_values = {}
        for field, new_val in validated_data.items():
            old_values[field] = (getattr(instance, field), new_val)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if items_data is not None:
            instance.items.all().delete()
            for item_data in items_data:
                ReplenishmentItem.objects.create(order=instance, **item_data)

        from .services import AuditService
        if old_values:
            AuditService.log_update(request.user, instance, old_values, request)

        return instance


class TransferItemSerializer(serializers.ModelSerializer):
    product_sku = serializers.CharField(source='product.sku', read_only=True)
    product_name = serializers.CharField(source='product.name', read_only=True)

    class Meta:
        model = TransferItem
        fields = ['id', 'product', 'product_sku', 'product_name',
                  'transfer_quantity', 'out_quantity', 'in_quantity', 'remark']


class TransferOrderSerializer(serializers.ModelSerializer):
    from_store_code = serializers.CharField(source='from_store.code', read_only=True)
    from_store_name = serializers.CharField(source='from_store.name', read_only=True)
    to_store_code = serializers.CharField(source='to_store.code', read_only=True)
    to_store_name = serializers.CharField(source='to_store.name', read_only=True)
    status_label = serializers.CharField(source='get_status_display', read_only=True)
    items = TransferItemSerializer(many=True, read_only=True)
    items_data = serializers.ListField(write_only=True, required=False)
    total_quantity = serializers.SerializerMethodField()
    submitted_by_name = serializers.CharField(source='submitted_by.username', read_only=True, allow_null=True)
    out_confirmed_by_name = serializers.CharField(source='out_confirmed_by.username', read_only=True, allow_null=True)
    in_confirmed_by_name = serializers.CharField(source='in_confirmed_by.username', read_only=True, allow_null=True)
    available_actions = serializers.SerializerMethodField()
    audit_logs = serializers.SerializerMethodField()
    _links = serializers.SerializerMethodField()

    class Meta:
        model = TransferOrder
        fields = ['id', 'code', 'from_store', 'from_store_code', 'from_store_name',
                  'to_store', 'to_store_code', 'to_store_name',
                  'reason', 'status', 'status_label', 'reject_reason',
                  'items', 'items_data', 'total_quantity',
                  'submitted_by', 'submitted_by_name', 'submitted_at',
                  'out_confirmed_by', 'out_confirmed_by_name', 'out_confirmed_at',
                  'in_confirmed_by', 'in_confirmed_by_name', 'in_confirmed_at',
                  'completed_at', 'cancelled_by', 'cancelled_at',
                  'created_by', 'created_at', 'updated_at',
                  'available_actions', 'audit_logs', '_links']
        read_only_fields = ['code', 'created_by']

    def get_total_quantity(self, obj):
        return sum(i.transfer_quantity for i in obj.items.all())

    def get_available_actions(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return []
        return TransferService.get_available_actions(obj, request.user)

    def get_audit_logs(self, obj):
        from .services import AuditService
        logs = AuditService.get_object_logs(obj)[:10]
        return [{
            'action': log.get_action_display(),
            'user': log.user.username if log.user else '系统',
            'message': log.change_message,
            'created_at': log.created_at.strftime('%Y-%m-%d %H:%M')
        } for log in logs]

    def get__links(self, obj):
        request = self.context.get('request')
        if not request:
            return {}
        base = request.build_absolute_uri(f'/api/transfer-orders/{obj.id}/')
        links = {
            'self': base,
            'from_store': request.build_absolute_uri(f'/api/stores/{obj.from_store_id}/'),
            'to_store': request.build_absolute_uri(f'/api/stores/{obj.to_store_id}/'),
            'list': request.build_absolute_uri('/api/transfer-orders/'),
        }
        for action in TransferService.get_available_actions(obj, request.user):
            links[action['key']] = f'{base}{action["key"]}/'
        return links

    def create(self, validated_data):
        items_data = validated_data.pop('items_data', [])
        request = self.context.get('request')
        validated_data['created_by'] = request.user
        validated_data['code'] = TransferService.generate_code()

        order = TransferOrder.objects.create(**validated_data)

        for item_data in items_data:
            TransferItem.objects.create(order=order, **item_data)

        from .services import AuditService
        AuditService.log_create(request.user, order, request)
        return order

    def update(self, instance, validated_data):
        if instance.status not in [TransferStatus.DRAFT]:
            raise serializers.ValidationError('只能编辑草稿状态的调拨单')

        items_data = validated_data.pop('items_data', None)
        request = self.context.get('request')

        old_values = {}
        for field, new_val in validated_data.items():
            old_values[field] = (getattr(instance, field), new_val)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if items_data is not None:
            instance.items.all().delete()
            for item_data in items_data:
                TransferItem.objects.create(order=instance, **item_data)

        from .services import AuditService
        if old_values:
            AuditService.log_update(request.user, instance, old_values, request)

        return instance


class DisplayRecordSerializer(serializers.ModelSerializer):
    store_code = serializers.CharField(source='store.code', read_only=True)
    store_name = serializers.CharField(source='store.name', read_only=True)
    product_sku = serializers.CharField(source='product.sku', read_only=True)
    product_name = serializers.CharField(source='product.name', read_only=True)
    status_label = serializers.CharField(source='get_status_display', read_only=True)
    checked_by_name = serializers.CharField(source='checked_by.username', read_only=True, allow_null=True)
    fixed_by_name = serializers.CharField(source='fixed_by.username', read_only=True, allow_null=True)
    verified_by_name = serializers.CharField(source='verified_by.username', read_only=True, allow_null=True)
    available_actions = serializers.SerializerMethodField()
    is_overdue = serializers.SerializerMethodField()
    _links = serializers.SerializerMethodField()

    class Meta:
        model = DisplayRecord
        fields = ['id', 'store', 'store_code', 'store_name',
                  'product', 'product_sku', 'product_name',
                  'check_date', 'issue_type', 'description', 'photo_url',
                  'status', 'status_label', 'is_overdue',
                  'fix_note', 'fix_photo_url',
                  'checked_by', 'checked_by_name',
                  'fixed_by', 'fixed_by_name', 'fixed_at',
                  'verified_by', 'verified_by_name', 'verified_at',
                  'created_at', 'available_actions', '_links']
        read_only_fields = ['checked_by']

    def get_is_overdue(self, obj):
        from django.utils import timezone
        if obj.status == DisplayRecordStatus.PENDING:
            return (timezone.localdate() - obj.check_date).days > 7
        return False

    def get_available_actions(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return []
        return DisplayService.get_available_actions(obj, request.user)

    def get__links(self, obj):
        request = self.context.get('request')
        if not request:
            return {}
        base = request.build_absolute_uri(f'/api/display-records/{obj.id}/')
        links = {
            'self': base,
            'store': request.build_absolute_uri(f'/api/stores/{obj.store_id}/'),
            'product': request.build_absolute_uri(f'/api/products/{obj.product_id}/'),
            'list': request.build_absolute_uri('/api/display-records/'),
        }
        for action in DisplayService.get_available_actions(obj, request.user):
            links[action['key']] = f'{base}{action["key"]}/'
        return links

    def create(self, validated_data):
        request = self.context.get('request')
        validated_data['checked_by'] = request.user
        record = DisplayRecord.objects.create(**validated_data)

        from .services import AuditService
        AuditService.log_create(request.user, record, request)
        return record


class MemberRedemptionSerializer(serializers.ModelSerializer):
    store_code = serializers.CharField(source='store.code', read_only=True)
    store_name = serializers.CharField(source='store.name', read_only=True)
    product_sku = serializers.CharField(source='product.sku', read_only=True)
    product_name = serializers.CharField(source='product.name', read_only=True)
    status_label = serializers.CharField(source='get_status_display', read_only=True)
    processed_by_name = serializers.CharField(source='processed_by.username', read_only=True, allow_null=True)
    completed_by_name = serializers.CharField(source='completed_by.username', read_only=True, allow_null=True)
    available_actions = serializers.SerializerMethodField()
    total_points = serializers.SerializerMethodField()
    _links = serializers.SerializerMethodField()

    class Meta:
        model = MemberRedemption
        fields = ['id', 'code', 'member_name', 'member_phone', 'member_points',
                  'product', 'product_sku', 'product_name',
                  'quantity', 'points_used', 'total_points',
                  'store', 'store_code', 'store_name',
                  'status', 'status_label', 'reject_reason', 'tracking_no',
                  'processed_by', 'processed_by_name', 'processed_at',
                  'completed_by', 'completed_by_name', 'completed_at',
                  'created_at', 'updated_at',
                  'available_actions', '_links']
        read_only_fields = ['code']

    def get_total_points(self, obj):
        return obj.points_used * obj.quantity

    def get_available_actions(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return []
        return RedemptionService.get_available_actions(obj, request.user)

    def get__links(self, obj):
        request = self.context.get('request')
        if not request:
            return {}
        base = request.build_absolute_uri(f'/api/redemptions/{obj.id}/')
        links = {
            'self': base,
            'store': request.build_absolute_uri(f'/api/stores/{obj.store_id}/'),
            'product': request.build_absolute_uri(f'/api/products/{obj.product_id}/'),
            'list': request.build_absolute_uri('/api/redemptions/'),
        }
        for action in RedemptionService.get_available_actions(obj, request.user):
            links[action['key']] = f'{base}{action["key"]}/'
        return links

    def create(self, validated_data):
        validated_data['code'] = RedemptionService.generate_code()
        request = self.context.get('request')
        redemption = MemberRedemption.objects.create(**validated_data)

        from .services import AuditService
        AuditService.log_create(request.user, redemption, request)
        return redemption


class AuditLogSerializer(serializers.ModelSerializer):
    action_label = serializers.CharField(source='get_action_display', read_only=True)
    username = serializers.CharField(source='user.username', read_only=True, allow_null=True)

    class Meta:
        model = AuditLog
        fields = ['id', 'action', 'action_label', 'user', 'username',
                  'model_name', 'object_id', 'object_repr',
                  'field_name', 'old_value', 'new_value', 'change_message',
                  'ip_address', 'created_at']


class ReplenishmentPlanSerializer(serializers.ModelSerializer):
    store_group_name = serializers.CharField(source='store_group.name', read_only=True, allow_null=True)
    created_by_name = serializers.CharField(source='created_by.username', read_only=True, allow_null=True)
    order_count = serializers.IntegerField(source='orders.count', read_only=True)
    store_names = serializers.SerializerMethodField()
    _links = serializers.SerializerMethodField()

    class Meta:
        model = ReplenishmentPlan
        fields = ['id', 'code', 'name', 'description', 'store_group',
                  'store_group_name', 'stores', 'store_names', 'plan_date',
                  'order_count', 'created_by', 'created_by_name', 'created_at', '_links']
        read_only_fields = ['code', 'created_by']

    def get_store_names(self, obj):
        return [s.name for s in obj.stores.all()]

    def get__links(self, obj):
        request = self.context.get('request')
        if not request:
            return {}
        return {
            'self': request.build_absolute_uri(f'/api/replenishment-plans/{obj.id}/'),
            'orders': request.build_absolute_uri(f'/api/replenishment-orders/?plan={obj.id}'),
            'generate_orders': request.build_absolute_uri(f'/api/replenishment-plans/{obj.id}/generate-orders/'),
        }

    def create(self, validated_data):
        stores = validated_data.pop('stores', [])
        request = self.context.get('request')
        validated_data['created_by'] = request.user
        from django.utils import timezone
        validated_data['code'] = f'PL{timezone.localdate().strftime("%Y%m%d")}{ReplenishmentPlan.objects.count() + 1:04d}'
        plan = ReplenishmentPlan.objects.create(**validated_data)
        plan.stores.set(stores)

        from .services import AuditService
        AuditService.log_create(request.user, plan, request)
        return plan
