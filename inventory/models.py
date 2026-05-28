from django.db import models
from django.contrib.auth.models import User, Group
from django.core.validators import MinValueValidator
from django.utils import timezone


class Role(models.TextChoices):
    STORE_MANAGER = 'store_manager', '店长'
    PLANNER = 'planner', '企划专员'
    WAREHOUSE = 'warehouse', '仓管'


class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    role = models.CharField(max_length=32, choices=Role.choices, verbose_name='角色')
    store = models.ForeignKey('Store', on_delete=models.SET_NULL, null=True, blank=True,
                              related_name='staff', verbose_name='所属门店')
    phone = models.CharField(max_length=32, blank=True, verbose_name='联系电话')

    class Meta:
        verbose_name = '用户档案'
        verbose_name_plural = verbose_name

    def __str__(self):
        return f'{self.user.get_full_name() or self.user.username} - {self.get_role_display()}'


class StoreGroup(models.Model):
    name = models.CharField(max_length=64, unique=True, verbose_name='门店群名称')
    description = models.TextField(blank=True, verbose_name='说明')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')
    manager = models.ForeignKey(User, on_delete=models.SET_NULL, null=True,
                                related_name='managed_groups', verbose_name='群负责人')

    class Meta:
        verbose_name = '门店群'
        verbose_name_plural = verbose_name

    def __str__(self):
        return self.name


class Store(models.Model):
    code = models.CharField(max_length=32, unique=True, verbose_name='门店编码')
    name = models.CharField(max_length=64, verbose_name='门店名称')
    address = models.CharField(max_length=255, blank=True, verbose_name='地址')
    group = models.ForeignKey(StoreGroup, on_delete=models.SET_NULL, null=True, blank=True,
                              related_name='stores', verbose_name='所属门店群')
    manager = models.OneToOneField(User, on_delete=models.SET_NULL, null=True, blank=True,
                                   related_name='managed_store', verbose_name='店长')
    is_active = models.BooleanField(default=True, verbose_name='是否启用')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')

    class Meta:
        verbose_name = '门店'
        verbose_name_plural = verbose_name
        ordering = ['code']

    def __str__(self):
        return f'{self.code} - {self.name}'


class ProductStatus(models.TextChoices):
    DRAFT = 'draft', '草稿'
    LISTED = 'listed', '已上架'
    DELISTED = 'delisted', '已下架'


class Product(models.Model):
    sku = models.CharField(max_length=64, unique=True, verbose_name='SKU编码')
    name = models.CharField(max_length=128, verbose_name='商品名称')
    category = models.CharField(max_length=64, blank=True, verbose_name='品类')
    is_collaboration = models.BooleanField(default=False, verbose_name='是否联名款')
    collaboration_brand = models.CharField(max_length=64, blank=True, verbose_name='联名品牌')
    status = models.CharField(max_length=32, choices=ProductStatus.choices,
                              default=ProductStatus.DRAFT, verbose_name='上下架状态')
    cost_price = models.DecimalField(max_digits=10, decimal_places=2, default=0, verbose_name='成本价')
    retail_price = models.DecimalField(max_digits=10, decimal_places=2, default=0, verbose_name='零售价')
    points_required = models.IntegerField(default=0, verbose_name='兑换所需积分')
    safe_stock = models.IntegerField(default=10, validators=[MinValueValidator(0)], verbose_name='安全库存')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新时间')

    class Meta:
        verbose_name = '商品'
        verbose_name_plural = verbose_name
        ordering = ['sku']

    def __str__(self):
        collab_tag = ' [联名]' if self.is_collaboration else ''
        return f'{self.sku} - {self.name}{collab_tag}'


class Inventory(models.Model):
    store = models.ForeignKey(Store, on_delete=models.CASCADE, related_name='inventories', verbose_name='门店')
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='inventories', verbose_name='商品')
    quantity = models.IntegerField(default=0, validators=[MinValueValidator(0)], verbose_name='可用库存')
    reserved_quantity = models.IntegerField(default=0, validators=[MinValueValidator(0)], verbose_name='预留库存')
    last_counted_at = models.DateTimeField(null=True, blank=True, verbose_name='最近盘点时间')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新时间')

    class Meta:
        verbose_name = '库存'
        verbose_name_plural = verbose_name
        unique_together = ['store', 'product']
        ordering = ['store__code', 'product__sku']

    def __str__(self):
        return f'{self.store.code} - {self.product.sku}: {self.quantity}'

    @property
    def available_quantity(self):
        return self.quantity - self.reserved_quantity


