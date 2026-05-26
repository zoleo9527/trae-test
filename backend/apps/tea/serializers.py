from django.db import transaction
from django.utils import timezone
from rest_framework import serializers

from apps.tea.models import (
    ActivitySubmission, AuditLog, Batch, InventoryRecord, Order, OrderItem,
    PriceApproval, Product, Shipment, ShipmentItem, Store, TrialFollowUp,
    Warehouse,
)


class ProductSerializer(serializers.ModelSerializer):
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = Product
        fields = '__all__'
        read_only_fields = ('created_at', 'created_by', 'updated_at', 'updated_by')


class WarehouseSerializer(serializers.ModelSerializer):
    region_display = serializers.CharField(source='get_region_display', read_only=True)

    class Meta:
        model = Warehouse
        fields = '__all__'
        read_only_fields = ('created_at', 'created_by', 'updated_at', 'updated_by')


class StoreSerializer(serializers.ModelSerializer):
    region_display = serializers.CharField(source='get_region_display', read_only=True)
    responsible_warehouse_name = serializers.CharField(source='responsible_warehouse.name', read_only=True)

    class Meta:
        model = Store
        fields = '__all__'
        read_only_fields = ('created_at', 'created_by', 'updated_at', 'updated_by')


class BatchSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    current_quantity = serializers.DecimalField(
        max_digits=12, decimal_places=2, read_only=True,
    )
    product_name = serializers.CharField(source='product.name', read_only=True)
    warehouse_name = serializers.CharField(source='warehouse.name', read_only=True)

    class Meta:
        model = Batch
        fields = '__all__'
        read_only_fields = ('created_at', 'created_by', 'updated_at', 'updated_by')


class InventoryRecordSerializer(serializers.ModelSerializer):
    change_type_display = serializers.CharField(source='get_change_type_display', read_only=True)
    reference_type_display = serializers.CharField(source='get_reference_type_display', read_only=True)
    batch_no = serializers.CharField(source='batch.batch_no', read_only=True)

    class Meta:
        model = InventoryRecord
        fields = '__all__'
        read_only_fields = ('created_at', 'created_by', 'updated_at', 'updated_by')


class PriceApprovalListSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_sku = serializers.CharField(source='product.sku', read_only=True)
    store_name = serializers.CharField(source='store.name', read_only=True, default=None)
    submitter_name = serializers.CharField(source='submitter.username', read_only=True, default=None)
    approver_name = serializers.CharField(source='approver.username', read_only=True, default=None)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = PriceApproval
        fields = (
            'id', 'code', 'product', 'product_sku', 'product_name',
            'store', 'store_name', 'proposed_unit_price', 'effective_from',
            'effective_to', 'reason', 'status', 'status_display',
            'submitter', 'submitter_name', 'approver', 'approver_name',
            'approved_at', 'rejection_reason', 'created_at',
        )
        read_only_fields = ('created_at',)


class PriceApprovalSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    product_name = serializers.CharField(source='product.name', read_only=True)
    store_name = serializers.CharField(source='store.name', read_only=True, default=None)
    submitter_name = serializers.CharField(source='submitter.username', read_only=True, default=None)
    approver_name = serializers.CharField(source='approver.username', read_only=True, default=None)

    class Meta:
        model = PriceApproval
        fields = '__all__'
        read_only_fields = ('created_at', 'created_by', 'updated_at', 'updated_by', 'approved_at')

    def create(self, validated_data):
        validated_data['submitter'] = self.context['request'].user
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)

    def update(self, instance, validated_data):
        if instance.status != 'pending':
            raise serializers.ValidationError('只有待审批状态的审批单可以修改')
        validated_data['updated_by'] = self.context['request'].user
        return super().update(instance, validated_data)


