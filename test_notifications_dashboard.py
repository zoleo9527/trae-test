#!/usr/bin/env python
import requests
import json

BASE_URL = 'http://localhost:8001'

def get_token(username, password):
    r = requests.post(f'{BASE_URL}/api/token/', 
        json={'username': username, 'password': password})
    return r.json()['access']

def test_api(name, token, url, method='GET', data=None, expected_status=None):
    headers = {'Authorization': f'Bearer {token}'}
    if method == 'GET':
        r = requests.get(f'{BASE_URL}{url}', headers=headers)
    else:
        r = requests.post(f'{BASE_URL}{url}', headers=headers, json=data or {})
    
    status = r.status_code
    result = 'PASS' if expected_status is None or status == expected_status else 'FAIL'
    if expected_status:
        print(f'  [{result}] {name}: {status} (expected {expected_status})')
    else:
        print(f'  {name}: {status}')
        try:
            data = r.json()
            if isinstance(data, dict) and 'count' in data:
                print(f'    Count: {data.get("count")}')
            if isinstance(data, dict) and 'results' in data:
                print(f'    Items: {len(data.get("results", []))}')
        except:
            pass
    return r

print('=== 获取Token ===')
tokens = {
    'manager': get_token('manager', 'manager123'),
    'inspector': get_token('inspector', 'inspector123'),
    'maintenance': get_token('maintenance', 'maintenance123'),
    'reader': get_token('reader', 'reader123'),
}
print('  OK\n')

print('=== 1. 通知权限测试 ===')
print('\n读者(reader)查看自己的通知:')
test_api('GET /api/notifications/', tokens['reader'], '/api/notifications/', expected_status=200)

print('\n读者查看未读通知:')
r = test_api('GET /api/notifications/unread/', tokens['reader'], '/api/notifications/unread/', expected_status=200)

print('\n读者标记通知已读:')
r = test_api('GET list', tokens['reader'], '/api/notifications/')
notif_id = None
try:
    results = r.json().get('results', [])
    if results:
        notif_id = results[0]['id']
        print(f'  找到通知 ID={notif_id}')
        test_api(f'POST /api/notifications/{notif_id}/mark_read/', tokens['reader'], 
            f'/api/notifications/{notif_id}/mark_read/', method='POST', expected_status=200)
except Exception as e:
    print(f'  Error: {e}')

print('\n读者尝试修改通知 (预期403):')
if notif_id:
    test_api(f'PUT /api/notifications/{notif_id}/', tokens['reader'], 
        f'/api/notifications/{notif_id}/', method='POST', 
        data={'title': 'hacked'}, expected_status=403)

print('\n巡检员查看自己的通知:')
r = test_api('GET /api/notifications/', tokens['inspector'], '/api/notifications/', expected_status=200)
try:
    count = len(r.json().get('results', []))
    print(f'  可见通知数: {count}')
except:
    pass

print('\n经理查看所有通知:')
r = test_api('GET /api/notifications/', tokens['manager'], '/api/notifications/', expected_status=200)
try:
    count = len(r.json().get('results', []))
    print(f'  可见通知数: {count}')
except:
    pass

print('\n=== 2. 逾期提醒权限测试 ===')
print('\n维修员查看自己的逾期提醒:')
r = test_api('GET /api/overdue-reminders/', tokens['maintenance'], '/api/overdue-reminders/', expected_status=200)
try:
    count = len(r.json().get('results', []))
    print(f'  可见提醒数: {count}')
    for item in r.json().get('results', [])[:3]:
        print(f'    - [{item["type"]}] {item["related_object_repr"]} (逾期{item["overdue_days"]}天)')
except Exception as e:
    print(f'  Error: {e}')

print('\n读者查看自己的逾期提醒:')
r = test_api('GET /api/overdue-reminders/', tokens['reader'], '/api/overdue-reminders/', expected_status=200)
try:
    count = len(r.json().get('results', []))
    print(f'  可见提醒数: {count}')
    for item in r.json().get('results', []):
        print(f'    - [{item["type"]}] {item["related_object_repr"]} (逾期{item["overdue_days"]}天)')
except Exception as e:
    print(f'  Error: {e}')

print('\n=== 3. Dashboard测试 ===')
print('\n经理Dashboard:')
r = test_api('GET /api/dashboard/', tokens['manager'], '/api/dashboard/')
try:
    data = r.json()
    print(f'  巡检统计: {data.get("inspection_stats")}')
    print(f'  报修统计: {data.get("repair_stats")}')
    print(f'  通知统计: {data.get("notification_stats")}')
    print(f'  逾期统计: {data.get("overdue_stats")}')
    print(f'  待处理项数: {len(data.get("pending_items", []))}')
    print(f'  我的任务数: {len(data.get("my_tasks", []))}')
    print('  前5个待处理项:')
    for item in data.get('pending_items', [])[:5]:
        urgent = ' ⚠️' if item.get('is_urgent') else ''
        print(f'    - [{item["type"]}] {item["title"]} - {item["status_display"]}{urgent}')
except Exception as e:
    print(f'  Error: {e}')
    import traceback; traceback.print_exc()

print('\n维修员Dashboard:')
r = test_api('GET /api/dashboard/', tokens['maintenance'], '/api/dashboard/')
try:
    data = r.json()
    print(f'  通知统计: {data.get("notification_stats")}')
    print(f'  逾期统计: {data.get("overdue_stats")}')
    print(f'  我的任务数: {len(data.get("my_tasks", []))}')
    print('  我的任务:')
    for item in data.get('my_tasks', []):
        urgent = ' ⚠️' if item.get('is_urgent') else ''
        print(f'    - [{item["type"]}] {item["title"]} - {item["status_display"]}{urgent}')
except Exception as e:
    print(f'  Error: {e}')

print('\n读者Dashboard:')
r = test_api('GET /api/dashboard/', tokens['reader'], '/api/dashboard/')
try:
    data = r.json()
    print(f'  通知统计: {data.get("notification_stats")}')
    print(f'  逾期统计: {data.get("overdue_stats")}')
    print(f'  我的任务数: {len(data.get("my_tasks", []))}')
    for item in data.get('my_tasks', []):
        print(f'    - [{item["type"]}] {item["title"]} - {item["status_display"]}')
except Exception as e:
    print(f'  Error: {e}')

print('\n✅ 测试完成!')
