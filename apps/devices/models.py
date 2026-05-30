from django.db import models
from apps.common.models import BaseModel


class DeviceCategory(models.TextChoices):
    AIR_CONDITIONER = 'air_conditioner', '空调'
    LIGHTING = 'lighting', '照明'
    COMPUTER = 'computer', '电脑'
    PRINTER = 'printer', '打印机'
    SCANNER = 'scanner', '扫描仪'
    SECURITY = 'security', '安防设备'
    FURNITURE = 'furniture', '家具'
    OTHER = 'other', '其他'


class DeviceStatus(models.TextChoices):
    NORMAL = 'normal', '正常'
    WARNING = 'warning', '异常'
    FAULTY = 'faulty', '故障'
    REPAIRING = 'repairing', '维修中'
    SCRAPPED = 'scrapped', '已报废'


class Device(BaseModel):
    venue = models.ForeignKey('venues.Venue', on_delete=models.CASCADE, related_name='devices', verbose_name='所属场馆')
    area = models.ForeignKey(
        'venues.VenueArea',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='devices',
        verbose_name='所属区域'
    )
    name = models.CharField(max_length=100, verbose_name='设备名称')
    code = models.CharField(max_length=50, unique=True, verbose_name='设备编号')
    category = models.CharField(
        max_length=30,
        choices=DeviceCategory.choices,
        default=DeviceCategory.OTHER,
        verbose_name='设备分类'
    )
    brand = models.CharField(max_length=100, blank=True, verbose_name='品牌')
    model = models.CharField(max_length=100, blank=True, verbose_name='型号')
    purchase_date = models.DateField(null=True, blank=True, verbose_name='采购日期')
    warranty_expire = models.DateField(null=True, blank=True, verbose_name='保修截止')
    status = models.CharField(
        max_length=20,
        choices=DeviceStatus.choices,
        default=DeviceStatus.NORMAL,
        verbose_name='设备状态'
    )
    location = models.CharField(max_length=200, blank=True, verbose_name='具体位置')
    description = models.TextField(blank=True, verbose_name='设备描述')
    last_maintenance = models.DateField(null=True, blank=True, verbose_name='上次维护日期')
    next_maintenance = models.DateField(null=True, blank=True, verbose_name='下次维护日期')

    class Meta:
        db_table = 'devices'
        verbose_name = '设备'
        verbose_name_plural = verbose_name
        ordering = ['code']

    def __str__(self):
        return f'{self.code} - {self.name}'