class ActivitySubmissionListSerializer(serializers.ModelSerializer):
    price_approval_code = serializers.CharField(source='price_approval.code', read_only=True)
    activity_type_display = serializers.CharField(source='get_activity_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    submitter_name = serializers.CharField(source='submitter.username', read_only=True, default=None)
    approver_name = serializers.CharField(source='approver.username', read_only=True, default=None)

    class Meta:
        model = ActivitySubmission
        fields = (
            'id', 'code', 'price_approval', 'price_approval_code',
            'activity_type', 'activity_type_display', 'activity_name',
            'activity_period_from', 'activity_period_to', 'target_sales_quantity',
            'budget', 'status', 'status_display', 'submitter', 'submitter_name',
            'approver', 'approver_name', 'approved_at', 'rejection_reason',
            'review_note', 'created_at',
        )
        read_only_fields = ('created_at',)


class ActivitySubmissionSerializer(serializers.ModelSerializer):
    price_approval_code = serializers.CharField(source='price_approval.code', read_only=True)
    activity_type_display = serializers.CharField(source='get_activity_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    submitter_name = serializers.CharField(source='submitter.username', read_only=True, default=None)
    approver_name = serializers.CharField(source='approver.username', read_only=True, default=None)
    effective_unit_price = serializers.DecimalField(
        max_digits=10, decimal_places=2, read_only=True,
    )

    class Meta:
        model = ActivitySubmission
        fields = '__all__'
        read_only_fields = ('created_at', 'created_by', 'updated_at', 'updated_by', 'approved_at')

    def validate_price_approval(self, value):
        if value.status != 'approved':
            raise serializers.ValidationError('只能关联已通过的价格审批单')
        if hasattr(value, 'activity') and value.activity:
            raise serializers.ValidationError('该价格审批单已关联活动提报')
        return value

    def create(self, validated_data):
        validated_data['submitter'] = self.context['request'].user
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)

    def update(self, instance, validated_data):
        if instance.status not in ('pending', 'rejected'):
            raise serializers.ValidationError('只有待审批或已驳回状态的活动可以修改')
        validated_data['updated_by'] = self.context['request'].user
        return super().update(instance, validated_data)


class PriceApprovalToActivitySerializer(serializers.Serializer):
    activity_type = serializers.ChoiceField(choices=ActivitySubmission.ACTIVITY_TYPE_CHOICES)
    activity_name = serializers.CharField(max_length=128)
    activity_period_from = serializers.DateField()
    activity_period_to = serializers.DateField()
    target_sales_quantity = serializers.DecimalField(
        max_digits=12, decimal_places=2, required=False, default=0,
    )
    budget = serializers.DecimalField(
        max_digits=12, decimal_places=2, required=False, default=0,
    )
    description = serializers.CharField(required=False, allow_blank=True, default='')

    def validate(self, attrs):
        if attrs['activity_period_to'] < attrs['activity_period_from']:
            raise serializers.ValidationError('活动结束日不能早于开始日')
        return attrs

    def create(self, validated_data):
        price_approval = self.context['price_approval']
        user = self.context['request'].user
        if price_approval.status != 'approved':
            raise serializers.ValidationError('只有已通过的价格审批可以生成活动提报')
        if hasattr(price_approval, 'activity') and price_approval.activity:
            raise serializers.ValidationError('该价格审批已关联活动提报')
        activity = ActivitySubmission.objects.create(
            price_approval=price_approval,
            code=f'AS-{price_approval.code}',
            activity_type=validated_data['activity_type'],
            activity_name=validated_data['activity_name'],
            activity_period_from=validated_data['activity_period_from'],
            activity_period_to=validated_data['activity_period_to'],
            target_sales_quantity=validated_data.get('target_sales_quantity', 0),
            budget=validated_data.get('budget', 0),
            description=validated_data.get('description', ''),
            submitter=user,
            created_by=user,
            updated_by=user,
        )
        return activity


class OrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_sku = serializers.CharField(source='product.sku', read_only=True)
    batch_no = serializers.CharField(source='batch.batch_no', read_only=True, default=None)

    class Meta:
        model = OrderItem
        fields = '__all__'
        read_only_fields = ('created_at', 'created_by', 'updated_at', 'updated_by')


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, required=False)
    store_name = serializers.CharField(source='store.name', read_only=True)
    store_region = serializers.CharField(source='store.region', read_only=True)
    activity_name = serializers.CharField(source='activity.activity_name', read_only=True, default=None)
    activity_code = serializers.CharField(source='activity.code', read_only=True, default=None)
    activity_status = serializers.CharField(source='activity.status', read_only=True, default=None)
    activity_type = serializers.CharField(source='activity.activity_type', read_only=True, default=None)
    price_approval_code = serializers.CharField(
        source='activity.price_approval.code', read_only=True, default=None,
    )
    price_approval_product = serializers.CharField(
        source='activity.price_approval.product.name', read_only=True, default=None,
    )
    price_approval_unit_price = serializers.DecimalField(
        source='activity.price_approval.proposed_unit_price',
        max_digits=10, decimal_places=2, read_only=True, default=None,
    )
    price_approval_store = serializers.CharField(
        source='activity.price_approval.store.name', read_only=True, default=None,
    )
    price_approval_effective_from = serializers.DateField(
        source='activity.price_approval.effective_from', read_only=True, default=None,
    )
    price_approval_effective_to = serializers.DateField(
        source='activity.price_approval.effective_to', read_only=True, default=None,
    )
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    submitter_name = serializers.CharField(source='submitter.username', read_only=True, default=None)

    class Meta:
        model = Order
        fields = '__all__'
        read_only_fields = ('created_at', 'created_by', 'updated_at', 'updated_by', 'confirmed_at', 'cancelled_at')

    def _get_activity_price_approval(self, activity):
        if not activity:
            return None
        try:
            return activity.price_approval
        except PriceApproval.DoesNotExist:
            return None

    def validate(self, attrs):
        if attrs.get('status') == 'confirmed' and not attrs.get('items'):
            raise serializers.ValidationError('确认订货单时必须包含物料明细')
        new_activity = attrs.get('activity')
        existing_activity = self.instance.activity if self.instance else None
        activity = new_activity if new_activity is not None else existing_activity
        new_store = attrs.get('store')
        existing_store = self.instance.store if self.instance else None
        order_store = new_store if new_store is not None else existing_store
        if activity is not None:
            if activity.status != 'approved':
                raise serializers.ValidationError(
                    f'只能关联已通过的活动提报，当前活动状态为 {activity.get_status_display()}'
                )
            price_approval = self._get_activity_price_approval(activity)
            if price_approval and price_approval.status != 'approved':
                raise serializers.ValidationError(
                    f'关联活动的价格审批状态为 {price_approval.get_status_display()}，不可用于订货'
                )
            if price_approval and price_approval.store and order_store:
                if price_approval.store_id != order_store.id:
                    raise serializers.ValidationError(
                        f'该活动仅适用于门店 {price_approval.store.name}，'
                        f'与订货门店 {order_store.name} 不一致，请先解除活动关联再改门店'
                    )
        return attrs

    def _validate_and_prepare_items(self, items_data, activity):
        price_approval = self._get_activity_price_approval(activity) if activity else None
        prepared_items = []
        for item_data in items_data:
            product = item_data.get('product')
            unit_price = item_data.get('unit_price')
            if price_approval:
                if product and price_approval.product_id != product.id:
                    raise serializers.ValidationError(
                        f'活动仅适用于商品 {price_approval.product.name}，不可订购 {product.name}'
                    )
                if unit_price and abs(float(unit_price) - float(price_approval.proposed_unit_price)) > 0.001:
                    raise serializers.ValidationError(
                        f'商品单价必须与价格审批一致 ({price_approval.proposed_unit_price})，'
                        f'不可提交 {unit_price}'
                    )
                item_data['product'] = price_approval.product
                item_data['unit_price'] = price_approval.proposed_unit_price
                item_data['activity_price_applied'] = True
            else:
                item_data['activity_price_applied'] = False
            if item_data.get('quantity', 0) <= 0:
                raise serializers.ValidationError('订货数量必须大于 0')
            prepared_items.append(item_data)
        return prepared_items

    def _validate_existing_items_against_activity(self, order, activity):
        if not activity:
            return
        price_approval = self._get_activity_price_approval(activity)
        if not price_approval:
            return
        errors = []
        for i, item in enumerate(order.items.all()):
            if price_approval.product_id != item.product_id:
                errors.append(
                    f'第 {i+1} 条明细：商品 {item.product.name} 与活动指定商品 '
                    f'{price_approval.product.name} 不一致，请重传 items 修正'
                )
            if abs(float(item.unit_price) - float(price_approval.proposed_unit_price)) > 0.001:
                errors.append(
                    f'第 {i+1} 条明细：单价 {item.unit_price} 与活动审批价 '
                    f'{price_approval.proposed_unit_price} 不一致，请重传 items 修正'
                )
        if errors:
            raise serializers.ValidationError({'items': errors})

    @transaction.atomic
    def create(self, validated_data):
        items_data = validated_data.pop('items', [])
        validated_data['submitter'] = self.context['request'].user
        validated_data['created_by'] = self.context['request'].user
        activity = validated_data.get('activity')
        prepared_items = self._validate_and_prepare_items(items_data, activity)
        order = super().create(validated_data)
        for item_data in prepared_items:
            OrderItem.objects.create(
                order=order,
                created_by=self.context['request'].user,
                **item_data,
            )
        order.total_amount = sum(
            item.quantity * item.unit_price for item in order.items.all()
        )
        order.save(update_fields=['total_amount', 'updated_at'])
        return order

    @transaction.atomic
    def update(self, instance, validated_data):
        items_data = validated_data.pop('items', None)
        validated_data['updated_by'] = self.context['request'].user
        new_activity = validated_data.get('activity', instance.activity)
        old_activity = instance.activity
        activity_changed = (
            (new_activity is None and old_activity is not None)
            or (new_activity is not None and old_activity is None)
            or (new_activity is not None and old_activity is not None and new_activity.id != old_activity.id)
        )
        if activity_changed and items_data is None:
            self._validate_existing_items_against_activity(instance, new_activity)
        order = super().update(instance, validated_data)
        if items_data is not None:
            order.items.all().delete()
            prepared_items = self._validate_and_prepare_items(items_data, new_activity)
            for item_data in prepared_items:
                OrderItem.objects.create(
                    order=order,
                    created_by=self.context['request'].user,
                    **item_data,
                )
            order.total_amount = sum(
                item.quantity * item.unit_price for item in order.items.all()
            )
            order.save(update_fields=['total_amount', 'updated_at'])
        elif activity_changed and new_activity is not None:
            price_approval = self._get_activity_price_approval(new_activity)
            if price_approval:
                for item in order.items.all():
                    item.product = price_approval.product
                    item.unit_price = price_approval.proposed_unit_price
                    item.activity_price_applied = True
                    item.save()
                order.total_amount = sum(
                    item.quantity * item.unit_price for item in order.items.all()
                )
                order.save(update_fields=['total_amount', 'updated_at'])
        return order


