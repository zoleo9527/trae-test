from django.core.exceptions import ValidationError
from django.db import models
from django.db.models import Sum, F
from django.utils import timezone

from apps.tea.managers import PendingQuerySet, ReviewNeededQuerySet


class TimestampModel(models.Model):
    created_at = models.DateTimeField('创建时间', auto_now_add=True)
    created_by = models.ForeignKey(
        'auth.User', verbose_name='创建人',
        on_delete=models.SET_NULL, null=True,
        related_name='%(class)s_created',
    )
    updated_at = models.DateTimeField('更新时间', auto_now=True)
    updated_by = models.ForeignKey(
        'auth.User', verbose_name='更新人',
        on_delete=models.SET_NULL, null=True,
        related_name='%(class)s_updated',
    )

    class Meta:
        abstract = True


class Product(TimestampModel):
    CATEGORY_CHOICES = [
        ('green', '绿茶'),
        ('black', '红茶'),
        ('oolong', '乌龙茶'),
        ('white', '白茶'),
        ('dark', '黑茶'),
        ('other', '其他'),
    ]
    STATUS_CHOICES = [
        ('active', '在售'),
        ('inactive', '停售'),
    ]

    sku = models.CharField('SKU编码', max_length=32, unique=True)
    name = models.CharField('品名', max_length=128)
    category = models.CharField('品类', max_length=16, choices=CATEGORY_CHOICES)
    base_unit_price = models.DecimalField('基础单价', max_digits=10, decimal_places=2)
    unit = models.CharField('计量单位', max_length=16, default='斤')
    spec = models.CharField('规格说明', max_length=128, blank=True, default='')
    status = models.CharField('状态', max_length=16, choices=STATUS_CHOICES, default='active')

    class Meta:
        verbose_name = '产品'
        verbose_name_plural = '产品'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.sku} {self.name}'


class Warehouse(TimestampModel):
    REGION_CHOICES = [
        ('north', '华北'),
        ('east', '华东'),
        ('south', '华南'),
        ('west', '华西'),
    ]

    code = models.CharField('仓库编码', max_length=16, unique=True)
    name = models.CharField('仓库名称', max_length=64)
    region = models.CharField('区域', max_length=16, choices=REGION_CHOICES)
    address = models.TextField('地址', blank=True, default='')
    phone = models.CharField('联系电话', max_length=32, blank=True, default='')
    manager = models.ForeignKey(
        'auth.User', verbose_name='仓库主管',
        on_delete=models.SET_NULL, null=True, related_name='managed_warehouses',
    )
    is_active = models.BooleanField('启用', default=True)

    class Meta:
        verbose_name = '仓库'
        verbose_name_plural = '仓库'
        ordering = ['code']

    def __str__(self):
        return f'{self.code} {self.name}'


class Store(TimestampModel):
    code = models.CharField('门店编码', max_length=16, unique=True)
    name = models.CharField('门店名称', max_length=64)
    region = models.CharField('区域', max_length=16, choices=Warehouse.REGION_CHOICES)
    phone = models.CharField('联系电话', max_length=32, blank=True, default='')
    address = models.TextField('地址', blank=True, default='')
    responsible_warehouse = models.ForeignKey(
        Warehouse, verbose_name='负责仓库',
        on_delete=models.SET_NULL, null=True, related_name='stores',
    )
    is_active = models.BooleanField('启用', default=True)

    class Meta:
        verbose_name = '门店'
        verbose_name_plural = '门店'
        ordering = ['code']

    def __str__(self):
        return f'{self.code} {self.name}'


class Batch(TimestampModel):
    STATUS_CHOICES = [
        ('in_stock', '在库'),
        ('partial', '部分出库'),
        ('depleted', '已出清'),
    ]

    batch_no = models.CharField('批次号', max_length=32, unique=True)
    product = models.ForeignKey(
        Product, verbose_name='产品',
        on_delete=models.CASCADE, related_name='batches',
    )
    warehouse = models.ForeignKey(
        Warehouse, verbose_name='仓库',
        on_delete=models.CASCADE, related_name='batches',
    )
    production_date = models.DateField('生产日期')
    initial_quantity = models.DecimalField('初始数量', max_digits=12, decimal_places=2)
    unit_cost = models.DecimalField('单位成本', max_digits=10, decimal_places=2)
    status = models.CharField('状态', max_length=16, choices=STATUS_CHOICES, default='in_stock')

    class Meta:
        verbose_name = '批次'
        verbose_name_plural = '批次'
        ordering = ['-production_date']

    def __str__(self):
        return f'{self.batch_no} ({self.product.name})'

    @property
    def current_quantity(self):
        changes = self.inventory_records.aggregate(
            total=Sum(F('change_quantity') * F('direction'))
        )
        return self.initial_quantity + (changes['total'] or 0)

    def clean(self):
        if self.initial_quantity <= 0:
            raise ValidationError('初始数量必须大于 0')


