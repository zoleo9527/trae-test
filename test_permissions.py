#!/usr/bin/env python
import requests
import json

BASE_URL = 'http://localhost:8001'

def get_token(username, password):
    r = requests.post(f'{BASE_URL}/api/token/', 
        json={'username': username, 'password': password})
    return r.json()['access']

def test(test_name, token, method, url, data=None, expected_status=None):
    headers = {'Authorization': f'Bearer {token}'}
    if method == 'GET':
        r = requests.get(f'{BASE_URL}{url}', headers=headers)
    else:
        r = requests.post(f'{BASE_URL}{url}', headers=headers, json=data or {})
    
    status = r.status_code
    result = 'PASS' if expected_status is None or status == expected_status else 'FAIL'
    if expected_status:
        print(f'  [{result}] {test_name}: {status} (expected {expected_status})')
    else:
        print(f'  {test_name}: {status}')
        print(f'    Response: {r.json()}')
    return status

print('=== 获取Token ===')
tokens = {
    'admin': get_token('admin', 'admin123'),
    'manager': get_token('manager', 'manager123'),
    'inspector': get_token('inspector', 'inspector123'),
    'maintenance': get_token('maintenance', 'maintenance123'),
    'volunteer': get_token('volunteer', 'volunteer123'),
}
print('  OK\n')

print('=== 巡检权限测试 ===')
t = tokens['inspector']
print('1. 巡检员创建巡检:')
r = requests.post(f'{BASE_URL}/api/inspections/', 
    headers={'Authorization': f'Bearer {t}'},
    json={'venue': 1, 'title': '权限测试巡检', 'type': 'daily'})
inspection_id = r.json()['id']
print(f'   创建成功 ID={inspection_id}, 状态={r.status_code}')

print('2. 巡检员提交巡检:')
test('提交', t, 'POST', f'/api/inspections/{inspection_id}/submit/', expected_status=200)

print('3. 巡检员尝试approve (预期403):')
test('approve', t, 'POST', f'/api/inspections/{inspection_id}/approve/', expected_status=403)

print('4. 经理approve (预期200):')
test('approve', tokens['manager'], 'POST', f'/api/inspections/{inspection_id}/approve/', 
    data={'comments': '通过'}, expected_status=200)

print('5. 巡检员尝试complete (预期403):')
test('complete', t, 'POST', f'/api/inspections/{inspection_id}/complete/', expected_status=403)

print('\n=== 报修权限测试 ===')
t2 = tokens['inspector']
print('1. 创建报修:')
r = requests.post(f'{BASE_URL}/api/repairs/', 
    headers={'Authorization': f'Bearer {t2}'},
    json={'venue': 1, 'title': '权限测试报修', 'description': '测试', 'priority': 'medium', 'category': 'other'})
repair_id = r.json()['id']
print(f'   创建成功 ID={repair_id}, 状态={r.status_code}')

print('2. 维修员尝试assign (预期403):')
test('assign', tokens['maintenance'], 'POST', f'/api/repairs/{repair_id}/assign/',
    data={'assignee_id': 4}, expected_status=403)

print('3. 经理assign (预期200):')
test('assign', tokens['manager'], 'POST', f'/api/repairs/{repair_id}/assign/',
    data={'assignee_id': 4}, expected_status=200)

print('4. 报修人尝试reject (预期403):')
test('reject', t2, 'POST', f'/api/repairs/{repair_id+1 if repair_id==1 else 1}/reject/',
    data={'reason': '测试'}, expected_status=403)

print('\n=== 活动权限测试 ===')
print('1. 志愿者创建活动报名:')
r = requests.post(f'{BASE_URL}/api/activities/', 
    headers={'Authorization': f'Bearer {tokens["manager"]}'},
    json={
        'venue': 1, 'title': '权限测试活动', 'description': '测试',
        'start_time': '2026-06-01T10:00:00', 'end_time': '2026-06-01T12:00:00',
        'registration_start': '2026-05-25T00:00:00', 'registration_end': '2026-05-31T23:59:59',
        'max_participants': 10, 'is_need_checkin': True, 'checkin_code': 'TEST123'
    })
activity_id = r.json()['id']
print(f'   活动创建成功 ID={activity_id}')

print('2. 志愿者报名:')
r = requests.post(f'{BASE_URL}/api/activity-registrations/', 
    headers={'Authorization': f'Bearer {tokens["volunteer"]}'},
    json={'activity': activity_id})
reg_id = r.json()['id']
print(f'   报名成功 ID={reg_id}')

print('3. 志愿者尝试approve自己的报名 (预期403):')
test('approve', tokens['volunteer'], 'POST', f'/api/activity-registrations/{reg_id}/approve/', expected_status=403)

print('4. 志愿者尝试resolve反馈 (预期403):')
r = requests.post(f'{BASE_URL}/api/volunteer-feedbacks/', 
    headers={'Authorization': f'Bearer {tokens["volunteer"]}'},
    json={'activity': activity_id, 'task_description': '测试', 'actual_hours': 2})
fb_id = r.json()['id']
test('resolve', tokens['volunteer'], 'POST', f'/api/volunteer-feedbacks/{fb_id}/resolve/', expected_status=403)

print('5. 经理resolve反馈 (预期200):')
test('resolve', tokens['manager'], 'POST', f'/api/volunteer-feedbacks/{fb_id}/resolve/',
    data={'notes': '已处理'}, expected_status=200)

print('\n=== 签到权限测试 ===')
print('1. 待审核报名尝试签到 (预期400):')
test('checkin', tokens['volunteer'], 'POST', f'/api/activities/{activity_id}/checkin/',
    data={'user_id': 6, 'checkin_code': 'TEST123'}, expected_status=400)

print('2. 经理approve报名:')
test('approve', tokens['manager'], 'POST', f'/api/activity-registrations/{reg_id}/approve/', expected_status=200)

print('3. 已审核报名签到 (预期200):')
test('checkin', tokens['volunteer'], 'POST', f'/api/activities/{activity_id}/checkin/',
    data={'user_id': 6, 'checkin_code': 'TEST123'}, expected_status=200)

print('\n=== 数据范围测试 ===')
print('巡检员只能看到自己的巡检:')
r = requests.get(f'{BASE_URL}/api/inspections/', 
    headers={'Authorization': f'Bearer {tokens["inspector"]}'})
data = r.json()
print(f'   巡检员可见记录数: {len(data.get("results", []))}')
for item in data.get('results', []):
    print(f'     - {item["title"]} (ID={item["id"]})')

print('\n维修员只能看到分配给自己的报修:')
r = requests.get(f'{BASE_URL}/api/repairs/', 
    headers={'Authorization': f'Bearer {tokens["maintenance"]}'})
data = r.json()
print(f'   维修员可见记录数: {len(data.get("results", []))}')

print('\n✅ 权限测试完成!')
