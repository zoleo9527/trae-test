import os
import django
from datetime import timedelta
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.utils import timezone
from apps.inspections.models import InspectionRecord
from apps.repairs.models import RepairTicket
from apps.borrowing.models import BorrowRecord
from apps.audit.models import OverdueReminder, Notification

now = timezone.now()
print(f'当前时间: {now}')

# 清理旧的提醒和通知
OverdueReminder.objects.all().delete()
Notification.objects.all().delete()
print('已清理旧提醒和通知')

# 直接用update修改时间，绕过auto_now_add
InspectionRecord.objects.filter(title='逾期待审核巡检').update(
    created_at=now - timedelta(days=5),
    updated_at=now - timedelta(days=5),
)
InspectionRecord.objects.filter(title='逾期需回查巡检').update(
    created_at=now - timedelta(days=10),
    updated_at=now - timedelta(days=5),
)

RepairTicket.objects.filter(title='逾期处理中报修').update(
    created_at=now - timedelta(days=8),
    start_time=now - timedelta(days=5),
    updated_at=now - timedelta(days=5),
)

BorrowRecord.objects.filter(book__title='测试图书', status='overdue').update(
    borrow_date=now - timedelta(days=40),
    due_date=now - timedelta(days=10),
)

print('时间已更新!')

# 验证
print('\n巡检:')
for insp in InspectionRecord.objects.filter(status__in=['submitted', 'needs_review']):
    days = (now - insp.updated_at).days
    print(f'  {insp.title}: created={insp.created_at}, updated={insp.updated_at}, days={days}')

print('\n报修:')
for r in RepairTicket.objects.filter(status='in_progress'):
    days = (now - r.start_time).days
    print(f'  {r.title}: start={r.start_time}, days={days}')

print('\n借阅:')
for b in BorrowRecord.objects.filter(status='overdue'):
    days = (now - b.due_date).days
    print(f'  {b.book.title}: due={b.due_date}, days={days}')
