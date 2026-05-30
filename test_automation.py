#!/usr/bin/env python
import os
import django
import requests
from datetime import timedelta

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.utils import timezone
from apps.audit.models import OverdueReminder, Notification
from apps.borrowing.models import BorrowRecord, BorrowStatus
from apps.inspections.models import InspectionRecord, InspectionStatus
from apps.repairs.models import RepairTicket, RepairStatus
from apps.audit.services import OverdueReminderService
from apps.users.models import User

now = timezone.now()
manager = User.objects.get(username='manager')

print('=' * 60)
print('🧪 逾期提醒自动化链路测试')
print('=' * 60)

print('\n📊 测试前状态:')
print(f'  未处理逾期提醒: {OverdueReminder.objects.filter(is_handled=False).count()}')
print(f'  已处理逾期提醒: {OverdueReminder.objects.filter(is_handled=True).count()}')
print(f'  未读通知: {Notification.objects.filter(is_read=False).count()}')
print(f'  已读通知: {Notification.objects.filter(is_read=True).count()}')

print('\n🔄 测试1: API扫描逾期')
BASE_URL = 'http://localhost:8001'

def get_token(username, password):
    r = requests.post(f'{BASE_URL}/api/token/', 
        json={'username': username, 'password': password})
    return r.json()['access']

manager_token = get_token('manager', 'manager123')
print(f'  经理Token获取成功')

headers = {'Authorization': f'Bearer {manager_token}'}
r = requests.post(f'{BASE_URL}/api/scan-overdue/', headers=headers, json={'module': 'all'})
print(f'  POST /api/scan-overdue/: {r.status_code}')
if r.status_code == 200:
    data = r.json()
    print(f'    新增提醒: {data.get("created")}')
    print(f'    更新提醒: {data.get("updated")}')
    print(f'    触发方式: {data.get("summary", {}).get("trigger_type")}')

print('\n📈 测试2: 获取逾期汇总')
r = requests.get(f'{BASE_URL}/api/overdue-summary/', headers=headers)
print(f'  GET /api/overdue-summary/: {r.status_code}')
if r.status_code == 200:
    data = r.json()
    print(f'    总逾期: {data.get("total")}')
    print(f'    按类型: {data.get("by_type")}')
    print(f'    按天数: {data.get("by_days")}')

print('\n🔧 测试3: ViewSet扫描接口')
r = requests.post(f'{BASE_URL}/api/overdue-reminders/scan_all/', headers=headers, json={})
print(f'  POST /api/overdue-reminders/scan_all/: {r.status_code}')
if r.status_code == 200:
    data = r.json()
    print(f'    处理条数: {len(data.get("results", []))}')

print('\n📋 测试4: 借阅归还自动关闭提醒')
overdue_borrow = BorrowRecord.objects.filter(status=BorrowStatus.OVERDUE).first()
if overdue_borrow:
    print(f'  找到逾期借阅: {overdue_borrow.book.title} (ID={overdue_borrow.id})')
    reminder_before = OverdueReminder.objects.filter(
        type='borrow', related_object_id=str(overdue_borrow.id), is_handled=False
    ).count()
    print(f'  归还前未处理提醒: {reminder_before}')

    r = requests.post(f'{BASE_URL}/api/borrows/{overdue_borrow.id}/return_book/', headers=headers)
    print(f'  POST /api/borrows/{overdue_borrow.id}/return_book/: {r.status_code}')
    if r.status_code != 200:
        print(f'    Response: {r.text}')

    reminder_after = OverdueReminder.objects.filter(
        type='borrow', related_object_id=str(overdue_borrow.id), is_handled=False
    ).count()
    handled_count = OverdueReminder.objects.filter(
        type='borrow', related_object_id=str(overdue_borrow.id), is_handled=True
    ).count()
    print(f'  归还后未处理提醒: {reminder_after}')
    print(f'  已处理提醒: {handled_count}')
    print(f'  ✅ 自动关闭提醒: {"是" if reminder_before > 0 and reminder_after == 0 else "否"}')

print('\n✅ 测试5: 巡检完成自动关闭提醒')
overdue_inspection = InspectionRecord.objects.filter(
    status__in=[InspectionStatus.SUBMITTED, InspectionStatus.REVIEWING],
    is_overdue=True
).first()
if overdue_inspection:
    print(f'  找到逾期巡检: {overdue_inspection.title} (ID={overdue_inspection.id})')
    reminder_before = OverdueReminder.objects.filter(
        type='inspection', related_object_id=str(overdue_inspection.id), is_handled=False
    ).count()
    print(f'  审核前未处理提醒: {reminder_before}')

    r = requests.post(f'{BASE_URL}/api/inspections/{overdue_inspection.id}/approve/', 
        headers=headers, json={'comments': '测试通过'})
    print(f'  POST /api/inspections/{overdue_inspection.id}/approve/: {r.status_code}')

    if r.status_code == 200:
        reminder_after = OverdueReminder.objects.filter(
            type='inspection', related_object_id=str(overdue_inspection.id), is_handled=False
        ).count()
        print(f'  审核后未处理提醒: {reminder_after}')
        print(f'  ✅ 自动关闭提醒: {"是" if reminder_before > 0 and reminder_after == 0 else "否"}')

print('\n🔧 测试6: 工单确认自动关闭提醒')
overdue_repair = RepairTicket.objects.filter(
    status=RepairStatus.IN_PROGRESS,
    is_overdue=True
).first()
if overdue_repair:
    print(f'  找到逾期报修: {overdue_repair.ticket_no} - {overdue_repair.title} (ID={overdue_repair.id})')
    reminder_before = OverdueReminder.objects.filter(
        type='repair', related_object_id=str(overdue_repair.id), is_handled=False
    ).count()
    print(f'  确认前未处理提醒: {reminder_before}')

    maintenance_token = get_token('maintenance', 'maintenance123')
    headers_m = {'Authorization': f'Bearer {maintenance_token}'}
    r = requests.post(f'{BASE_URL}/api/repairs/{overdue_repair.id}/complete_repair/', 
        headers=headers_m, json={'solution': '已修复'})
    print(f'  POST /api/repairs/{overdue_repair.id}/complete_repair/: {r.status_code}')

    if r.status_code == 200:
        reader_token = get_token('reader', 'reader123')
        headers_r = {'Authorization': f'Bearer {reader_token}'}
        r2 = requests.post(f'{BASE_URL}/api/repairs/{overdue_repair.id}/confirm/', 
            headers=headers_r, json={'rating': 5, 'comments': '满意'})
        print(f'  POST /api/repairs/{overdue_repair.id}/confirm/: {r2.status_code}')

        if r2.status_code == 200:
            reminder_after = OverdueReminder.objects.filter(
                type='repair', related_object_id=str(overdue_repair.id), is_handled=False
            ).count()
            print(f'  确认后未处理提醒: {reminder_after}')
            print(f'  ✅ 自动关闭提醒: {"是" if reminder_before > 0 and reminder_after == 0 else "否"}')

print('\n📊 测试后状态:')
print(f'  未处理逾期提醒: {OverdueReminder.objects.filter(is_handled=False).count()}')
print(f'  已处理逾期提醒: {OverdueReminder.objects.filter(is_handled=True).count()}')
print(f'  未读通知: {Notification.objects.filter(is_read=False).count()}')
print(f'  已读通知: {Notification.objects.filter(is_read=True).count()}')

print('\n' + '=' * 60)
print('✅ 自动化链路测试完成')
print('=' * 60)
