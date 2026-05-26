from django.db import models
from apps.base.models import BaseModel
from apps.customer.models import Customer
from apps.weight.models import WeightTicket


class CreditRecord(BaseModel):
    STATUS_CHOICES = [
        ('pending', '待确认'),
        ('approved', '已确认'),
        ('rejected', '已驳回'),
    ]

    record_no = models.CharField(max_length=50, unique=True, verbose_name='赊账编号')
    customer = models.ForeignKey(Customer, on_delete=models.PROTECT, verbose_name='客户')
    weight_ticket = models.OneToOneField(WeightTicket, on_delete=models.PROTECT, null=True, blank=True, verbose_name='关联磅单')
    amount = models.DecimalField(max_digits=14, decimal_places=2, verbose_name='赊账金额')
    due_date = models.DateField(verbose_name='约定还款日期')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending', verbose_name='状态')
    remark = models.TextField(blank=True, null=True, verbose_name='备注')
    reviewed_by = models.ForeignKey(
        'auth.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='reviewed_credits',
        verbose_name='确认人'
    )
    reviewed_at = models.DateTimeField(null=True, blank=True, verbose_name='确认时间')
    reject_reason = models.TextField(blank=True, null=True, verbose_name='驳回原因')

    class Meta:
        db_table = 'credit_record'
        verbose_name = '赊账记录'
        verbose_name_plural = verbose_name
        ordering = ['-created_at']

    def __str__(self):
        return self.record_no

    def get_repaid_amount(self):
        return self.repayments.filter(status='approved').aggregate(total=models.Sum('amount'))['total'] or 0

    def get_remaining_amount(self):
        return self.amount - self.get_repaid_amount()


class RepaymentRecord(BaseModel):
    STATUS_CHOICES = [
        ('pending', '待确认'),
        ('approved', '已确认'),
        ('rejected', '已驳回'),
    ]

    PAYMENT_METHOD_CHOICES = [
        ('cash', '现金'),
        ('transfer', '银行转账'),
        ('wechat', '微信'),
        ('alipay', '支付宝'),
        ('deduction', '抵扣货款'),
    ]

    record_no = models.CharField(max_length=50, unique=True, verbose_name='回款编号')
    customer = models.ForeignKey(Customer, on_delete=models.PROTECT, verbose_name='客户')
    credit_record = models.ForeignKey(CreditRecord, on_delete=models.PROTECT, related_name='repayments', verbose_name='关联赊账')
    amount = models.DecimalField(max_digits=14, decimal_places=2, verbose_name='回款金额')
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHOD_CHOICES, default='cash', verbose_name='付款方式')
    payment_time = models.DateTimeField(verbose_name='付款时间')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending', verbose_name='状态')
    voucher_photo = models.ImageField(upload_to='repayment_vouchers/', blank=True, null=True, verbose_name='付款凭证')
    remark = models.TextField(blank=True, null=True, verbose_name='备注')
    reviewed_by = models.ForeignKey(
        'auth.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='reviewed_repayments',
        verbose_name='确认人'
    )
    reviewed_at = models.DateTimeField(null=True, blank=True, verbose_name='确认时间')
    reject_reason = models.TextField(blank=True, null=True, verbose_name='驳回原因')

    class Meta:
        db_table = 'repayment_record'
        verbose_name = '回款记录'
        verbose_name_plural = verbose_name
        ordering = ['-created_at']

    def __str__(self):
        return self.record_no


class CreditReminder(BaseModel):
    REMINDER_TYPE_CHOICES = [
        ('due_soon', '即将到期'),
        ('overdue', '已逾期'),
        ('custom', '自定义提醒'),
    ]

    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, verbose_name='客户')
    credit_record = models.ForeignKey(CreditRecord, on_delete=models.CASCADE, null=True, blank=True, verbose_name='关联赊账')
    type = models.CharField(max_length=20, choices=REMINDER_TYPE_CHOICES, verbose_name='提醒类型')
    title = models.CharField(max_length=200, verbose_name='提醒标题')
    content = models.TextField(verbose_name='提醒内容')
    reminder_date = models.DateField(verbose_name='提醒日期')
    is_read = models.BooleanField(default=False, verbose_name='是否已读')
    is_handled = models.BooleanField(default=False, verbose_name='是否已处理')
    handled_by = models.ForeignKey(
        'auth.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='handled_reminders',
        verbose_name='处理人'
    )
    handled_at = models.DateTimeField(null=True, blank=True, verbose_name='处理时间')
    handle_note = models.TextField(blank=True, null=True, verbose_name='处理备注')

    class Meta:
        db_table = 'credit_reminder'
        verbose_name = '回款提醒'
        verbose_name_plural = verbose_name
        ordering = ['-created_at']

    def __str__(self):
        return self.title