class OrderListSerializer(serializers.ModelSerializer):
    store_name = serializers.CharField(source='store.name', read_only=True)
    activity_name = serializers.CharField(source='activity.activity_name', read_only=True, default=None)
    activity_code = serializers.CharField(source='activity.code', read_only=True, default=None)
    activity_status = serializers.CharField(source='activity.status', read_only=True, default=None)
    price_approval_code = serializers.CharField(
        source='activity.price_approval.code', read_only=True, default=None,
    )
    price_approval_product = serializers.CharField(
        source='activity.price_approval.product.name', read_only=True, default=None,
    )
    price_approval_unit_price = serializers.DecimalField(
        source='activity.price_approval.proposed_unit_price',
        max_digits=10, decimal_places=2, read_only=True, default=None,
    )
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    submitter_name = serializers.CharField(source='submitter.username', read_only=True, default=None)

    class Meta:
        model = Order
        fields = (
            'id', 'code', 'store', 'store_name', 'activity', 'activity_code',
            'activity_name', 'activity_status', 'price_approval_code',
            'price_approval_product', 'price_approval_unit_price',
            'status', 'status_display', 'total_amount', 'submitter',
            'submitter_name', 'note', 'confirmed_at', 'created_at',
        )
        read_only_fields = ('created_at',)


