from django.db import models
from apps.common.models import BaseModel


class VenueStatus(models.TextChoices):
    OPEN = 'open', '营业中'
    CLOSED = 'closed', '已关闭'
    MAINTENANCE = 'maintenance', '维护中'


class Venue(BaseModel):
    name = models.CharField(max_length=100, verbose_name='场馆名称')
    code = models.CharField(max_length=50, unique=True, verbose_name='场馆编号')
    address = models.CharField(max_length=200, verbose_name='地址')
    manager = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='managed_venues',
        verbose_name='场馆经理'
    )
    phone = models.CharField(max_length=20, blank=True, verbose_name='联系电话')
    open_time = models.TimeField(null=True, blank=True, verbose_name='开门时间')
    close_time = models.TimeField(null=True, blank=True, verbose_name='关门时间')
    status = models.CharField(
        max_length=20,
        choices=VenueStatus.choices,
        default=VenueStatus.OPEN,
        verbose_name='状态'
    )
    description = models.TextField(blank=True, verbose_name='描述')
    area = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name='面积(㎡)')
    seat_count = models.IntegerField(default=0, verbose_name='座位数')

    class Meta:
        db_table = 'venues'
        verbose_name = '场馆'
        verbose_name_plural = verbose_name
        ordering = ['code']

    def __str__(self):
        return f'{self.code} - {self.name}'


class VenueArea(BaseModel):
    venue = models.ForeignKey(Venue, on_delete=models.CASCADE, related_name='areas', verbose_name='所属场馆')
    name = models.CharField(max_length=100, verbose_name='区域名称')
    code = models.CharField(max_length=50, verbose_name='区域编号')
    description = models.TextField(blank=True, verbose_name='描述')

    class Meta:
        db_table = 'venue_areas'
        verbose_name = '场馆区域'
        verbose_name_plural = verbose_name
        unique_together = ('venue', 'code')

    def __str__(self):
        return f'{self.venue.name} - {self.name}'
