from django.db import models
from apps.base.models import BaseModel


class Customer(BaseModel):
    CUSTOMER_TYPE_CHOICES = [
        ('individual', '个人'),
        ('company', '企业'),
    ]

    CREDIT_LEVEL_CHOICES = [
        ('A', 'A级-优质'),
        ('B', 'B级-良好'),
        ('C', 'C级-一般'),
        ('D', 'D级-限制'),
    ]

    code = models.CharField(max_length=50, unique=True, verbose_name='客户编号')
    name = models.CharField(max_length=200, verbose_name='客户名称')
    type = models.CharField(max_length=20, choices=CUSTOMER_TYPE_CHOICES, default='individual', verbose_name='客户类型')
    id_card = models.CharField(max_length=50, blank=True, null=True, verbose_name='身份证号')
    company_name = models.CharField(max_length=200, blank=True, null=True, verbose_name='公司名称')
    contact = models.CharField(max_length=50, verbose_name='联系人')
    phone = models.CharField(max_length=20, verbose_name='联系电话')
    address = models.TextField(blank=True, null=True, verbose_name='地址')
    credit_limit = models.DecimalField(max_digits=12, decimal_places=2, default=0, verbose_name='赊账额度')
    credit_level = models.CharField(max_length=5, choices=CREDIT_LEVEL_CHOICES, default='C', verbose_name='信用等级')
    is_active = models.BooleanField(default=True, verbose_name='是否启用')
    remark = models.TextField(blank=True, null=True, verbose_name='备注')

    class Meta:
        db_table = 'customer'
        verbose_name = '客户'
        verbose_name_plural = verbose_name
        ordering = ['-created_at']

    def __str__(self):
        return self.name

    def get_used_credit(self):
        from apps.credit.models import CreditRecord, RepaymentRecord
        total_credit = CreditRecord.objects.filter(
            customer=self,
            status='approved'
        ).aggregate(total=models.Sum('amount'))['total'] or 0
        total_repaid = RepaymentRecord.objects.filter(
            customer=self,
            status='approved'
        ).aggregate(total=models.Sum('amount'))['total'] or 0
        return total_credit - total_repaid

    def get_remaining_credit(self):
        return self.credit_limit - self.get_used_credit()


class WasteType(BaseModel):
    code = models.CharField(max_length=50, unique=True, verbose_name='废品编码')
    name = models.CharField(max_length=100, verbose_name='废品名称')
    category = models.CharField(max_length=100, blank=True, null=True, verbose_name='分类')
    unit = models.CharField(max_length=20, default='kg', verbose_name='计量单位')
    default_price = models.DecimalField(max_digits=10, decimal_places=2, default=0, verbose_name='默认单价')
    is_active = models.BooleanField(default=True, verbose_name='是否启用')
    remark = models.TextField(blank=True, null=True, verbose_name='备注')

    class Meta:
        db_table = 'waste_type'
        verbose_name = '废品类型'
        verbose_name_plural = verbose_name
        ordering = ['code']

    def __str__(self):
        return self.name
