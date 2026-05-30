import os
import django
import requests
from datetime import timedelta

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.utils import timezone
from apps.borrowing.models import BorrowRecord, BorrowStatus, Book, BookCategory
from apps.inspections.models import InspectionRecord, InspectionStatus
from apps.repairs.models import RepairTicket, RepairStatus
from apps.users.models import User
from apps.venues.models import Venue
from apps.audit.models import OverdueReminder, Notification

now = timezone.now()
venue1 = Venue.objects.get(pk=1)
manager = User.objects.get(username='manager')
inspector = User.objects.get(username='inspector')
maintenance = User.objects.get(username='maintenance')
reader = User.objects.get(username='reader')

BASE_URL = 'http://localhost:8001'

def get_token(username, password):
    r = requests.post(f'{BASE_URL}/api/token/', json={'username': username, 'password': password})
    return r.json()['access']

manager_token = get_token('manager', 'manager123')
maintenance_token = get_token('maintenance', 'maintenance123')
reader_token = get_token('reader', 'reader123')

print('=' * 70)
print('🧪 逾期提醒自动化链路 - 完整测试')
print('=' * 70)

print('\n📋 步骤1: 清理并创建测试数据')
OverdueReminder.objects.all().delete()
Notification.objects.all().delete()
BorrowRecord.objects.filter(status__in=['borrowed', 'overdue', 'returned']).delete()
InspectionRecord.objects.filter(status__in=['draft', 'submitted', 'needs_review', 'approved']).delete()
RepairTicket.objects.filter(status__in=['pending', 'assigned', 'in_progress', 'completed']).delete()

# 借阅
cat = BookCategory.objects.first()
book = Book.objects.filter(venue=venue1).first()
borrow = BorrowRecord.objects.create(
    venue=venue1, book=book, borrower=reader, operator=manager,
    status=BorrowStatus.OVERDUE,
    borrow_date=now - timedelta(days=40),
    due_date=now - timedelta(days=10),
)
print(f'  ✅ 借阅: {borrow.book.title} (逾期10天, ID={borrow.pk})')

# 巡检 - 先创建再update时间，绕过auto_now_add
ins1 = InspectionRecord.objects.create(
    venue=venue1, inspector=inspector, type='daily',
    title='逾期待审核巡检', status=InspectionStatus.SUBMITTED,
)
ins2 = InspectionRecord.objects.create(
    venue=venue1, inspector=inspector, type='daily',
    title='逾期需回查巡检', status=InspectionStatus.NEEDS_REVIEW,
    needs_review_reason='复查设备',
)
InspectionRecord.objects.filter(pk=ins1.pk).update(
    created_at=now - timedelta(days=5),
    updated_at=now - timedelta(days=5),
)
InspectionRecord.objects.filter(pk=ins2.pk).update(
    created_at=now - timedelta(days=10),
    updated_at=now - timedelta(days=5),
)
ins1 = InspectionRecord.objects.get(pk=ins1.pk)
ins2 = InspectionRecord.objects.get(pk=ins2.pk)
print(f'  ✅ 巡检1: {ins1.title} (待审核, ID={ins1.pk})')
print(f'  ✅ 巡检2: {ins2.title} (需回查, ID={ins2.pk})')

# 报修 - 先创建再update时间，绕过auto_now_add
repair = RepairTicket.objects.create(
    venue=venue1, reporter=reader, assignee=maintenance,
    title='逾期处理中报修', description='空调故障',
    category='electrical', priority='high',
    status=RepairStatus.IN_PROGRESS,
)
RepairTicket.objects.filter(pk=repair.pk).update(
    created_at=now - timedelta(days=8),
    start_time=now - timedelta(days=5),
)
repair = RepairTicket.objects.get(pk=repair.pk)
print(f'  ✅ 报修: {repair.ticket_no} (处理中, ID={repair.pk})')

print(f'\n  测试数据创建完成，当前提醒: {OverdueReminder.objects.count()}')

print('\n🔄 步骤2: API扫描逾期')
headers = {'Authorization': f'Bearer {manager_token}'}
r = requests.post(f'{BASE_URL}/api/scan-overdue/', headers=headers, json={})
print(f'  POST /api/scan-overdue/: {r.status_code}')
if r.status_code == 200:
    data = r.json()
    print(f'  ✅ 新增: {data.get("created")}, 更新: {data.get("updated")}')
    print(f'  ✅ 触发方式: {data.get("summary", {}).get("trigger_type")}')

print(f'\n  扫描后提醒: {OverdueReminder.objects.filter(is_handled=False).count()}')
print(f'  扫描后通知: {Notification.objects.filter(is_read=False).count()}')

