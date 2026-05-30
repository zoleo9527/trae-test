#!/usr/bin/env python
import os
import django
from datetime import timedelta

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.utils import timezone
from apps.borrowing.models import BorrowRecord, BorrowStatus, Book
from apps.inspections.models import InspectionRecord, InspectionStatus
from apps.repairs.models import RepairTicket, RepairStatus
from apps.users.models import User
from apps.venues.models import Venue

venue1 = Venue.objects.get(pk=1)
manager = User.objects.get(username='manager')
inspector = User.objects.get(username='inspector')
maintenance = User.objects.get(username='maintenance')
reader = User.objects.get(username='reader')
volunteer = User.objects.get(username='volunteer')

book = Book.objects.filter(venue=venue1).first()
if not book:
    from apps.borrowing.models import BookCategory
    cat = BookCategory.objects.first()
    if not cat:
        cat = BookCategory.objects.create(name='测试分类', code='TEST001')
    book = Book.objects.create(
        venue=venue1, category=cat, isbn='9781234567890',
        title='测试图书', author='测试作者', barcode='TEST0001',
        status='borrowed', location='A区'
    )

now = timezone.now()

print('=== 创建逾期测试数据 ===')

print('\n1. 创建逾期借阅记录:')
borrow = BorrowRecord.objects.create(
    venue=venue1, book=book, borrower=reader, operator=manager,
    status=BorrowStatus.BORROWED,
    borrow_date=now - timedelta(days=40),
    due_date=now - timedelta(days=10),
)
print(f'   创建: {borrow} (逾期{borrow.calculate_overdue()}天)')

print('\n2. 创建逾期巡检记录:')
inspection_draft = InspectionRecord.objects.create(
    venue=venue1, inspector=inspector, type='daily',
    title='逾期草稿巡检', status=InspectionStatus.DRAFT,
    created_at=now - timedelta(days=5),
)
print(f'   创建: {inspection_draft} (草稿, 创建{5}天前)')

inspection_submitted = InspectionRecord.objects.create(
    venue=venue1, inspector=inspector, type='daily',
    title='逾期待审核巡检', status=InspectionStatus.SUBMITTED,
    created_at=now - timedelta(days=5),
)
print(f'   创建: {inspection_submitted} (待审核, 创建{5}天前)')

inspection_needs_review = InspectionRecord.objects.create(
    venue=venue1, inspector=inspector, type='daily',
    title='逾期需回查巡检', status=InspectionStatus.NEEDS_REVIEW,
    created_at=now - timedelta(days=5),
    needs_review_reason='需要复查设备',
)
print(f'   创建: {inspection_needs_review} (需回查, 创建{5}天前)')

print('\n3. 创建逾期报修记录:')
repair_pending = RepairTicket.objects.create(
    venue=venue1, reporter=inspector, title='逾期待派单报修',
    description='空调不制冷', category='electrical', priority='high',
    status=RepairStatus.PENDING,
    created_at=now - timedelta(days=5),
)
print(f'   创建: {repair_pending} (待派单, 创建{5}天前)')

repair_assigned = RepairTicket.objects.create(
    venue=venue1, reporter=reader, assignee=maintenance,
    title='逾期待处理报修', description='门禁故障',
    category='electrical', priority='urgent',
    status=RepairStatus.ASSIGNED,
    assigned_time=now - timedelta(days=5),
    created_at=now - timedelta(days=6),
)
print(f'   创建: {repair_assigned} (已派单, 创建{6}天前)')

repair_in_progress = RepairTicket.objects.create(
    venue=venue1, reporter=volunteer, assignee=maintenance,
    title='逾期处理中报修', description='灯光闪烁',
    category='electrical', priority='medium',
    status=RepairStatus.IN_PROGRESS,
    start_time=now - timedelta(days=5),
    created_at=now - timedelta(days=7),
)
print(f'   创建: {repair_in_progress} (处理中, 创建{7}天前)')

print('\n=== 测试数据创建完成 ===')
print('现在运行: python manage.py check_overdue')
