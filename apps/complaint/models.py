from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _
from apps.schedule.models import Student


class Complaint(models.Model):
    class Category(models.TextChoices):
        WATER_QUALITY = 'water_quality', _('水质问题')
        FACILITY = 'facility', _('设施问题')
        COACH = 'coach', _('教练问题')
        SERVICE = 'service', _('服务问题')
        SCHEDULE = 'schedule', _('排课问题')
        OTHER = 'other', _('其他问题')

    class Priority(models.TextChoices):
        LOW = 'low', _('低')
        MEDIUM = 'medium', _('中')
        HIGH = 'high', _('高')
        URGENT = 'urgent', _('紧急')

    class Status(models.TextChoices):
        SUBMITTED = 'submitted', _('已提交')
        ASSIGNED = 'assigned', _('已分配')
        PROCESSING = 'processing', _('处理中')
        RESOLVED = 'resolved', _('已解决')
        CLOSED = 'closed', _('已关闭')
        ESCALATED = 'escalated', _('已升级')

    title = models.CharField(max_length=200, verbose_name='标题')
    category = models.CharField(max_length=30, choices=Category.choices, verbose_name='问题分类')
    priority = models.CharField(max_length=20, choices=Priority.choices, default=Priority.MEDIUM, verbose_name='优先级')
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.SUBMITTED, verbose_name='状态')
    description = models.TextField(verbose_name='问题描述')
    reporter_name = models.CharField(max_length=50, blank=True, verbose_name='报修人姓名')
    reporter_phone = models.CharField(max_length=20, blank=True, verbose_name='联系电话')
    student = models.ForeignKey(Student, on_delete=models.SET_NULL, null=True, blank=True, related_name='complaints', verbose_name='关联学员')
    location = models.CharField(max_length=100, blank=True, verbose_name='具体位置')
    photo = models.ImageField(upload_to='complaints/', null=True, blank=True, verbose_name='现场照片')
    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_complaints',
        verbose_name='处理人'
    )
    submitted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='submitted_complaints',
        verbose_name='提交人'
    )
    expected_resolve_time = models.DateTimeField(null=True, blank=True, verbose_name='期望解决时间')
    actual_resolve_time = models.DateTimeField(null=True, blank=True, verbose_name='实际解决时间')
    resolution = models.TextField(blank=True, verbose_name='解决方案')
    notes = models.TextField(blank=True, verbose_name='内部备注')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新时间')

    class Meta:
        verbose_name = '投诉/问题'
        verbose_name_plural = '投诉/问题'
        ordering = ['-priority', '-created_at']
        indexes = [
            models.Index(fields=['status', 'priority']),
            models.Index(fields=['category', 'created_at']),
            models.Index(fields=['assigned_to', 'status']),
        ]

    def __str__(self):
        return f'[{self.get_priority_display()}] {self.title}'


class ComplaintComment(models.Model):
    complaint = models.ForeignKey(Complaint, on_delete=models.CASCADE, related_name='comments', verbose_name='投诉')
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='complaint_comments',
        verbose_name='评论人'
    )
    content = models.TextField(verbose_name='内容')
    is_internal = models.BooleanField(default=False, verbose_name='是否内部评论')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')

    class Meta:
        verbose_name = '处理记录'
        verbose_name_plural = '处理记录'
        ordering = ['created_at']

    def __str__(self):
        return f'{self.author.username} - {self.created_at}'
