import os
import django
from datetime import timedelta

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.utils import timezone
from apps.borrowing.models import BorrowRecord, BorrowStatus, Book, BookCategory
from apps.inspections.models import InspectionRecord, InspectionStatus
from apps.repairs.models import RepairTicket, RepairStatus
from apps.users.models import User
from apps.venues.models import Venue

now = timezone.now()
venue1 = Venue.objects.get(pk=1)
manager = User.objects.get(username='manager')
inspector = User.objects.get(username='inspector')
maintenance = User.objects.get(username='maintenance')
reader = User.objects.get(username='reader')

print('=== 创建逾期测试数据 ===')

cat = BookCategory.objects.first()
if not cat:
    cat = BookCategory.objects.create(name='测试', code='TEST')
book = Book.objects.filter(venue=venue1).first()
if not book:
    book = Book.objects.create(venue=venue1, category=cat, isbn='123', title='测试图书', author='测试', barcode='B001', status='borrowed', location='A')

BorrowRecord.objects.filter(status__in=['borrowed', 'overdue']).delete()
borrow = BorrowRecord.objects.create(
    venue=venue1, book=book, borrower=reader, operator=manager,
    status=BorrowStatus.OVERDUE,
    borrow_date=now - timedelta(days=40),
    due_date=now - timedelta(days=10),
)
print(f'借阅: {borrow} (逾期10天)')

InspectionRecord.objects.filter(status__in=['draft', 'submitted', 'needs_review']).delete()
ins_sub = InspectionRecord.objects.create(
    venue=venue1, inspector=inspector, type='daily',
    title='逾期待审核巡检', status=InspectionStatus.SUBMITTED,
    created_at=now - timedelta(days=5),
    updated_at=now - timedelta(days=5),
)
print(f'巡检: {ins_sub.title} (待审核, 逾期5天)')

ins_review = InspectionRecord.objects.create(
    venue=venue1, inspector=inspector, type='daily',
    title='逾期需回查巡检', status=InspectionStatus.NEEDS_REVIEW,
    created_at=now - timedelta(days=10),
    updated_at=now - timedelta(days=5),
    needs_review_reason='复查',
)
print(f'巡检: {ins_review.title} (需回查, 逾期5天)')

RepairTicket.objects.filter(status__in=['pending', 'assigned', 'in_progress']).delete()
repair_prog = RepairTicket.objects.create(
    venue=venue1, reporter=reader, assignee=maintenance,
    title='逾期处理中报修', description='测试',
    category='electrical', priority='high',
    status=RepairStatus.IN_PROGRESS,
    start_time=now - timedelta(days=5),
    created_at=now - timedelta(days=8),
)
print(f'报修: {repair_prog.ticket_no} (处理中, 逾期5天)')

print('\n数据创建完成!')