class InventoryRecord(TimestampModel):
    CHANGE_TYPE_CHOICES = [
        ('inbound', '入库'),
        ('outbound', '出库'),
        ('adjust', '盘点调整'),
        ('loss', '损耗'),
        ('return', '退货入库'),
    ]
    DIRECTION_CHOICES = [
        (1, '增加'),
        (-1, '减少'),
    ]
    REF_TYPE_CHOICES = [
        ('shipment', '发货单'),
        ('order', '订货单'),
        ('inventory_check', '盘点单'),
        ('manual', '手工录入'),
    ]

    batch = models.ForeignKey(
        Batch, verbose_name='批次',
        on_delete=models.CASCADE, related_name='inventory_records',
    )
    change_type = models.CharField('变动类型', max_length=16, choices=CHANGE_TYPE_CHOICES)
    direction = models.SmallIntegerField('方向', choices=DIRECTION_CHOICES)
    change_quantity = models.DecimalField('变动数量', max_digits=12, decimal_places=2)
    balance_after = models.DecimalField('变动后结存', max_digits=12, decimal_places=2)
    reference_type = models.CharField('来源类型', max_length=16, choices=REF_TYPE_CHOICES, default='manual')
    reference_id = models.CharField('来源单号', max_length=64, blank=True, default='')
    note = models.TextField('备注', blank=True, default='')

    class Meta:
        verbose_name = '库存变动记录'
        verbose_name_plural = '库存变动记录'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.batch.batch_no} {self.get_change_type_display()} {self.change_quantity}'


class PriceApproval(TimestampModel):
    STATUS_CHOICES = [
        ('pending', '待审批'),
        ('approved', '已通过'),
        ('rejected', '已驳回'),
    ]

    code = models.CharField('审批单号', max_length=32, unique=True)
    product = models.ForeignKey(
        Product, verbose_name='产品',
        on_delete=models.CASCADE, related_name='price_approvals',
    )
    store = models.ForeignKey(
        Store, verbose_name='指定门店',
        on_delete=models.SET_NULL, null=True, blank=True,
        help_text='为空表示全部门店通用',
    )
    proposed_unit_price = models.DecimalField('申报单价', max_digits=10, decimal_places=2)
    effective_from = models.DateField('生效起始日')
    effective_to = models.DateField('生效截止日', null=True, blank=True)
    reason = models.TextField('调价原因')
    status = models.CharField('状态', max_length=16, choices=STATUS_CHOICES, default='pending')
    submitter = models.ForeignKey(
        'auth.User', verbose_name='提交人',
        on_delete=models.SET_NULL, null=True, related_name='submitted_price_approvals',
    )
    approver = models.ForeignKey(
        'auth.User', verbose_name='审批人',
        on_delete=models.SET_NULL, null=True, related_name='approved_price_approvals',
    )
    approved_at = models.DateTimeField('审批时间', null=True, blank=True)
    rejection_reason = models.TextField('驳回原因', blank=True, default='')

    objects = models.Manager()
    pending = PendingQuerySet.as_manager()

    class Meta:
        verbose_name = '价格审批'
        verbose_name_plural = '价格审批'
        ordering = ['-created_at']
        permissions = [
            ('can_approve_price', '可以审批价格'),
            ('can_submit_price', '可以提交价格审批'),
        ]

    def __str__(self):
        return f'{self.code} {self.product.name} {self.proposed_unit_price}'

    def clean(self):
        if self.effective_to and self.effective_to < self.effective_from:
            raise ValidationError('截止日期不能早于起始日期')
        if self.proposed_unit_price <= 0:
            raise ValidationError('申报单价必须大于 0')


