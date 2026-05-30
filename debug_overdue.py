import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.utils import timezone
from django.db.models import F
from apps.borrowing.models import BorrowRecord, BorrowStatus
from apps.inspections.models import InspectionRecord, InspectionStatus
from apps.repairs.models import RepairTicket, RepairStatus
from apps.audit.models import OverdueReminder, Notification
from apps.audit.services import OverdueReminderService
from datetime import timedelta

now = timezone.now()
print(f'当前时间: {now}')

print('\n=== 修改测试数据的created_at到更早时间 ===')

BorrowRecord.objects.filter(status=BorrowStatus.OVERDUE).update(
    due_date=now - timedelta(days=10)
)
print('借阅记录: due_date 设置为 10天前')

InspectionRecord.objects.filter(status=InspectionStatus.DRAFT).update(
    created_at=now - timedelta(days=5)
)
print('草稿巡检: created_at 设置为 5天前')

InspectionRecord.objects.filter(status=InspectionStatus.SUBMITTED).update(
    created_at=now - timedelta(days=5)
)
print('已提交巡检: created_at 设置为 5天前')

InspectionRecord.objects.filter(status=InspectionStatus.NEEDS_REVIEW).update(
    created_at=now - timedelta(days=5)
)
print('需回查巡检: created_at 设置为 5天前')

RepairTicket.objects.filter(status=RepairStatus.PENDING).update(
    created_at=now - timedelta(days=5)
)
print('待派单报修: created_at 设置为 5天前')

RepairTicket.objects.filter(status=RepairStatus.ASSIGNED).update(
    created_at=now - timedelta(days=6),
    assigned_time=now - timedelta(days=5)
)
print('已派单报修: created_at 设置为 6天前')

RepairTicket.objects.filter(status=RepairStatus.IN_PROGRESS).update(
    created_at=now - timedelta(days=7),
    start_time=now - timedelta(days=5)
)
print('处理中报修: created_at 设置为 7天前')

print('\n=== 1. 检查各模块数据 ===')
print('借阅:')
for b in BorrowRecord.objects.all():
    days = (now - b.due_date).days
    print(f'  {b.borrower.username}: status={b.status}, overdue={b.is_overdue}, days={days}')

print('巡检:')
for i in InspectionRecord.objects.filter(status__in=['draft', 'submitted', 'needs_review']):
    days = (now - i.created_at).days
    print(f'  {i.title}: status={i.status}, days={days}')

print('报修:')
for r in RepairTicket.objects.filter(status__in=['pending', 'assigned', 'in_progress']):
    days = (now - r.created_at).days
    print(f'  {r.ticket_no}: {r.title}, status={r.status}, days={days}')

print('\n=== 2. 运行全部检查 ===')
result = OverdueReminderService.check_all_overdue()
for k, v in result.items():
    print(f'  {k}: {len(v)} items')
    for action, item in v:
        print(f'    {action}: {item.related_object_repr} (逾期{item.overdue_days}天)')

print('\n=== 3. 生成的逾期提醒 ===')
reminders = OverdueReminder.objects.all()
print(f'总提醒数: {reminders.count()}')
for r in reminders:
    print(f'  [{r.type}] {r.related_object_repr} - 负责人:{r.assignee.username}, 逾期{r.overdue_days}天, 提醒{r.reminder_count}次')

print('\n=== 4. 生成的通知 ===')
notifications = Notification.objects.all()
print(f'总通知数: {notifications.count()}')
for n in notifications[:10]:
    print(f'  [{n.type}] {n.recipient.username}: {n.title} - {n.content[:50]}...')