print('\n📈 步骤3: 逾期汇总')
r = requests.get(f'{BASE_URL}/api/overdue-summary/', headers=headers)
print(f'  GET /api/overdue-summary/: {r.status_code}')
if r.status_code == 200:
    data = r.json()
    print(f'  ✅ 总逾期: {data.get("total")}')
    print(f'  ✅ 按类型: {data.get("by_type")}')

print('\n📋 步骤4: 借阅归还自动关闭提醒')
rem_before = OverdueReminder.objects.filter(type='borrow', related_object_id=str(borrow.pk), is_handled=False).count()
notif_before = Notification.objects.filter(module='borrow', object_id=str(borrow.pk), is_read=False).count()
print(f'  归还前未处理提醒: {rem_before}, 未读通知: {notif_before}')

r = requests.post(f'{BASE_URL}/api/borrows/{borrow.pk}/return_book/', headers=headers)
print(f'  POST /api/borrows/{borrow.pk}/return_book/: {r.status_code}')

if r.status_code == 200:
    rem_after = OverdueReminder.objects.filter(type='borrow', related_object_id=str(borrow.pk), is_handled=False).count()
    notif_after = Notification.objects.filter(module='borrow', object_id=str(borrow.pk), is_read=False).count()
    rem_handled = OverdueReminder.objects.filter(type='borrow', related_object_id=str(borrow.pk), is_handled=True).count()
    print(f'  归还后未处理提醒: {rem_after}, 已处理: {rem_handled}, 未读通知: {notif_after}')
    print(f'  ✅ 自动关闭提醒: {"通过" if rem_before > 0 and rem_after == 0 else "失败"}')

print('\n✅ 步骤5: 巡检审核自动关闭提醒')
rem_before = OverdueReminder.objects.filter(type='inspection', related_object_id=str(ins1.pk), is_handled=False).count()
print(f'  审核前未处理提醒: {rem_before}')

r = requests.post(f'{BASE_URL}/api/inspections/{ins1.pk}/approve/', headers=headers, json={'comments': '审核通过'})
print(f'  POST /api/inspections/{ins1.pk}/approve/: {r.status_code}')

if r.status_code == 200:
    rem_after = OverdueReminder.objects.filter(type='inspection', related_object_id=str(ins1.pk), is_handled=False).count()
    rem_handled = OverdueReminder.objects.filter(type='inspection', related_object_id=str(ins1.pk), is_handled=True).count()
    print(f'  审核后未处理提醒: {rem_after}, 已处理: {rem_handled}')
    print(f'  ✅ 自动关闭提醒: {"通过" if rem_before > 0 and rem_after == 0 else "失败"}')

print('\n🔧 步骤6: 工单确认自动关闭提醒')
rem_before = OverdueReminder.objects.filter(type='repair', related_object_id=str(repair.pk), is_handled=False).count()
print(f'  确认前未处理提醒: {rem_before}')

headers_m = {'Authorization': f'Bearer {maintenance_token}'}
r1 = requests.post(f'{BASE_URL}/api/repairs/{repair.pk}/complete/', headers=headers_m, json={'solution': '已修复'})
print(f'  POST /api/repairs/{repair.pk}/complete/: {r1.status_code}')

if r1.status_code == 200:
    headers_r = {'Authorization': f'Bearer {reader_token}'}
    r2 = requests.post(f'{BASE_URL}/api/repairs/{repair.pk}/confirm/', headers=headers_r, json={'rating': 5, 'comments': '满意'})
    print(f'  POST /api/repairs/{repair.pk}/confirm/: {r2.status_code}')

    if r2.status_code == 200:
        rem_after = OverdueReminder.objects.filter(type='repair', related_object_id=str(repair.pk), is_handled=False).count()
        rem_handled = OverdueReminder.objects.filter(type='repair', related_object_id=str(repair.pk), is_handled=True).count()
        print(f'  确认后未处理提醒: {rem_after}, 已处理: {rem_handled}')
        print(f'  ✅ 自动关闭提醒: {"通过" if rem_before > 0 and rem_after == 0 else "失败"}')

print('\n📊 最终状态:')
print(f'  未处理逾期提醒: {OverdueReminder.objects.filter(is_handled=False).count()}')
print(f'  已处理逾期提醒: {OverdueReminder.objects.filter(is_handled=True).count()}')
print(f'  未读通知: {Notification.objects.filter(is_read=False).count()}')
print(f'  已读通知: {Notification.objects.filter(is_read=True).count()}')

print('\n' + '=' * 70)
print('✅ 自动化链路测试完成')
print('=' * 70)
