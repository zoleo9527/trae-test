import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.audit.models import OverdueReminder, Notification
from apps.borrowing.models import BorrowRecord

print('=== 验证借阅归还自动关闭 ===')
borrow = BorrowRecord.objects.get(pk=3)
print(f'借阅状态: {borrow.status}')

reminders = OverdueReminder.objects.filter(type='borrow', related_object_id='3')
print(f'相关逾期提醒数: {reminders.count()}')
for r in reminders:
    print(f'  ID={r.id}, handled={r.is_handled}, days={r.overdue_days}, message={r.message[:50]}...')

notifications = Notification.objects.filter(module='borrow', object_id='3')
print(f'相关通知数: {notifications.count()}')
for n in notifications:
    print(f'  ID={n.id}, read={n.is_read}, content={n.content[:50]}...')

print('\n=== 测试巡检审核自动关闭 ===')
import requests

BASE_URL = 'http://localhost:8001'
def get_token(username, password):
    r = requests.post(f'{BASE_URL}/api/token/', json={'username': username, 'password': password})
    return r.json()['access']

manager_token = get_token('manager', 'manager123')
headers = {'Authorization': f'Bearer {manager_token}'}

# 巡检ID=8是submitted状态
inspection_id = 8
print(f'巡检ID={inspection_id} 审核前:')
reminders_before = OverdueReminder.objects.filter(type='inspection', related_object_id=str(inspection_id), is_handled=False).count()
print(f'  未处理提醒: {reminders_before}')

r = requests.post(f'{BASE_URL}/api/inspections/{inspection_id}/approve/', headers=headers, json={'comments': '测试通过'})
print(f'POST /api/inspections/{inspection_id}/approve/: {r.status_code}')

if r.status_code == 200:
    reminders_after = OverdueReminder.objects.filter(type='inspection', related_object_id=str(inspection_id), is_handled=False).count()
    handled = OverdueReminder.objects.filter(type='inspection', related_object_id=str(inspection_id), is_handled=True).count()
    print(f'  审核后未处理提醒: {reminders_after}')
    print(f'  已处理提醒: {handled}')
    print(f'  ✅ 自动关闭: {"是" if reminders_before > 0 and reminders_after == 0 else "否"}')

print('\n=== 测试工单确认自动关闭 ===')
# 报修ID=5
repair_id = 5
print(f'报修ID={repair_id} 确认前:')
reminders_before = OverdueReminder.objects.filter(type='repair', related_object_id=str(repair_id), is_handled=False).count()
print(f'  未处理提醒: {reminders_before}')

# 先complete_repair
maintenance_token = get_token('maintenance', 'maintenance123')
headers_m = {'Authorization': f'Bearer {maintenance_token}'}
r1 = requests.post(f'{BASE_URL}/api/repairs/{repair_id}/complete_repair/', headers=headers_m, json={'solution': '已修复'})
print(f'POST /api/repairs/{repair_id}/complete_repair/: {r1.status_code}')

if r1.status_code == 200:
    reader_token = get_token('reader', 'reader123')
    headers_r = {'Authorization': f'Bearer {reader_token}'}
    r2 = requests.post(f'{BASE_URL}/api/repairs/{repair_id}/confirm/', headers=headers_r, json={'rating': 5, 'comments': '满意'})
    print(f'POST /api/repairs/{repair_id}/confirm/: {r2.status_code}')

    if r2.status_code == 200:
        reminders_after = OverdueReminder.objects.filter(type='repair', related_object_id=str(repair_id), is_handled=False).count()
        handled = OverdueReminder.objects.filter(type='repair', related_object_id=str(repair_id), is_handled=True).count()
        print(f'  确认后未处理提醒: {reminders_after}')
        print(f'  已处理提醒: {handled}')
        print(f'  ✅ 自动关闭: {"是" if reminders_before > 0 and reminders_after == 0 else "否"}')

print('\n=== 最终状态 ===')
print(f'未处理逾期提醒: {OverdueReminder.objects.filter(is_handled=False).count()}')
print(f'已处理逾期提醒: {OverdueReminder.objects.filter(is_handled=True).count()}')
print(f'未读通知: {Notification.objects.filter(is_read=False).count()}')
print(f'已读通知: {Notification.objects.filter(is_read=True).count()}')