class ReplenishmentStatus(models.TextChoices):
    DRAFT = 'draft', '草稿'
    SUBMITTED = 'submitted', '已提交'
    REVIEWING = 'reviewing', '仓管审核中'
    REJECTED = 'rejected', '已驳回'
    PROCESSING = 'processing', '出库中'
    SHIPPED = 'shipped', '已发货'
    RECEIVED = 'received', '已收货'
    COMPLETED = 'completed', '已完成'
    CANCELLED = 'cancelled', '已取消'


class ReplenishmentPlan(models.Model):
    code = models.CharField(max_length=32, unique=True, verbose_name='计划编号')
    name = models.CharField(max_length=128, verbose_name='计划名称')
    description = models.TextField(blank=True, verbose_name='说明')
    store_group = models.ForeignKey(StoreGroup, on_delete=models.SET_NULL, null=True, blank=True,
                                    related_name='plans', verbose_name='适用门店群')
    stores = models.ManyToManyField(Store, related_name='plans', blank=True, verbose_name='适用门店')
    plan_date = models.DateField(verbose_name='计划日期')
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True,
                                   related_name='created_plans', verbose_name='创建人')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')

    class Meta:
        verbose_name = '补货计划'
        verbose_name_plural = verbose_name
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.code} - {self.name}'


class ReplenishmentOrder(models.Model):
    code = models.CharField(max_length=32, unique=True, verbose_name='补货单号')
    plan = models.ForeignKey(ReplenishmentPlan, on_delete=models.SET_NULL, null=True, blank=True,
                             related_name='orders', verbose_name='关联补货计划')
    store = models.ForeignKey(Store, on_delete=models.CASCADE,
                              related_name='replenishment_orders', verbose_name='申请门店')
    status = models.CharField(max_length=32, choices=ReplenishmentStatus.choices,
                              default=ReplenishmentStatus.DRAFT, verbose_name='状态')
    priority = models.IntegerField(default=1, choices=[(1, '普通'), (2, '紧急'), (3, '特急')], verbose_name='优先级')
    remark = models.TextField(blank=True, verbose_name='申请备注')
    reject_reason = models.TextField(blank=True, verbose_name='驳回原因')
    tracking_no = models.CharField(max_length=64, blank=True, verbose_name='物流单号')

    submitted_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True,
                                     related_name='submitted_replenishments', verbose_name='提交人')
    submitted_at = models.DateTimeField(null=True, blank=True, verbose_name='提交时间')
    reviewed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True,
                                    related_name='reviewed_replenishments', verbose_name='审核人')
    reviewed_at = models.DateTimeField(null=True, blank=True, verbose_name='审核时间')
    shipped_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True,
                                   related_name='shipped_replenishments', verbose_name='发货人')
    shipped_at = models.DateTimeField(null=True, blank=True, verbose_name='发货时间')
    received_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True,
                                    related_name='received_replenishments', verbose_name='收货人')
    received_at = models.DateTimeField(null=True, blank=True, verbose_name='收货时间')
    completed_at = models.DateTimeField(null=True, blank=True, verbose_name='完成时间')
    cancelled_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True,
                                     related_name='cancelled_replenishments', verbose_name='取消人')
    cancelled_at = models.DateTimeField(null=True, blank=True, verbose_name='取消时间')

    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True,
                                   related_name='created_replenishments', verbose_name='创建人')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新时间')

    class Meta:
        verbose_name = '补货单'
        verbose_name_plural = verbose_name
        ordering = ['-created_at']

    def __str__(self):
        return self.code


class ReplenishmentItem(models.Model):
    order = models.ForeignKey(ReplenishmentOrder, on_delete=models.CASCADE,
                              related_name='items', verbose_name='补货单')
    product = models.ForeignKey(Product, on_delete=models.CASCADE, verbose_name='商品')
    requested_quantity = models.IntegerField(validators=[MinValueValidator(1)], verbose_name='申请数量')
    approved_quantity = models.IntegerField(null=True, blank=True, validators=[MinValueValidator(0)],
                                            verbose_name='批准数量')
    shipped_quantity = models.IntegerField(null=True, blank=True, validators=[MinValueValidator(0)],
                                           verbose_name='实发数量')
    received_quantity = models.IntegerField(null=True, blank=True, validators=[MinValueValidator(0)],
                                            verbose_name='实收数量')
    unit_price = models.DecimalField(max_digits=10, decimal_places=2, default=0, verbose_name='单价')
    remark = models.CharField(max_length=255, blank=True, verbose_name='备注')

    class Meta:
        verbose_name = '补货明细'
        verbose_name_plural = verbose_name
        unique_together = ['order', 'product']


