import requests

BASE_URL = 'http://localhost:8001'

def get_token(username, password):
    r = requests.post(f'{BASE_URL}/api/token/', json={'username': username, 'password': password})
    return r.json()['access']

manager_token = get_token('manager', 'manager123')
headers = {'Authorization': f'Bearer {manager_token}'}

print('=== 测试接口 ===')

# 测试1: 扫描逾期
r = requests.post(f'{BASE_URL}/api/scan-overdue/', headers=headers, json={})
print(f'1. POST /api/scan-overdue/: {r.status_code}')
if r.status_code == 200:
    data = r.json()
    print(f'   新增: {data.get("created")}, 更新: {data.get("updated")}')
else:
    print(f'   Error: {r.text}')

# 测试2: 逾期汇总
r = requests.get(f'{BASE_URL}/api/overdue-summary/', headers=headers)
print(f'2. GET /api/overdue-summary/: {r.status_code}')
if r.status_code == 200:
    print(f'   Data: {r.json()}')

# 测试3: ViewSet scan_all
r = requests.post(f'{BASE_URL}/api/overdue-reminders/scan_all/', headers=headers, json={})
print(f'3. POST /api/overdue-reminders/scan_all/: {r.status_code}')
if r.status_code == 200:
    print(f'   Results: {len(r.json().get("results", []))} items')

# 测试4: 借阅列表
r = requests.get(f'{BASE_URL}/api/borrows/', headers=headers)
print(f'4. GET /api/borrows/: {r.status_code}')
if r.status_code == 200:
    results = r.json().get('results', [])
    print(f'   Count: {len(results)}')
    if results:
        print(f'   First ID: {results[0]["id"]}, status: {results[0]["status"]}')

# 测试5: 巡检列表
r = requests.get(f'{BASE_URL}/api/inspections/', headers=headers)
print(f'5. GET /api/inspections/: {r.status_code}')
if r.status_code == 200:
    results = r.json().get('results', [])
    print(f'   Count: {len(results)}')
    for item in results:
        print(f'   - ID={item["id"]}, status={item["status"]}, title={item["title"]}')

# 测试6: 报修列表
r = requests.get(f'{BASE_URL}/api/repairs/', headers=headers)
print(f'6. GET /api/repairs/: {r.status_code}')
if r.status_code == 200:
    results = r.json().get('results', [])
    print(f'   Count: {len(results)}')
    for item in results:
        print(f'   - ID={item["id"]}, no={item["ticket_no"]}, status={item["status"]}')

print('\n=== 测试自动关闭 ===')

# 测试7: 借阅归还
borrow_id = 3  # 从上面的结果中获取
r = requests.get(f'{BASE_URL}/api/borrows/', headers=headers)
results = r.json().get('results', [])
if results:
    borrow_id = results[0]['id']
    print(f'\n7. 测试借阅归还 ID={borrow_id}:')
    r2 = requests.post(f'{BASE_URL}/api/borrows/{borrow_id}/return_book/', headers=headers)
    print(f'   POST /api/borrows/{borrow_id}/return_book/: {r2.status_code}')
    if r2.status_code != 200:
        print(f'   Response: {r2.text}')
