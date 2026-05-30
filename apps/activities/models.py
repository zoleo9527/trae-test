from django.db import models
from django.utils import timezone
from apps.common.models import BaseModel


class ActivityStatus(models.TextChoices):
    DRAFT = 'draft', '草稿'
    PUBLISHED = 'published', '已发布'
    REGISTERING = 'registering', '报名中'
    UPCOMING = 'upcoming', '即将开始'
    IN_PROGRESS = 'in_progress', '进行中'
    COMPLETED = 'completed', '已结束'
    CANCELLED = 'cancelled', '已取消'


class RegistrationStatus(models.TextChoices):
    PENDING = 'pending', '待审核'
    APPROVED = 'approved', '已通过'
    REJECTED = 'rejected', '已拒绝'
    CANCELLED = 'cancelled', '已取消'
    CHECKED_IN = 'checked_in', '已签到'
    NO_SHOW = 'no_show', '未到场'


class ActivityCategory(BaseModel):
    name = models.CharField(max_length=100, verbose_name='分类名称')
    code = models.CharField(max_length=50, unique=True, verbose_name='分类编号')
    icon = models.CharField(max_length=50, blank=True, verbose_name='图标')
    description = models.TextField(blank=True, verbose_name='描述')

    class Meta:
        db_table = 'activity_categories'
        verbose_name = '活动分类'
        verbose_name_plural = verbose_name

    def __str__(self):
        return self.name


class Activity(BaseModel):
    venue = models.ForeignKey('venues.Venue', on_delete=models.CASCADE, related_name='activities', verbose_name='所属场馆')
    area = models.ForeignKey('venues.VenueArea', on_delete=models.SET_NULL, null=True, blank=True, related_name='activities', verbose_name='活动区域')
    category = models.ForeignKey(ActivityCategory, on_delete=models.SET_NULL, null=True, blank=True, related_name='activities', verbose_name='活动分类')
    organizer = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True, related_name='organized_activities', verbose_name='组织者')
    title = models.CharField(max_length=200, verbose_name='活动标题')
    description = models.TextField(verbose_name='活动描述')
    status = models.CharField(max_length=20, choices=ActivityStatus.choices, default=ActivityStatus.DRAFT, verbose_name='状态')
    start_time = models.DateTimeField(verbose_name='开始时间')
    end_time = models.DateTimeField(verbose_name='结束时间')
    registration_start = models.DateTimeField(verbose_name='报名开始时间')
    registration_end = models.DateTimeField(verbose_name='报名结束时间')
    max_participants = models.IntegerField(default=50, verbose_name='最大参与人数')
    min_participants = models.IntegerField(default=0, verbose_name='最少参与人数')
    current_participants = models.IntegerField(default=0, verbose_name='当前报名人数')
    location = models.CharField(max_length=200, blank=True, verbose_name='具体位置')
    contact_person = models.CharField(max_length=50, blank=True, verbose_name='联系人')
    contact_phone = models.CharField(max_length=20, blank=True, verbose_name='联系电话')
    is_need_checkin = models.BooleanField(default=True, verbose_name='需要签到')
    checkin_code = models.CharField(max_length=20, blank=True, verbose_name='签到码')
    cover_image = models.ImageField(upload_to='activities/', null=True, blank=True, verbose_name='封面图片')
    tags = models.CharField(max_length=500, blank=True, verbose_name='标签')
    remarks = models.TextField(blank=True, verbose_name='备注')

    class Meta:
        db_table = 'activities'
        verbose_name = '活动'
        verbose_name_plural = verbose_name
        ordering = ['-start_time']

    def __str__(self):
        return self.title

    def update_status(self):
        now = timezone.now()
        if now < self.registration_start:
            self.status = ActivityStatus.PUBLISHED
        elif self.registration_start <= now < self.registration_end:
            self.status = ActivityStatus.REGISTERING
        elif self.registration_end <= now < self.start_time:
            self.status = ActivityStatus.UPCOMING
        elif self.start_time <= now < self.end_time:
            self.status = ActivityStatus.IN_PROGRESS
        elif now >= self.end_time:
            self.status = ActivityStatus.COMPLETED
        self.save()
        return self.status


class ActivityRegistration(BaseModel):
    activity = models.ForeignKey(Activity, on_delete=models.CASCADE, related_name='registrations', verbose_name='活动')
    user = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='activity_registrations', verbose_name='报名用户')
    status = models.CharField(max_length=20, choices=RegistrationStatus.choices, default=RegistrationStatus.PENDING, verbose_name='状态')
    registration_time = models.DateTimeField(auto_now_add=True, verbose_name='报名时间')
    checkin_time = models.DateTimeField(null=True, blank=True, verbose_name='签到时间')
    checkin_method = models.CharField(max_length=50, blank=True, verbose_name='签到方式')
    volunteer_hours = models.DecimalField(max_digits=5, decimal_places=2, default=0, verbose_name='志愿服务时长')
    feedback_rating = models.IntegerField(null=True, blank=True, verbose_name='评分')
    feedback_comments = models.TextField(blank=True, verbose_name='反馈意见')
    feedback_time = models.DateTimeField(null=True, blank=True, verbose_name='反馈时间')
    remarks = models.TextField(blank=True, verbose_name='备注')
    reviewer = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True, blank=True, related_name='reviewed_registrations', verbose_name='审核人')
    review_time = models.DateTimeField(null=True, blank=True, verbose_name='审核时间')
    review_comments = models.TextField(blank=True, verbose_name='审核意见')

    class Meta:
        db_table = 'activity_registrations'
        unique_together = ('activity', 'user')
        verbose_name = '活动报名'
        verbose_name_plural = verbose_name
        ordering = ['-registration_time']

    def __str__(self):
        return f'{self.user.username} - {self.activity.title}'


class VolunteerFeedback(BaseModel):
    activity = models.ForeignKey(Activity, on_delete=models.CASCADE, related_name='volunteer_feedbacks', verbose_name='活动')
    volunteer = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='volunteer_feedbacks', verbose_name='志愿者')
    task_description = models.TextField(verbose_name='任务描述')
    actual_hours = models.DecimalField(max_digits=5, decimal_places=2, verbose_name='实际服务时长')
    issues_encountered = models.TextField(blank=True, verbose_name='遇到的问题')
    suggestions = models.TextField(blank=True, verbose_name='建议')
    is_resolved = models.BooleanField(default=False, verbose_name='问题已解决')
    handler = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True, blank=True, related_name='handled_feedbacks', verbose_name='处理人')
    handle_notes = models.TextField(blank=True, verbose_name='处理备注')
    handle_time = models.DateTimeField(null=True, blank=True, verbose_name='处理时间')
    submitted_at = models.DateTimeField(auto_now_add=True, verbose_name='提交时间')

    class Meta:
        db_table = 'volunteer_feedbacks'
        verbose_name = '志愿者反馈'
        verbose_name_plural = verbose_name
        ordering = ['-submitted_at']

    def __str__(self):
        return f'{self.volunteer.username} - {self.activity.title}'