class ShipmentItemSerializer(serializers.ModelSerializer):
    batch_no = serializers.CharField(source='batch.batch_no', read_only=True)
    product_name = serializers.CharField(source='order_item.product.name', read_only=True)

    class Meta:
        model = ShipmentItem
        fields = '__all__'
        read_only_fields = ('created_at', 'created_by', 'updated_at', 'updated_by')


class ShipmentSerializer(serializers.ModelSerializer):
    items = ShipmentItemSerializer(many=True, required=False)
    order_code = serializers.CharField(source='order.code', read_only=True)
    store_name = serializers.CharField(source='order.store.name', read_only=True)
    warehouse_name = serializers.CharField(source='from_warehouse.name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = Shipment
        fields = '__all__'
        read_only_fields = ('created_at', 'created_by', 'updated_at', 'updated_by', 'shipped_at', 'received_at')

    @transaction.atomic
    def create(self, validated_data):
        items_data = validated_data.pop('items', [])
        validated_data['created_by'] = self.context['request'].user
        shipment = super().create(validated_data)
        for item_data in items_data:
            ShipmentItem.objects.create(
                shipment=shipment,
                created_by=self.context['request'].user,
                **item_data,
            )
        return shipment

    @transaction.atomic
    def update(self, instance, validated_data):
        items_data = validated_data.pop('items', None)
        validated_data['updated_by'] = self.context['request'].user
        shipment = super().update(instance, validated_data)
        if items_data is not None:
            shipment.items.all().delete()
            for item_data in items_data:
                ShipmentItem.objects.create(
                    shipment=shipment,
                    created_by=self.context['request'].user,
                    **item_data,
                )
        return shipment


class ShipmentListSerializer(serializers.ModelSerializer):
    order_code = serializers.CharField(source='order.code', read_only=True)
    store_name = serializers.CharField(source='order.store.name', read_only=True)
    warehouse_name = serializers.CharField(source='from_warehouse.name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = Shipment
        fields = (
            'id', 'code', 'order', 'order_code', 'store_name',
            'from_warehouse', 'warehouse_name', 'tracking_no',
            'status', 'status_display', 'shipped_at', 'received_at',
            'note', 'created_at',
        )
        read_only_fields = ('created_at',)


class TrialFollowUpSerializer(serializers.ModelSerializer):
    result_display = serializers.CharField(source='get_result_display', read_only=True)
    activity_name = serializers.CharField(source='activity.activity_name', read_only=True)
    store_name = serializers.CharField(source='store.name', read_only=True)

    class Meta:
        model = TrialFollowUp
        fields = '__all__'
        read_only_fields = ('created_at', 'created_by', 'updated_at', 'updated_by')


class AuditLogSerializer(serializers.ModelSerializer):
    action_display = serializers.CharField(source='get_action_display', read_only=True)
    operator_name = serializers.CharField(source='operator.username', read_only=True, default=None)

    class Meta:
        model = AuditLog
        fields = '__all__'
        read_only_fields = (
            'model_name', 'record_id', 'record_code', 'action', 'field_name',
            'old_value', 'new_value', 'operator', 'ip_address', 'created_at',
        )
