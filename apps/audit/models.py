from django.db import models
from django.conf import settings


class AuditLog(models.Model):
    ACTION_CHOICES = [
        ('create', '创建'),
        ('update', '更新'),
        ('delete', '删除'),
        ('approve', '审核通过'),
        ('reject', '审核驳回'),
        ('review', '标记回查'),
        ('login', '登录'),
        ('logout', '登出'),
        ('export', '导出'),
        ('import', '导入'),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='audit_logs',
        verbose_name='操作人'
    )
    username = models.CharField(max_length=150, blank=True, null=True, verbose_name='用户名')
    action = models.CharField(max_length=50, choices=ACTION_CHOICES, verbose_name='操作类型')
    model_name = models.CharField(max_length=100, blank=True, null=True, verbose_name='模型名称')
    object_id = models.CharField(max_length=100, blank=True, null=True, verbose_name='对象ID')
    object_repr = models.CharField(max_length=255, blank=True, null=True, verbose_name='对象描述')
    ip_address = models.GenericIPAddressField(blank=True, null=True, verbose_name='IP地址')
    user_agent = models.TextField(blank=True, null=True, verbose_name='用户代理')
    path = models.CharField(max_length=255, blank=True, null=True, verbose_name='请求路径')
    method = models.CharField(max_length=10, blank=True, null=True, verbose_name='请求方法')
    message = models.TextField(verbose_name='操作描述')
    old_values = models.JSONField(blank=True, null=True, verbose_name='变更前数据')
    new_values = models.JSONField(blank=True, null=True, verbose_name='变更后数据')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='操作时间')

    class Meta:
        db_table = 'audit_log'
        verbose_name = '审计日志'
        verbose_name_plural = verbose_name
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['-created_at']),
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['model_name', 'object_id']),
        ]

    def __str__(self):
        return f'{self.username} - {self.get_action_display()} - {self.created_at.strftime("%Y-%m-%d %H:%M:%S")}'

    def save(self, *args, **kwargs):
        if self.user and not self.username:
            self.username = self.user.username
        super().save(*args, **kwargs)
