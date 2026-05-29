from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone


class UserProfile(models.Model):
    ROLE_CHOICES = [
        ('BOSS', '门店老板'),
        ('SALES', '配件销售'),
        ('WAREHOUSE', '库管'),
    ]
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='SALES')
    phone = models.CharField(max_length=20, blank=True)

    class Meta:
        db_table = 'user_profile'

    def __str__(self):
        return f'{self.user.get_full_name()} - {self.get_role_display()}'


class Customer(models.Model):
    CREDIT_STATUS_CHOICES = [
        ('NORMAL', '正常'),
        ('WARNING', '预警'),
        ('OVERDUE', '逾期'),
        ('FROZEN', '冻结'),
    ]
    name = models.CharField(max_length=100)
    contact = models.CharField(max_length=50)
    phone = models.CharField(max_length=20)
    address = models.TextField(blank=True)
    credit_limit = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    credit_used = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    credit_days = models.IntegerField(default=30)
    credit_status = models.CharField(max_length=20, choices=CREDIT_STATUS_CHOICES, default='NORMAL')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'customer'

    @property
    def available_credit(self):
        return self.credit_limit - self.credit_used

    def __str__(self):
        return self.name


class Part(models.Model):
    CATEGORY_CHOICES = [
        ('ENGINE', '发动机件'),
        ('CHASSIS', '底盘件'),
        ('ELECTRIC', '电器件'),
        ('BODY', '外观件'),
        ('OIL', '油品'),
        ('OTHER', '其他'),
    ]
    part_code = models.CharField(max_length=50, unique=True)
    name = models.CharField(max_length=200)
    brand = models.CharField(max_length=50, blank=True)
    model = models.CharField(max_length=100, blank=True)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='OTHER')
    spec = models.CharField(max_length=200, blank=True)
    unit = models.CharField(max_length=10, default='个')
    stock_qty = models.IntegerField(default=0)
    cost_price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    sale_price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'part'

    def __str__(self):
        return f'{self.part_code} - {self.name}'


class Order(models.Model):
    STATUS_CHOICES = [
        ('INQUIRY', '询价中'),
        ('INQUIRY_APPROVED', '询价已确认'),
        ('LOCKED', '已锁库'),
        ('DELIVERED', '已出库'),
        ('SETTLED', '已结算'),
        ('RETURN_REQUESTED', '退货申请中'),
        ('RETURN_APPROVED', '退货已批准'),
        ('RETURN_REJECTED', '退货已驳回'),
        ('RETURNED', '已退货'),
        ('PAID_PARTIAL', '部分回款'),
        ('PAID', '已结清'),
        ('OVERDUE', '已逾期'),
        ('CANCELLED', '已取消'),
    ]
    order_no = models.CharField(max_length=30, unique=True)
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='orders')
    sales_person = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='sales_orders')
    warehouse_person = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='warehouse_orders')
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='INQUIRY')
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    paid_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    credit_days = models.IntegerField(default=30)
    due_date = models.DateField(null=True, blank=True)
    remark = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'order'
        ordering = ['-created_at']

    @property
    def unpaid_amount(self):
        return self.total_amount - self.paid_amount

    @property
    def is_overdue(self):
        if self.due_date and self.status not in ['PAID', 'CANCELLED', 'RETURNED']:
            return timezone.now().date() > self.due_date
        return False

    def __str__(self):
        return self.order_no


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    part = models.ForeignKey(Part, on_delete=models.CASCADE)
    part_name = models.CharField(max_length=200)
    part_code = models.CharField(max_length=50)
    spec = models.CharField(max_length=200, blank=True)
    quantity = models.IntegerField(default=1)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    subtotal = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    is_returned = models.BooleanField(default=False)
    return_quantity = models.IntegerField(default=0)
    return_reason = models.TextField(blank=True)

    class Meta:
        db_table = 'order_item'

    def save(self, *args, **kwargs):
        self.subtotal = self.quantity * self.unit_price
        super().save(*args, **kwargs)


class OrderStatusLog(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='status_logs')
    from_status = models.CharField(max_length=30, blank=True)
    to_status = models.CharField(max_length=30)
    operator = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    remark = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'order_status_log'
        ordering = ['-created_at']


class OrderRemark(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='remarks')
    author = models.ForeignKey(User, on_delete=models.CASCADE)
    content = models.TextField()
    is_internal = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'order_remark'
        ordering = ['-created_at']


class Payment(models.Model):
    STATUS_CHOICES = [
        ('PENDING', '待确认'),
        ('CONFIRMED', '已确认'),
        ('REJECTED', '已驳回'),
    ]
    PAYMENT_METHOD_CHOICES = [
        ('CASH', '现金'),
        ('BANK', '银行转账'),
        ('WECHAT', '微信'),
        ('ALIPAY', '支付宝'),
        ('CHECK', '支票'),
    ]
    payment_no = models.CharField(max_length=30, unique=True)
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='payments')
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    method = models.CharField(max_length=20, choices=PAYMENT_METHOD_CHOICES, default='BANK')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    operator = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='payments')
    confirm_person = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='confirmed_payments')
    remark = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    confirmed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'payment'
        ordering = ['-created_at']


class CollectionReminder(models.Model):
    PRIORITY_CHOICES = [
        ('LOW', '低'),
        ('MEDIUM', '中'),
        ('HIGH', '高'),
        ('URGENT', '紧急'),
    ]
    STATUS_CHOICES = [
        ('PENDING', '待处理'),
        ('IN_PROGRESS', '处理中'),
        ('COMPLETED', '已完成'),
        ('CANCELLED', '已取消'),
    ]
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='reminders')
    assignee = models.ForeignKey(User, on_delete=models.CASCADE, related_name='assigned_reminders')
    creator = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_reminders')
    title = models.CharField(max_length=200)
    content = models.TextField()
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='MEDIUM')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    due_date = models.DateField(null=True, blank=True)
    result = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'collection_reminder'
        ordering = ['-created_at']


class ReminderRemark(models.Model):
    reminder = models.ForeignKey(CollectionReminder, on_delete=models.CASCADE, related_name='remarks')
    author = models.ForeignKey(User, on_delete=models.CASCADE)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'reminder_remark'
        ordering = ['-created_at']