class ActivitySubmission(TimestampModel):
    ACTIVITY_TYPE_CHOICES = [
        ('new_product', '新品推广'),
        ('festival', '节日促销'),
        ('trial', '试饮活动'),
        ('discount', '满减折扣'),
        ('bundle', '捆绑销售'),
        ('other', '其他'),
    ]
    STATUS_CHOICES = [
        ('pending', '待审批'),
        ('approved', '已通过'),
        ('rejected', '已驳回'),
        ('completed', '已完成'),
        ('cancelled', '已取消'),
    ]

    code = models.CharField('活动单号', max_length=32, unique=True)
    price_approval = models.OneToOneField(
        PriceApproval, verbose_name='关联价格审批',
        on_delete=models.CASCADE, related_name='activity',
    )
    activity_type = models.CharField('活动类型', max_length=16, choices=ACTIVITY_TYPE_CHOICES)
    activity_name = models.CharField('活动名称', max_length=128)
    activity_period_from = models.DateField('活动开始日')
    activity_period_to = models.DateField('活动结束日')
    target_sales_quantity = models.DecimalField('目标销量', max_digits=12, decimal_places=2, default=0)
    budget = models.DecimalField('活动预算', max_digits=12, decimal_places=2, default=0)
    description = models.TextField('活动说明', blank=True, default='')
    status = models.CharField('状态', max_length=16, choices=STATUS_CHOICES, default='pending')
    submitter = models.ForeignKey(
        'auth.User', verbose_name='提交人',
        on_delete=models.SET_NULL, null=True, related_name='submitted_activities',
    )
    approver = models.ForeignKey(
        'auth.User', verbose_name='审批人',
        on_delete=models.SET_NULL, null=True, related_name='approved_activities',
    )
    approved_at = models.DateTimeField('审批时间', null=True, blank=True)
    rejection_reason = models.TextField('驳回原因', blank=True, default='')
    review_note = models.TextField('回查备注', blank=True, default='')

    review_needed = ReviewNeededQuerySet.as_manager()
    objects = models.Manager()

    class Meta:
        verbose_name = '活动提报'
        verbose_name_plural = '活动提报'
        ordering = ['-created_at']
        permissions = [
            ('can_approve_activity', '可以审批活动'),
            ('can_submit_activity', '可以提交活动'),
        ]

    def __str__(self):
        return f'{self.code} {self.activity_name}'

    @property
    def effective_unit_price(self):
        return self.price_approval.proposed_unit_price

    def clean(self):
        if self.activity_period_to < self.activity_period_from:
            raise ValidationError('活动结束日不能早于开始日')


class Order(TimestampModel):
    STATUS_CHOICES = [
        ('draft', '草稿'),
        ('confirmed', '已确认'),
        ('shipped', '已发货'),
        ('received', '已签收'),
        ('cancelled', '已取消'),
    ]

    code = models.CharField('订货单号', max_length=32, unique=True)
    store = models.ForeignKey(
        Store, verbose_name='门店',
        on_delete=models.CASCADE, related_name='orders',
    )
    activity = models.ForeignKey(
        ActivitySubmission, verbose_name='关联活动',
        on_delete=models.SET_NULL, null=True, blank=True,
        help_text='关联活动后将自动使用活动价',
    )
    status = models.CharField('状态', max_length=16, choices=STATUS_CHOICES, default='draft')
    total_amount = models.DecimalField('总金额', max_digits=12, decimal_places=2, default=0)
    note = models.TextField('备注', blank=True, default='')
    submitter = models.ForeignKey(
        'auth.User', verbose_name='提交人',
        on_delete=models.SET_NULL, null=True, related_name='submitted_orders',
    )
    confirmed_at = models.DateTimeField('确认时间', null=True, blank=True)
    cancelled_at = models.DateTimeField('取消时间', null=True, blank=True)

    class Meta:
        verbose_name = '订货单'
        verbose_name_plural = '订货单'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.code} {self.store.name}'


class OrderItem(TimestampModel):
    order = models.ForeignKey(
        Order, verbose_name='订货单',
        on_delete=models.CASCADE, related_name='items',
    )
    product = models.ForeignKey(
        Product, verbose_name='产品',
        on_delete=models.CASCADE, related_name='order_items',
    )
    quantity = models.DecimalField('数量', max_digits=12, decimal_places=2)
    unit_price = models.DecimalField('单价', max_digits=10, decimal_places=2)
    batch = models.ForeignKey(
        Batch, verbose_name='指定批次',
        on_delete=models.SET_NULL, null=True, blank=True,
    )
    activity_price_applied = models.BooleanField('使用活动价', default=False)
    note = models.CharField('备注', max_length=256, blank=True, default='')

    class Meta:
        verbose_name = '订货物料'
        verbose_name_plural = '订货物料'
        ordering = ['order', 'product']

    def __str__(self):
        return f'{self.order.code} {self.product.name} x{self.quantity}'


