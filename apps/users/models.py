from django.db import models
from django.contrib.auth.models import AbstractUser
from apps.common.models import BaseModel


class Role(models.TextChoices):
    ADMIN = 'admin', '系统管理员'
    MANAGER = 'manager', '场馆经理'
    INSPECTOR = 'inspector', '巡检人员'
    VOLUNTEER = 'volunteer', '志愿者'
    READER = 'reader', '读者'
    MAINTENANCE = 'maintenance', '维修人员'


class User(AbstractUser, BaseModel):
    phone = models.CharField(max_length=20, blank=True, verbose_name='手机号')
    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.READER,
        verbose_name='角色'
    )
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True, verbose_name='头像')

    class Meta:
        db_table = 'users'
        verbose_name = '用户'
        verbose_name_plural = verbose_name

    def __str__(self):
        return f'{self.username} - {self.get_role_display()}'


class UserVenue(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='venues', verbose_name='用户')
    venue = models.ForeignKey('venues.Venue', on_delete=models.CASCADE, related_name='users', verbose_name='场馆')
    is_default = models.BooleanField(default=False, verbose_name='是否默认')

    class Meta:
        db_table = 'user_venues'
        unique_together = ('user', 'venue')
        verbose_name = '用户场馆关联'
        verbose_name_plural = verbose_name

    def __str__(self):
        return f'{self.user} - {self.venue}'