class TransferStatus(models.TextChoices):
    DRAFT = 'draft', '草稿'
    SUBMITTED = 'submitted', '已提交'
    OUT_REVIEW = 'out_review', '待转出确认'
    OUT_REJECTED = 'out_rejected', '转出拒绝'
    OUT_CONFIRMED = 'out_confirmed', '转出已确认'
    IN_REVIEW = 'in_review', '待转入确认'
    IN_REJECTED = 'in_rejected', '转入拒绝'
    COMPLETED = 'completed', '已完成'
    CANCELLED = 'cancelled', '已取消'


class TransferOrder(models.Model):
    code = models.CharField(max_length=32, unique=True, verbose_name='调拨单号')
    reason = models.CharField(max_length=255, verbose_name='调拨原因')
    from_store = models.ForeignKey(Store, on_delete=models.CASCADE,
                                   related_name='outgoing_transfers', verbose_name='转出门店')
    to_store = models.ForeignKey(Store, on_delete=models.CASCADE,
                                 related_name='incoming_transfers', verbose_name='转入门店')
    status = models.CharField(max_length=32, choices=TransferStatus.choices,
                              default=TransferStatus.DRAFT, verbose_name='状态')
    reject_reason = models.TextField(blank=True, verbose_name='拒绝原因')

    submitted_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True,
                                     related_name='submitted_transfers', verbose_name='提交人')
    submitted_at = models.DateTimeField(null=True, blank=True, verbose_name='提交时间')
    out_confirmed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True,
                                         related_name='out_confirmed_transfers', verbose_name='转出确认人')
    out_confirmed_at = models.DateTimeField(null=True, blank=True, verbose_name='转出确认时间')
    in_confirmed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True,
                                        related_name='in_confirmed_transfers', verbose_name='转入确认人')
    in_confirmed_at = models.DateTimeField(null=True, blank=True, verbose_name='转入确认时间')
    completed_at = models.DateTimeField(null=True, blank=True, verbose_name='完成时间')
    cancelled_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True,
                                     related_name='cancelled_transfers', verbose_name='取消人')
    cancelled_at = models.DateTimeField(null=True, blank=True, verbose_name='取消时间')

    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True,
                                   related_name='created_transfers', verbose_name='创建人')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新时间')

    class Meta:
        verbose_name = '门店调拨单'
        verbose_name_plural = verbose_name
        ordering = ['-created_at']

    def __str__(self):
        return self.code


class TransferItem(models.Model):
    order = models.ForeignKey(TransferOrder, on_delete=models.CASCADE,
                              related_name='items', verbose_name='调拨单')
    product = models.ForeignKey(Product, on_delete=models.CASCADE, verbose_name='商品')
    transfer_quantity = models.IntegerField(validators=[MinValueValidator(1)], verbose_name='调拨数量')
    out_quantity = models.IntegerField(null=True, blank=True, validators=[MinValueValidator(0)],
                                       verbose_name='实际转出')
    in_quantity = models.IntegerField(null=True, blank=True, validators=[MinValueValidator(0)],
                                      verbose_name='实际转入')
    remark = models.CharField(max_length=255, blank=True, verbose_name='备注')

    class Meta:
        verbose_name = '调拨明细'
        verbose_name_plural = verbose_name
        unique_together = ['order', 'product']


class DisplayRecordStatus(models.TextChoices):
    PENDING = 'pending', '待整改'
    FIXED = 'fixed', '已整改'
    VERIFIED = 'verified', '已复核'