class Shipment(TimestampModel):
    STATUS_CHOICES = [
        ('pending', '待发货'),
        ('shipped', '已发货'),
        ('received', '已签收'),
        ('cancelled', '已取消'),
    ]

    code = models.CharField('发货单号', max_length=32, unique=True)
    order = models.ForeignKey(
        Order, verbose_name='订货单',
        on_delete=models.CASCADE, related_name='shipments',
    )
    from_warehouse = models.ForeignKey(
        Warehouse, verbose_name='发货仓库',
        on_delete=models.CASCADE, related_name='outbound_shipments',
    )
    tracking_no = models.CharField('物流单号', max_length=64, blank=True, default='')
    shipped_at = models.DateTimeField('发货时间', null=True, blank=True)
    received_at = models.DateTimeField('签收时间', null=True, blank=True)
    status = models.CharField('状态', max_length=16, choices=STATUS_CHOICES, default='pending')
    note = models.TextField('备注', blank=True, default='')

    class Meta:
        verbose_name = '发货单'
        verbose_name_plural = '发货单'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.code} {self.order.store.name}'


class ShipmentItem(TimestampModel):
    shipment = models.ForeignKey(
        Shipment, verbose_name='发货单',
        on_delete=models.CASCADE, related_name='items',
    )
    order_item = models.ForeignKey(
        OrderItem, verbose_name='订货物料',
        on_delete=models.CASCADE, related_name='shipment_items',
    )
    batch = models.ForeignKey(
        Batch, verbose_name='实际批次',
        on_delete=models.CASCADE, related_name='shipment_items',
    )
    shipped_quantity = models.DecimalField('发货数量', max_digits=12, decimal_places=2)

    class Meta:
        verbose_name = '发货明细'
        verbose_name_plural = '发货明细'

    def __str__(self):
        return f'{self.shipment.code} {self.batch.batch_no} x{self.shipped_quantity}'


class TrialFollowUp(TimestampModel):
    RESULT_CHOICES = [
        ('excellent', '满意'),
        ('normal', '一般'),
        ('poor', '不满意'),
    ]

    code = models.CharField('回访单号', max_length=32, unique=True)
    activity = models.ForeignKey(
        ActivitySubmission, verbose_name='关联活动',
        on_delete=models.CASCADE, related_name='trial_followups',
    )
    store = models.ForeignKey(
        Store, verbose_name='门店',
        on_delete=models.CASCADE, related_name='trial_followups',
    )
    visit_date = models.DateField('回访日期')
    feedback = models.TextField('反馈内容', blank=True, default='')
    sample_quantity = models.DecimalField('试饮数量', max_digits=10, decimal_places=2, default=0)
    next_visit_date = models.DateField('下次回访日', null=True, blank=True)
    result = models.CharField('回访结果', max_length=16, choices=RESULT_CHOICES)

    class Meta:
        verbose_name = '试饮回访'
        verbose_name_plural = '试饮回访'
        ordering = ['-visit_date']

    def __str__(self):
        return f'{self.code} {self.store.name} {self.visit_date}'


class AuditLog(TimestampModel):
    ACTION_CHOICES = [
        ('CREATE', '创建'),
        ('UPDATE', '更新'),
        ('DELETE', '删除'),
        ('APPROVE', '审批通过'),
        ('REJECT', '驳回'),
        ('SUBMIT', '提交'),
        ('CANCEL', '取消'),
        ('SHIP', '发货'),
        ('RECEIVE', '签收'),
        ('CONFIRM', '确认'),
    ]

    model_name = models.CharField('模型名称', max_length=64)
    record_id = models.CharField('记录ID', max_length=32)
    record_code = models.CharField('记录单号', max_length=64, blank=True, default='')
    action = models.CharField('操作', max_length=16, choices=ACTION_CHOICES)
    field_name = models.CharField('字段名', max_length=64, blank=True, default='')
    old_value = models.TextField('旧值', blank=True, default='')
    new_value = models.TextField('新值', blank=True, default='')
    operator = models.ForeignKey(
        'auth.User', verbose_name='操作人',
        on_delete=models.SET_NULL, null=True,
    )
    ip_address = models.GenericIPAddressField('IP地址', null=True, blank=True)

    class Meta:
        verbose_name = '审计日志'
        verbose_name_plural = '审计日志'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['model_name', 'record_id']),
            models.Index(fields=['action']),
            models.Index(fields=['-created_at']),
        ]

    def __str__(self):
        return f'{self.model_name} {self.record_id} {self.action}'
