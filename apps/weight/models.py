from django.db import models
from apps.base.models import BaseModel
from apps.customer.models import Customer, WasteType


class WeightTicket(BaseModel):
    STATUS_CHOICES = [
        ('pending', '待审核'),
        ('approved', '已通过'),
        ('rejected', '已驳回'),
        ('review', '需回查'),
    ]

    PAYMENT_CHOICES = [
        ('cash', '现金'),
        ('credit', '赊账'),
        ('transfer', '转账'),
    ]

    ticket_no = models.CharField(max_length=50, unique=True, verbose_name='磅单编号')
    customer = models.ForeignKey(Customer, on_delete=models.PROTECT, verbose_name='客户')
    waste_type = models.ForeignKey(WasteType, on_delete=models.PROTECT, verbose_name='废品类型')
    gross_weight = models.DecimalField(max_digits=12, decimal_places=2, verbose_name='毛重(kg)')
    tare_weight = models.DecimalField(max_digits=12, decimal_places=2, verbose_name='皮重(kg)')
    net_weight = models.DecimalField(max_digits=12, decimal_places=2, verbose_name='净重(kg)')
    unit_price = models.DecimalField(max_digits=10, decimal_places=2, verbose_name='单价(元/kg)')
    total_amount = models.DecimalField(max_digits=14, decimal_places=2, verbose_name='总金额')
    payment_method = models.CharField(max_length=20, choices=PAYMENT_CHOICES, default='cash', verbose_name='付款方式')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending', verbose_name='状态')
    weigh_time = models.DateTimeField(verbose_name='过磅时间')
    vehicle_no = models.CharField(max_length=50, blank=True, null=True, verbose_name='车牌号')
    driver = models.CharField(max_length=50, blank=True, null=True, verbose_name='司机')
    site_photo = models.ImageField(upload_to='weight_tickets/', blank=True, null=True, verbose_name='现场照片')
    remark = models.TextField(blank=True, null=True, verbose_name='备注')
    reviewed_by = models.ForeignKey(
        'auth.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='reviewed_tickets',
        verbose_name='审核人'
    )
    reviewed_at = models.DateTimeField(null=True, blank=True, verbose_name='审核时间')
    reject_reason = models.TextField(blank=True, null=True, verbose_name='驳回原因')

    class Meta:
        db_table = 'weight_ticket'
        verbose_name = '磅单'
        verbose_name_plural = verbose_name
        ordering = ['-created_at']

    def __str__(self):
        return self.ticket_no

    def save(self, *args, **kwargs):
        if self.gross_weight and self.tare_weight:
            self.net_weight = self.gross_weight - self.tare_weight
        if self.net_weight and self.unit_price:
            self.total_amount = self.net_weight * self.unit_price
        super().save(*args, **kwargs)


class PriceAdjustment(BaseModel):
    waste_type = models.ForeignKey(WasteType, on_delete=models.PROTECT, verbose_name='废品类型')
    old_price = models.DecimalField(max_digits=10, decimal_places=2, verbose_name='原单价')
    new_price = models.DecimalField(max_digits=10, decimal_places=2, verbose_name='新单价')
    reason = models.TextField(verbose_name='调整原因')
    effective_date = models.DateField(verbose_name='生效日期')
    is_effective = models.BooleanField(default=True, verbose_name='是否生效')

    class Meta:
        db_table = 'price_adjustment'
        verbose_name = '价格调整记录'
        verbose_name_plural = verbose_name
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.waste_type.name} - {self.created_at.strftime("%Y-%m-%d")}'
