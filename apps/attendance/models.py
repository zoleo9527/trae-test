from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _


class ReconciliationBatch(models.Model):
    class Status(models.TextChoices):
        PENDING = 'pending', _('待处理')
        PROCESSING = 'processing', _('处理中')
        COMPLETED = 'completed', _('已完成')
        PARTIAL = 'partial', _('部分完成')
        FAILED = 'failed', _('失败')

    start_date = models.DateField(verbose_name='对账开始日期')
    end_date = models.DateField(verbose_name='对账结束日期')
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING, verbose_name='状态')
    total_schedules = models.IntegerField(default=0, verbose_name='总排数')
    processed_schedules = models.IntegerField(default=0, verbose_name='已处理数')
    success_count = models.IntegerField(default=0, verbose_name='成功数')
    fail_count = models.IntegerField(default=0, verbose_name='失败数')
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0, verbose_name='对账总金额')
    operator = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='reconciliation_batches',
        verbose_name='操作人'
    )
    notes = models.TextField(blank=True, verbose_name='备注')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')
    completed_at = models.DateTimeField(null=True, blank=True, verbose_name='完成时间')

    class Meta:
        verbose_name = '对账批次'
        verbose_name_plural = '对账批次'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.start_date} ~ {self.end_date} - {self.get_status_display()}'


class ReconciliationRecord(models.Model):
    class Status(models.TextChoices):
        SUCCESS = 'success', _('成功')
        FAILED = 'failed', _('失败')
        SKIPPED = 'skipped', _('已跳过')

    batch = models.ForeignKey(ReconciliationBatch, on_delete=models.CASCADE, related_name='records', verbose_name='对账批次')
    schedule = models.ForeignKey('schedule.Schedule', on_delete=models.CASCADE, related_name='reconciliation_records', verbose_name='排班')
    status = models.CharField(max_length=20, choices=Status.choices, verbose_name='状态')
    total_students = models.IntegerField(default=0, verbose_name='学员总数')
    success_count = models.IntegerField(default=0, verbose_name='成功数')
    fail_count = models.IntegerField(default=0, verbose_name='失败数')
    error_details = models.TextField(blank=True, verbose_name='错误详情')
    processed_at = models.DateTimeField(auto_now_add=True, verbose_name='处理时间')

    class Meta:
        verbose_name = '对账记录'
        verbose_name_plural = '对账记录'
        ordering = ['-processed_at']

    def __str__(self):
        return f'{self.schedule} - {self.get_status_display()}'


class AttendanceSummary(models.Model):
    date = models.DateField(unique=True, verbose_name='日期')
    total_schedules = models.IntegerField(default=0, verbose_name='总排数')
    total_enrollments = models.IntegerField(default=0, verbose_name='总报名数')
    attended_count = models.IntegerField(default=0, verbose_name='出勤数')
    absent_count = models.IntegerField(default=0, verbose_name='缺勤数')
    leave_count = models.IntegerField(default=0, verbose_name='请假数')
    attendance_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0, verbose_name='出勤率%')
    total_consumption = models.DecimalField(max_digits=12, decimal_places=2, default=0, verbose_name='消课总额')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新时间')

    class Meta:
        verbose_name = '考勤汇总'
        verbose_name_plural = '考勤汇总'
        ordering = ['-date']

    def __str__(self):
        return f'{self.date} - 出勤率: {self.attendance_rate}%'
