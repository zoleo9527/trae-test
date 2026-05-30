from django.db import models
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone
from apps.common.models import BaseModel


class RepairStatus(models.TextChoices):
    PENDING = 'pending', '待处理'
    ASSIGNED = 'assigned', '已派单'
    IN_PROGRESS = 'in_progress', '处理中'
    NEEDS_CONFIRM = 'needs_confirm', '待确认'
    COMPLETED = 'completed', '已完成'
    REJECTED = 'rejected', '已驳回'
    CANCELLED = 'cancelled', '已取消'


class RepairPriority(models.TextChoices):
    LOW = 'low', '低'
    MEDIUM = 'medium', '中'
    HIGH = 'high', '高'
    URGENT = 'urgent', '紧急'


class RepairCategory(models.TextChoices):
    ELECTRICAL = 'electrical', '电路故障'
    MECHANICAL = 'mechanical', '机械故障'
    SOFTWARE = 'software', '软件问题'
    HARDWARE = 'hardware', '硬件损坏'
    CLEANING = 'cleaning', '清洁维护'
    OTHER = 'other', '其他'


class RepairTicket(BaseModel):
    ticket_no = models.CharField(max_length=50, unique=True, verbose_name='报修单号')
    venue = models.ForeignKey('venues.Venue', on_delete=models.CASCADE, related_name='repair_tickets', verbose_name='所属场馆')
    device = models.ForeignKey('devices.Device', on_delete=models.SET_NULL, null=True, blank=True, related_name='repair_tickets', verbose_name='关联设备')
    area = models.ForeignKey('venues.VenueArea', on_delete=models.SET_NULL, null=True, blank=True, related_name='repair_tickets', verbose_name='所属区域')
    reporter = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True, related_name='reported_repairs', verbose_name='报修人')
    assignee = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_repairs', verbose_name='维修人员')
    inspection = models.ForeignKey('inspections.InspectionRecord', on_delete=models.SET_NULL, null=True, blank=True, related_name='repair_tickets', verbose_name='关联巡检')
    inspection_item = models.ForeignKey('inspections.InspectionItemResult', on_delete=models.SET_NULL, null=True, blank=True, related_name='repair_tickets', verbose_name='关联巡检项')
    category = models.CharField(max_length=30, choices=RepairCategory.choices, default=RepairCategory.OTHER, verbose_name='故障分类')
    priority = models.CharField(max_length=20, choices=RepairPriority.choices, default=RepairPriority.MEDIUM, verbose_name='优先级')
    status = models.CharField(max_length=20, choices=RepairStatus.choices, default=RepairStatus.PENDING, verbose_name='状态')
    title = models.CharField(max_length=200, verbose_name='故障标题')
    description = models.TextField(verbose_name='故障描述')
    location = models.CharField(max_length=200, blank=True, verbose_name='具体位置')
    contact_phone = models.CharField(max_length=20, blank=True, verbose_name='联系电话')
    expected_date = models.DateField(null=True, blank=True, verbose_name='期望完成日期')
    assigned_time = models.DateTimeField(null=True, blank=True, verbose_name='派单时间')
    start_time = models.DateTimeField(null=True, blank=True, verbose_name='开始处理时间')
    completed_time = models.DateTimeField(null=True, blank=True, verbose_name='完成时间')
    actual_cost = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name='实际费用')
    solution = models.TextField(blank=True, verbose_name='解决方案')
    reject_reason = models.TextField(blank=True, verbose_name='驳回原因')
    is_overdue = models.BooleanField(default=False, verbose_name='是否逾期')
    feedback_rating = models.IntegerField(null=True, blank=True, verbose_name='满意度评分')
    feedback_comments = models.TextField(blank=True, verbose_name='反馈意见')

    class Meta:
        db_table = 'repair_tickets'
        verbose_name = '报修工单'
        verbose_name_plural = verbose_name
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.ticket_no} - {self.title}'

    def save(self, *args, **kwargs):
        if not self.ticket_no:
            self.ticket_no = self.generate_ticket_no()
        super().save(*args, **kwargs)

    def generate_ticket_no(self):
        today = timezone.now().strftime('%Y%m%d')
        count = RepairTicket.objects.filter(ticket_no__startswith=f'REP{today}').count() + 1
        return f'REP{today}{count:04d}'

    def get_flow_actions(self, user):
        actions = []
        if self.status == RepairStatus.PENDING:
            if user.role in ['admin', 'manager']:
                actions.append('assign')
                actions.append('reject')
        elif self.status == RepairStatus.ASSIGNED:
            if user == self.assignee or user.role in ['admin', 'manager']:
                actions.append('start')
        elif self.status == RepairStatus.IN_PROGRESS:
            if user == self.assignee:
                actions.append('complete')
        elif self.status == RepairStatus.NEEDS_CONFIRM:
            if user == self.reporter or user.role in ['admin', 'manager']:
                actions.append('confirm')
                actions.append('reopen')
        return actions


class RepairLog(models.Model):
    ticket = models.ForeignKey(RepairTicket, on_delete=models.CASCADE, related_name='logs', verbose_name='报修工单')
    action = models.CharField(max_length=50, verbose_name='操作动作')
    operator = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True, verbose_name='操作人')
    from_status = models.CharField(max_length=20, blank=True, verbose_name='原状态')
    to_status = models.CharField(max_length=20, blank=True, verbose_name='新状态')
    remarks = models.TextField(blank=True, verbose_name='备注')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='操作时间')

    class Meta:
        db_table = 'repair_logs'
        verbose_name = '报修操作日志'
        verbose_name_plural = verbose_name
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.ticket.ticket_no} - {self.action}'


class RepairImage(models.Model):
    ticket = models.ForeignKey(RepairTicket, on_delete=models.CASCADE, related_name='images', verbose_name='报修工单')
    image = models.ImageField(upload_to='repairs/', verbose_name='图片')
    is_before = models.BooleanField(default=True, verbose_name='是否维修前')
    uploaded_by = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True, verbose_name='上传人')
    uploaded_at = models.DateTimeField(auto_now_add=True, verbose_name='上传时间')

    class Meta:
        db_table = 'repair_images'
        verbose_name = '报修图片'
        verbose_name_plural = verbose_name
