from django.db import models


class AuditLog(models.Model):
    ACTION_CHOICES = [
        ('create', '创建'),
        ('update', '更新'),
        ('delete', '删除'),
        ('view', '查看'),
        ('login', '登录'),
        ('logout', '登出'),
        ('export', '导出'),
        ('import', '导入'),
        ('approve', '审批'),
        ('reject', '驳回'),
        ('assign', '分配'),
        ('complete', '完成'),
        ('other', '其他'),
    ]

    user = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True, blank=True, related_name='audit_logs', verbose_name='操作用户')
    username = models.CharField(max_length=150, blank=True, verbose_name='用户名')
    action = models.CharField(max_length=50, choices=ACTION_CHOICES, default='other', verbose_name='操作类型')
    module = models.CharField(max_length=100, verbose_name='操作模块')
    object_id = models.CharField(max_length=100, blank=True, verbose_name='对象ID')
    object_repr = models.CharField(max_length=200, blank=True, verbose_name='对象表示')
    ip_address = models.GenericIPAddressField(null=True, blank=True, verbose_name='IP地址')
    user_agent = models.TextField(blank=True, verbose_name='用户代理')
    message = models.TextField(blank=True, verbose_name='操作描述')
    old_value = models.JSONField(null=True, blank=True, verbose_name='旧值')
    new_value = models.JSONField(null=True, blank=True, verbose_name='新值')
    changed_fields = models.JSONField(null=True, blank=True, verbose_name='变更字段')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='操作时间')

    class Meta:
        db_table = 'audit_logs'
        verbose_name = '审计日志'
        verbose_name_plural = verbose_name
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'created_at']),
            models.Index(fields=['module', 'created_at']),
            models.Index(fields=['action', 'created_at']),
        ]

    def __str__(self):
        return f'{self.username} - {self.get_action_display()} - {self.module}'


class Notification(models.Model):
    NOTIFICATION_TYPE = [
        ('info', '信息'),
        ('warning', '警告'),
        ('error', '错误'),
        ('success', '成功'),
        ('urgent', '紧急'),
    ]

    recipient = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='notifications', verbose_name='接收人')
    sender = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True, blank=True, related_name='sent_notifications', verbose_name='发送人')
    type = models.CharField(max_length=20, choices=NOTIFICATION_TYPE, default='info', verbose_name='通知类型')
    title = models.CharField(max_length=200, verbose_name='标题')
    content = models.TextField(verbose_name='内容')
    module = models.CharField(max_length=100, blank=True, verbose_name='关联模块')
    object_id = models.CharField(max_length=100, blank=True, verbose_name='关联对象ID')
    is_read = models.BooleanField(default=False, verbose_name='是否已读')
    read_at = models.DateTimeField(null=True, blank=True, verbose_name='读取时间')
    is_urgent = models.BooleanField(default=False, verbose_name='是否紧急')
    expires_at = models.DateTimeField(null=True, blank=True, verbose_name='过期时间')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')

    class Meta:
        db_table = 'notifications'
        verbose_name = '通知'
        verbose_name_plural = verbose_name
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.recipient.username} - {self.title}'


class OverdueReminder(models.Model):
    REMINDER_TYPE = [
        ('repair', '报修逾期'),
        ('inspection', '巡检逾期'),
        ('borrow', '借阅逾期'),
        ('activity', '活动待确认'),
    ]

    type = models.CharField(max_length=30, choices=REMINDER_TYPE, verbose_name='提醒类型')
    related_object_id = models.CharField(max_length=100, verbose_name='关联对象ID')
    related_object_repr = models.CharField(max_length=200, verbose_name='关联对象')
    venue = models.ForeignKey('venues.Venue', on_delete=models.CASCADE, related_name='overdue_reminders', verbose_name='所属场馆')
    assignee = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='overdue_reminders', verbose_name='负责人')
    overdue_days = models.IntegerField(default=0, verbose_name='逾期天数')
    message = models.TextField(verbose_name='提醒内容')
    is_handled = models.BooleanField(default=False, verbose_name='是否已处理')
    handled_by = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True, blank=True, related_name='handled_reminders', verbose_name='处理人')
    handled_at = models.DateTimeField(null=True, blank=True, verbose_name='处理时间')
    reminder_count = models.IntegerField(default=1, verbose_name='提醒次数')
    last_reminder_at = models.DateTimeField(auto_now_add=True, verbose_name='上次提醒时间')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')

    class Meta:
        db_table = 'overdue_reminders'
        verbose_name = '逾期提醒'
        verbose_name_plural = verbose_name
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.get_type_display()} - {self.related_object_repr}'
