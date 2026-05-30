from django.db import models
from django.db.models.signals import post_save
from django.dispatch import receiver
from apps.common.models import BaseModel


class InspectionStatus(models.TextChoices):
    DRAFT = 'draft', '草稿'
    SUBMITTED = 'submitted', '已提交'
    REVIEWING = 'reviewing', '审核中'
    APPROVED = 'approved', '已通过'
    REJECTED = 'rejected', '已驳回'
    NEEDS_REVIEW = 'needs_review', '需回查'
    COMPLETED = 'completed', '已完成'


class InspectionType(models.TextChoices):
    DAILY = 'daily', '日常巡检'
    WEEKLY = 'weekly', '周巡检'
    MONTHLY = 'monthly', '月巡检'
    SPECIAL = 'special', '专项巡检'


class CheckItemCategory(models.TextChoices):
    ENVIRONMENT = 'environment', '环境卫生'
    FACILITY = 'facility', '设施设备'
    SECURITY = 'security', '安全消防'
    SERVICE = 'service', '服务规范'
    OTHER = 'other', '其他'


class InspectionPlan(BaseModel):
    venue = models.ForeignKey('venues.Venue', on_delete=models.CASCADE, related_name='inspection_plans', verbose_name='所属场馆')
    name = models.CharField(max_length=100, verbose_name='计划名称')
    type = models.CharField(max_length=20, choices=InspectionType.choices, default=InspectionType.DAILY, verbose_name='巡检类型')
    description = models.TextField(blank=True, verbose_name='计划描述')
    is_active = models.BooleanField(default=True, verbose_name='是否启用')

    class Meta:
        db_table = 'inspection_plans'
        verbose_name = '巡检计划'
        verbose_name_plural = verbose_name

    def __str__(self):
        return f'{self.venue.name} - {self.name}'


class CheckItem(BaseModel):
    plan = models.ForeignKey(InspectionPlan, on_delete=models.CASCADE, related_name='check_items', verbose_name='所属计划')
    category = models.CharField(max_length=30, choices=CheckItemCategory.choices, default=CheckItemCategory.OTHER, verbose_name='检查项分类')
    name = models.CharField(max_length=200, verbose_name='检查项名称')
    description = models.TextField(blank=True, verbose_name='检查标准')
    is_required = models.BooleanField(default=True, verbose_name='是否必填')
    sort_order = models.IntegerField(default=0, verbose_name='排序')

    class Meta:
        db_table = 'check_items'
        verbose_name = '检查项'
        verbose_name_plural = verbose_name
        ordering = ['sort_order', 'id']

    def __str__(self):
        return self.name


class InspectionRecord(BaseModel):
    venue = models.ForeignKey('venues.Venue', on_delete=models.CASCADE, related_name='inspection_records', verbose_name='所属场馆')
    plan = models.ForeignKey(InspectionPlan, on_delete=models.SET_NULL, null=True, blank=True, related_name='records', verbose_name='巡检计划')
    inspector = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True, related_name='inspections', verbose_name='巡检人员')
    type = models.CharField(max_length=20, choices=InspectionType.choices, default=InspectionType.DAILY, verbose_name='巡检类型')
    title = models.CharField(max_length=200, verbose_name='巡检标题')
    status = models.CharField(max_length=20, choices=InspectionStatus.choices, default=InspectionStatus.DRAFT, verbose_name='状态')
    start_time = models.DateTimeField(null=True, blank=True, verbose_name='开始时间')
    end_time = models.DateTimeField(null=True, blank=True, verbose_name='结束时间')
    overall_rating = models.IntegerField(null=True, blank=True, verbose_name='总体评分')
    remarks = models.TextField(blank=True, verbose_name='巡检备注')
    reviewer = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True, blank=True, related_name='reviewed_inspections', verbose_name='审核人')
    review_time = models.DateTimeField(null=True, blank=True, verbose_name='审核时间')
    review_comments = models.TextField(blank=True, verbose_name='审核意见')
    needs_review_reason = models.TextField(blank=True, verbose_name='需回查原因')
    is_overdue = models.BooleanField(default=False, verbose_name='是否逾期')

    class Meta:
        db_table = 'inspection_records'
        verbose_name = '巡检记录'
        verbose_name_plural = verbose_name
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.title} - {self.get_status_display()}'

    def can_create_repair(self):
        return self.status in [InspectionStatus.SUBMITTED, InspectionStatus.REVIEWING, InspectionStatus.NEEDS_REVIEW]


class InspectionItemResult(BaseModel):
    inspection = models.ForeignKey(InspectionRecord, on_delete=models.CASCADE, related_name='item_results', verbose_name='所属巡检')
    check_item = models.ForeignKey(CheckItem, on_delete=models.SET_NULL, null=True, blank=True, verbose_name='检查项')
    item_name = models.CharField(max_length=200, verbose_name='检查项名称')
    item_category = models.CharField(max_length=30, choices=CheckItemCategory.choices, verbose_name='检查项分类')
    is_passed = models.BooleanField(null=True, verbose_name='是否通过')
    result_value = models.TextField(blank=True, verbose_name='检查结果')
    remarks = models.TextField(blank=True, verbose_name='备注')
    device = models.ForeignKey('devices.Device', on_delete=models.SET_NULL, null=True, blank=True, related_name='inspection_results', verbose_name='关联设备')
    has_issue = models.BooleanField(default=False, verbose_name='发现问题')
    issue_description = models.TextField(blank=True, verbose_name='问题描述')
    need_repair = models.BooleanField(default=False, verbose_name='需要报修')

    class Meta:
        db_table = 'inspection_item_results'
        verbose_name = '巡检项结果'
        verbose_name_plural = verbose_name

    def __str__(self):
        return f'{self.inspection.title} - {self.item_name}'


class InspectionImage(models.Model):
    inspection_item = models.ForeignKey(InspectionItemResult, on_delete=models.CASCADE, related_name='images', verbose_name='所属巡检项')
    image = models.ImageField(upload_to='inspections/', verbose_name='图片')
    uploaded_at = models.DateTimeField(auto_now_add=True, verbose_name='上传时间')

    class Meta:
        db_table = 'inspection_images'
        verbose_name = '巡检图片'
        verbose_name_plural = verbose_name
