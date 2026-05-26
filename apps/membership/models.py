from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _
from apps.schedule.models import Student


class MembershipPlan(models.Model):
    class PlanType(models.TextChoices):
        PREPAID = 'prepaid', _('储值卡')
        TIMES = 'times', _('次卡')
        DURATION = 'duration', _('期卡')

    name = models.CharField(max_length=100, verbose_name='套餐名称')
    plan_type = models.CharField(max_length=20, choices=PlanType.choices, verbose_name='套餐类型')
    price = models.DecimalField(max_digits=10, decimal_places=2, verbose_name='售价')
    value = models.DecimalField(max_digits=10, decimal_places=2, verbose_name='卡内价值')
    times = models.IntegerField(null=True, blank=True, verbose_name='次数(次卡)')
    duration_days = models.IntegerField(null=True, blank=True, verbose_name='有效期天数(期卡)')
    description = models.TextField(blank=True, verbose_name='套餐说明')
    is_active = models.BooleanField(default=True, verbose_name='是否在售')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')

    class Meta:
        verbose_name = '储值套餐'
        verbose_name_plural = '储值套餐'
        ordering = ['price']

    def __str__(self):
        return f'{self.name} ({self.get_plan_type_display()})'


class MembershipCard(models.Model):
    class Status(models.TextChoices):
        ACTIVE = 'active', _('正常')
        FROZEN = 'frozen', _('已冻结')
        EXPIRED = 'expired', _('已过期')
        CANCELLED = 'cancelled', _('已注销')

    student = models.ForeignKey(Student, on_delete=models.PROTECT, related_name='memberships', verbose_name='学员')
    plan = models.ForeignKey(MembershipPlan, on_delete=models.PROTECT, related_name='cards', verbose_name='套餐')
    card_number = models.CharField(max_length=50, unique=True, verbose_name='卡号')
    balance = models.DecimalField(max_digits=10, decimal_places=2, default=0, verbose_name='余额')
    remaining_times = models.IntegerField(null=True, blank=True, verbose_name='剩余次数')
    start_date = models.DateField(verbose_name='生效日期')
    end_date = models.DateField(null=True, blank=True, verbose_name='到期日期')
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.ACTIVE, verbose_name='状态')
    notes = models.TextField(blank=True, verbose_name='备注')
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_memberships',
        verbose_name='创建人'
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新时间')

    class Meta:
        verbose_name = '储值卡'
        verbose_name_plural = '储值卡'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['card_number']),
            models.Index(fields=['student', 'status']),
        ]

    def __str__(self):
        return f'{self.card_number} - {self.student.name}'


class RechargeRecord(models.Model):
    class PaymentMethod(models.TextChoices):
        CASH = 'cash', _('现金')
        WECHAT = 'wechat', _('微信')
        ALIPAY = 'alipay', _('支付宝')
        BANK = 'bank', _('银行卡')
        OTHER = 'other', _('其他')

    membership = models.ForeignKey(MembershipCard, on_delete=models.PROTECT, related_name='recharges', verbose_name='储值卡')
    plan = models.ForeignKey(MembershipPlan, on_delete=models.PROTECT, verbose_name='充值套餐')
    amount = models.DecimalField(max_digits=10, decimal_places=2, verbose_name='充值金额')
    value_added = models.DecimalField(max_digits=10, decimal_places=2, verbose_name='到账金额')
    times_added = models.IntegerField(null=True, blank=True, verbose_name='增加次数')
    payment_method = models.CharField(max_length=20, choices=PaymentMethod.choices, verbose_name='支付方式')
    transaction_no = models.CharField(max_length=100, blank=True, verbose_name='交易流水号')
    operator = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='handled_recharges',
        verbose_name='经办人'
    )
    notes = models.TextField(blank=True, verbose_name='备注')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='充值时间')

    class Meta:
        verbose_name = '充值记录'
        verbose_name_plural = '充值记录'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.membership.card_number} - {self.amount}'


class ConsumptionRecord(models.Model):
    class ConsumptionType(models.TextChoices):
        COURSE = 'course', _('课程消费')
        PRODUCT = 'product', _('商品购买')
        SERVICE = 'service', _('其他服务')

    membership = models.ForeignKey(MembershipCard, on_delete=models.PROTECT, related_name='consumptions', verbose_name='储值卡')
    consumption_type = models.CharField(max_length=20, choices=ConsumptionType.choices, verbose_name='消费类型')
    amount = models.DecimalField(max_digits=10, decimal_places=2, verbose_name='消费金额')
    times_deducted = models.IntegerField(null=True, blank=True, verbose_name='扣减次数')
    related_schedule = models.ForeignKey(
        'schedule.Schedule',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='consumptions',
        verbose_name='关联排班'
    )
    related_enrollment = models.ForeignKey(
        'schedule.Enrollment',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='consumptions',
        verbose_name='关联报名'
    )
    operator = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='handled_consumptions',
        verbose_name='经办人'
    )
    notes = models.TextField(blank=True, verbose_name='备注')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='消费时间')

    class Meta:
        verbose_name = '消费记录'
        verbose_name_plural = '消费记录'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['membership', 'created_at']),
            models.Index(fields=['related_schedule']),
        ]

    def __str__(self):
        return f'{self.membership.card_number} - {self.get_consumption_type_display()} - {self.amount}'
