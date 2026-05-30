from django.db import models
from django.utils import timezone
from apps.common.models import BaseModel


class BookStatus(models.TextChoices):
    AVAILABLE = 'available', '可借阅'
    BORROWED = 'borrowed', '已借出'
    RESERVED = 'reserved', '已预约'
    LOST = 'lost', '丢失'
    DAMAGED = 'damaged', '损坏'
    MAINTENANCE = 'maintenance', '维护中'


class BorrowStatus(models.TextChoices):
    BORROWED = 'borrowed', '借阅中'
    RETURNED = 'returned', '已归还'
    OVERDUE = 'overdue', '已逾期'
    LOST = 'lost', '已丢失'
    RENEWED = 'renewed', '已续借'


class BookCategory(BaseModel):
    name = models.CharField(max_length=100, verbose_name='分类名称')
    code = models.CharField(max_length=50, unique=True, verbose_name='分类编号')
    parent = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='children', verbose_name='父分类')
    description = models.TextField(blank=True, verbose_name='描述')

    class Meta:
        db_table = 'book_categories'
        verbose_name = '图书分类'
        verbose_name_plural = verbose_name

    def __str__(self):
        return f'{self.code} - {self.name}'


class Book(BaseModel):
    venue = models.ForeignKey('venues.Venue', on_delete=models.CASCADE, related_name='books', verbose_name='所属场馆')
    category = models.ForeignKey(BookCategory, on_delete=models.SET_NULL, null=True, blank=True, related_name='books', verbose_name='图书分类')
    isbn = models.CharField(max_length=50, blank=True, verbose_name='ISBN')
    title = models.CharField(max_length=200, verbose_name='书名')
    author = models.CharField(max_length=100, blank=True, verbose_name='作者')
    publisher = models.CharField(max_length=100, blank=True, verbose_name='出版社')
    publish_date = models.DateField(null=True, blank=True, verbose_name='出版日期')
    barcode = models.CharField(max_length=50, unique=True, verbose_name='条码号')
    status = models.CharField(max_length=20, choices=BookStatus.choices, default=BookStatus.AVAILABLE, verbose_name='状态')
    location = models.CharField(max_length=100, blank=True, verbose_name='馆藏位置')
    price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name='价格')
    total_copies = models.IntegerField(default=1, verbose_name='总册数')
    available_copies = models.IntegerField(default=1, verbose_name='可借册数')
    cover_image = models.ImageField(upload_to='books/', null=True, blank=True, verbose_name='封面图片')
    description = models.TextField(blank=True, verbose_name='简介')

    class Meta:
        db_table = 'books'
        verbose_name = '图书'
        verbose_name_plural = verbose_name
        ordering = ['barcode']

    def __str__(self):
        return f'{self.barcode} - {self.title}'


class BorrowRecord(BaseModel):
    venue = models.ForeignKey('venues.Venue', on_delete=models.CASCADE, related_name='borrow_records', verbose_name='所属场馆')
    book = models.ForeignKey(Book, on_delete=models.CASCADE, related_name='borrow_records', verbose_name='图书')
    borrower = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='borrow_records', verbose_name='借阅人')
    operator = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True, related_name='operated_borrows', verbose_name='经办人')
    status = models.CharField(max_length=20, choices=BorrowStatus.choices, default=BorrowStatus.BORROWED, verbose_name='状态')
    borrow_date = models.DateTimeField(default=timezone.now, verbose_name='借阅日期')
    due_date = models.DateTimeField(verbose_name='应还日期')
    return_date = models.DateTimeField(null=True, blank=True, verbose_name='实际归还日期')
    renew_count = models.IntegerField(default=0, verbose_name='续借次数')
    is_overdue = models.BooleanField(default=False, verbose_name='是否逾期')
    overdue_days = models.IntegerField(default=0, verbose_name='逾期天数')
    overdue_fine = models.DecimalField(max_digits=10, decimal_places=2, default=0, verbose_name='逾期罚款')
    remarks = models.TextField(blank=True, verbose_name='备注')

    class Meta:
        db_table = 'borrow_records'
        verbose_name = '借阅记录'
        verbose_name_plural = verbose_name
        ordering = ['-borrow_date']

    def __str__(self):
        return f'{self.borrower.username} - {self.book.title}'

    def calculate_overdue(self):
        if self.status in [BorrowStatus.BORROWED, BorrowStatus.RENEWED]:
            now = timezone.now()
            if now > self.due_date:
                self.is_overdue = True
                self.overdue_days = (now - self.due_date).days
                self.status = BorrowStatus.OVERDUE
                self.overdue_fine = self.overdue_days * 0.5
                self.save()
        return self.is_overdue


class BorrowConfig(BaseModel):
    venue = models.OneToOneField('venues.Venue', on_delete=models.CASCADE, related_name='borrow_config', verbose_name='所属场馆')
    max_borrow_days = models.IntegerField(default=30, verbose_name='最长借阅天数')
    max_renew_count = models.IntegerField(default=2, verbose_name='最大续借次数')
    max_borrow_books = models.IntegerField(default=10, verbose_name='最大借阅数量')
    overdue_fine_per_day = models.DecimalField(max_digits=5, decimal_places=2, default=0.5, verbose_name='每日逾期罚款')

    class Meta:
        db_table = 'borrow_configs'
        verbose_name = '借阅配置'
        verbose_name_plural = verbose_name

    def __str__(self):
        return f'{self.venue.name} - 借阅配置'
