from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _


class Course(models.Model):
    class Level(models.TextChoices):
        BEGINNER = 'beginner', _('入门')
        INTERMEDIATE = 'intermediate', _('进阶')
        ADVANCED = 'advanced', _('高级')

    class CourseType(models.TextChoices):
        GROUP = 'group', _('大班课')
        SMALL_GROUP = 'small_group', _('小班课')
        PRIVATE = 'private', _('私教课')

    name = models.CharField(max_length=100, verbose_name='课程名称')
    course_type = models.CharField(max_length=20, choices=CourseType.choices, verbose_name='课程类型')
    level = models.CharField(max_length=20, choices=Level.choices, verbose_name='难度等级')
    duration = models.IntegerField(verbose_name='课时(分钟)')
    max_students = models.IntegerField(default=10, verbose_name='最大人数')
    min_students = models.IntegerField(default=1, verbose_name='最少人数')
    description = models.TextField(blank=True, verbose_name='课程描述')
    requirements = models.TextField(blank=True, verbose_name='学员要求')
    is_active = models.BooleanField(default=True, verbose_name='是否启用')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新时间')

    class Meta:
        verbose_name = '课程模板'
        verbose_name_plural = '课程模板'
        ordering = ['name']

    def __str__(self):
        return f'{self.name} ({self.get_course_type_display()})'


class Student(models.Model):
    class Gender(models.TextChoices):
        MALE = 'male', _('男')
        FEMALE = 'female', _('女')

    name = models.CharField(max_length=50, verbose_name='学员姓名')
    gender = models.CharField(max_length=10, choices=Gender.choices, verbose_name='性别')
    birth_date = models.DateField(null=True, blank=True, verbose_name='出生日期')
    phone = models.CharField(max_length=20, verbose_name='联系电话')
    emergency_contact = models.CharField(max_length=50, blank=True, verbose_name='紧急联系人')
    emergency_phone = models.CharField(max_length=20, blank=True, verbose_name='紧急联系电话')
    health_notes = models.TextField(blank=True, verbose_name='健康备注')
    swim_level = models.CharField(max_length=20, choices=Course.Level.choices, blank=True, verbose_name='当前水平')
    is_active = models.BooleanField(default=True, verbose_name='是否活跃')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新时间')

    class Meta:
        verbose_name = '学员'
        verbose_name_plural = '学员'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['name', 'phone']),
        ]

    def __str__(self):
        return f'{self.name} ({self.phone})'


class Schedule(models.Model):
    class Status(models.TextChoices):
        DRAFT = 'draft', _('待发布')
        PUBLISHED = 'published', _('已发布')
        CONFIRMED = 'confirmed', _('已确认')
        COMPLETED = 'completed', _('已完成')
        CANCELLED = 'cancelled', _('已取消')

    course = models.ForeignKey(Course, on_delete=models.PROTECT, related_name='schedules', verbose_name='课程')
    coach = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        limit_choices_to={'role': 'coach'},
        related_name='coached_schedules',
        verbose_name='教练'
    )
    start_time = models.DateTimeField(verbose_name='开始时间')
    end_time = models.DateTimeField(verbose_name='结束时间')
    pool_lane = models.CharField(max_length=50, blank=True, verbose_name='泳道')
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT, verbose_name='状态')
    max_students = models.IntegerField(verbose_name='最大人数')
    actual_students = models.IntegerField(default=0, verbose_name='实际人数')
    notes = models.TextField(blank=True, verbose_name='备注')
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_schedules',
        verbose_name='创建人'
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新时间')

    class Meta:
        verbose_name = '排班'
        verbose_name_plural = '排班'
        ordering = ['-start_time']
        indexes = [
            models.Index(fields=['start_time', 'status']),
            models.Index(fields=['coach', 'start_time']),
        ]

    def __str__(self):
        return f'{self.course.name} - {self.start_time.strftime("%Y-%m-%d %H:%M")}'

    def clean(self):
        from django.core.exceptions import ValidationError
        if self.end_time <= self.start_time:
            raise ValidationError('结束时间必须晚于开始时间')
        if self.max_students < 1:
            raise ValidationError('最大人数不能小于1')


class Enrollment(models.Model):
    class Status(models.TextChoices):
        ENROLLED = 'enrolled', _('已报名')
        ATTENDED = 'attended', _('已上课')
        ABSENT = 'absent', _('缺勤')
        LEAVE_APPROVED = 'leave_approved', _('请假批准')
        LEAVE_REJECTED = 'leave_rejected', _('请假驳回')
        CANCELLED = 'cancelled', _('已取消')

    schedule = models.ForeignKey(Schedule, on_delete=models.PROTECT, related_name='enrollments', verbose_name='排班')
    student = models.ForeignKey(Student, on_delete=models.PROTECT, related_name='enrollments', verbose_name='学员')
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.ENROLLED, verbose_name='状态')
    enrolled_at = models.DateTimeField(auto_now_add=True, verbose_name='报名时间')
    attendance_time = models.DateTimeField(null=True, blank=True, verbose_name='签到时间')
    leave_reason = models.TextField(blank=True, verbose_name='请假原因')
    leave_approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='approved_leaves',
        verbose_name='请假审批人'
    )
    leave_approved_at = models.DateTimeField(null=True, blank=True, verbose_name='请假审批时间')
    notes = models.TextField(blank=True, verbose_name='备注')

    class Meta:
        verbose_name = '报名记录'
        verbose_name_plural = '报名记录'
        unique_together = [['schedule', 'student']]
        ordering = ['-enrolled_at']
        indexes = [
            models.Index(fields=['schedule', 'status']),
            models.Index(fields=['student', 'status']),
        ]

    def __str__(self):
        return f'{self.student.name} - {self.schedule}'