class DisplayRecord(models.Model):
    store = models.ForeignKey(Store, on_delete=models.CASCADE,
                              related_name='display_records', verbose_name='门店')
    product = models.ForeignKey(Product, on_delete=models.CASCADE, verbose_name='商品')
    check_date = models.DateField(default=timezone.localdate, verbose_name='检查日期')
    issue_type = models.CharField(max_length=64, verbose_name='问题类型')
    description = models.TextField(verbose_name='问题描述')
    photo_url = models.CharField(max_length=512, blank=True, verbose_name='照片链接')
    status = models.CharField(max_length=32, choices=DisplayRecordStatus.choices,
                              default=DisplayRecordStatus.PENDING, verbose_name='处理状态')
    fix_note = models.TextField(blank=True, verbose_name='整改说明')
    fix_photo_url = models.CharField(max_length=512, blank=True, verbose_name='整改后照片')

    checked_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True,
                                   related_name='checked_displays', verbose_name='检查人')
    fixed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True,
                                 related_name='fixed_displays', verbose_name='整改人')
    fixed_at = models.DateTimeField(null=True, blank=True, verbose_name='整改时间')
    verified_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True,
                                    related_name='verified_displays', verbose_name='复核人')
    verified_at = models.DateTimeField(null=True, blank=True, verbose_name='复核时间')

    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')

    class Meta:
        verbose_name = '陈列检查记录'
        verbose_name_plural = verbose_name
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.store.code} - {self.product.sku} - {self.get_status_display()}'


class RedemptionStatus(models.TextChoices):
    PENDING = 'pending', '待处理'
    PROCESSING = 'processing', '处理中'
    SHIPPED = 'shipped', '已发货'
    COMPLETED = 'completed', '已完成'
    REJECTED = 'rejected', '已拒绝'
    CANCELLED = 'cancelled', '已取消'


class MemberRedemption(models.Model):
    code = models.CharField(max_length=32, unique=True, verbose_name='兑换单号')
    member_name = models.CharField(max_length=64, verbose_name='会员姓名')
    member_phone = models.CharField(max_length=32, verbose_name='会员电话')
    member_points = models.IntegerField(validators=[MinValueValidator(0)], verbose_name='会员积分')
    product = models.ForeignKey(Product, on_delete=models.CASCADE, verbose_name='兑换商品')
    quantity = models.IntegerField(validators=[MinValueValidator(1)], verbose_name='兑换数量')
    points_used = models.IntegerField(validators=[MinValueValidator(0)], verbose_name='消耗积分')
    store = models.ForeignKey(Store, on_delete=models.CASCADE,
                              related_name='redemptions', verbose_name='兑换门店')
    status = models.CharField(max_length=32, choices=RedemptionStatus.choices,
                              default=RedemptionStatus.PENDING, verbose_name='状态')
    reject_reason = models.TextField(blank=True, verbose_name='拒绝原因')
    tracking_no = models.CharField(max_length=64, blank=True, verbose_name='物流单号')

    processed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True,
                                     related_name='processed_redemptions', verbose_name='处理人')
    processed_at = models.DateTimeField(null=True, blank=True, verbose_name='处理时间')
    completed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True,
                                     related_name='completed_redemptions', verbose_name='完成人')
    completed_at = models.DateTimeField(null=True, blank=True, verbose_name='完成时间')

    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新时间')

    class Meta:
        verbose_name = '会员兑换'
        verbose_name_plural = verbose_name
        ordering = ['-created_at']

    def __str__(self):
        return self.code


class AuditLog(models.Model):
    ACTION_CHOICES = [
        ('create', '创建'),
        ('update', '更新'),
        ('delete', '删除'),
        ('submit', '提交'),
        ('approve', '审核通过'),
        ('reject', '驳回'),
        ('ship', '发货'),
        ('receive', '收货'),
        ('confirm', '确认'),
        ('cancel', '取消'),
        ('export', '导出'),
        ('status_change', '状态变更'),
    ]

    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True,
                             related_name='audit_logs', verbose_name='操作人')
    action = models.CharField(max_length=32, choices=ACTION_CHOICES, verbose_name='操作类型')
    model_name = models.CharField(max_length=64, verbose_name='模型名称')
    object_id = models.CharField(max_length=64, verbose_name='对象ID')
    object_repr = models.CharField(max_length=255, verbose_name='对象表示')
    field_name = models.CharField(max_length=64, blank=True, verbose_name='字段名')
    old_value = models.TextField(blank=True, verbose_name='旧值')
    new_value = models.TextField(blank=True, verbose_name='新值')
    change_message = models.TextField(blank=True, verbose_name='变更说明')
    ip_address = models.GenericIPAddressField(null=True, blank=True, verbose_name='IP地址')
    user_agent = models.CharField(max_length=512, blank=True, verbose_name='User Agent')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='操作时间')

    class Meta:
        verbose_name = '审计日志'
        verbose_name_plural = verbose_name
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['model_name', 'object_id']),
            models.Index(fields=['created_at']),
        ]

    def __str__(self):
        return f'{self.created_at} - {self.user} - {self.get_action_display()} - {self.object_repr}'
