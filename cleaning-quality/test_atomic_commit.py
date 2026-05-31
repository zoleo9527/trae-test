import requests
import json
import sys

BASE_URL = 'http://localhost:8000/api/v1'
HEADERS_OP = {
    'X-Operator-Id': 'proj_mgr_001',
    'X-Operator-Name': '项目经理-张明',
    'X-Operator-Role': 'project_manager',
    'Content-Type': 'application/json',
}

passed = 0
failed = 0

def test(name):
    def decorator(func):
        global passed, failed
        print(f'\n{name}')
        print('-' * 60)
        try:
            func()
            print('  ✅ PASS')
            passed += 1
        except AssertionError as e:
            print(f'  ❌ FAIL: {e}')
            failed += 1
        except Exception as e:
            print(f'  ❌ ERROR: {e}')
            failed += 1
        return func
    return decorator

@test('Test 1: Missing X-Idempotency-Key returns 400 with MISSING_IDEMPOTENCY_KEY')
def t1():
    r = requests.post(f'{BASE_URL}/projects', headers=HEADERS_OP, json={
        'name': '测试项目', 'code': 'TEST-001', 'address': '测试地址',
        'manager_id': 'mgr_001', 'manager_name': '张明'
    })
    print(f'  Status: {r.status_code}')
    print(f'  Body: {r.json()}')
    assert r.status_code == 400, f'Expected 400, got {r.status_code}'
    assert r.json().get('error') == 'MISSING_IDEMPOTENCY_KEY', f"Wrong error: {r.json().get('error')}"

@test('Test 2: Missing X-Expected-Version returns 400 with MISSING_EXPECTED_VERSION')
def t2():
    r = requests.post(f'{BASE_URL}/rectifications/3/assign', headers=HEADERS_OP, json={
        'assignee_id': 'clean_001', 'assignee_name': '保洁员-李芳'
    })
    print(f'  Status: {r.status_code}')
    print(f'  Body: {r.json()}')
    assert r.status_code == 400, f'Expected 400, got {r.status_code}'
    assert r.json().get('error') == 'MISSING_EXPECTED_VERSION', f"Wrong error: {r.json().get('error')}"

@test('Test 3: Create rectification with all headers succeeds')
def t3():
    global rect_id
    h = dict(HEADERS_OP)
    h['X-Operator-Id'] = 'qc_001'
    h['X-Operator-Name'] = '质检员-马丽'
    h['X-Operator-Role'] = 'inspector'
    h['X-Idempotency-Key'] = 'test-final-atomic-001'
    r = requests.post(f'{BASE_URL}/rectifications', headers=h, json={
        'project_id': 1, 'inspection_id': 1,
        'issue_description': '原子性测试', 'category': '测试', 'severity': 'medium',
        'deadline': '2026-06-03T00:00:00'
    })
    print(f'  Status: {r.status_code}')
    print(f'  Body ID: {r.json().get("id")}')
    assert r.status_code == 201, f'Expected 201, got {r.status_code}'
    rect_id = r.json()['id']
    print(f'  Created rect_id: {rect_id}')

@test('Test 4: Audit log has correct operator info (not hardcoded)')
def t4():
    r = requests.get(f'{BASE_URL}/audit-logs', params={
        'entity_type': 'rectification', 'entity_id': rect_id
    })
    logs = r.json()
    assert len(logs) >= 1, 'No audit log found'
    log = logs[0]
    print(f'  Audit operator: {log.get("operator_id")} / {log.get("operator_name")} / {log.get("operator_role")}')
    assert log['operator_id'] == 'qc_001', f'Wrong operator_id: {log["operator_id"]}'
    assert log['operator_name'] == '质检员-马丽', f'Wrong operator_name: {log["operator_name"]}'
    assert log['operator_role'] == 'inspector', f'Wrong operator_role: {log["operator_role"]}'

@test('Test 5: Duplicate submission returns 409 DUPLICATE_SUBMISSION')
def t5():
    h = dict(HEADERS_OP)
    h['X-Operator-Id'] = 'qc_001'
    h['X-Operator-Name'] = '质检员-马丽'
    h['X-Operator-Role'] = 'inspector'
    h['X-Idempotency-Key'] = 'test-final-atomic-001'
    r = requests.post(f'{BASE_URL}/rectifications', headers=h, json={
        'project_id': 1, 'inspection_id': 1,
        'issue_description': '重复提交', 'category': '测试', 'severity': 'medium',
        'deadline': '2026-06-03T00:00:00'
    })
    print(f'  Status: {r.status_code}')
    print(f'  Error: {r.json().get("error")}')
    assert r.status_code == 409, f'Expected 409, got {r.status_code}'
    assert r.json().get('error') == 'DUPLICATE_SUBMISSION', f"Wrong error: {r.json().get('error')}"

@test('Test 6: Domain isolation - different operator, same key succeeds')
def t6():
    h = dict(HEADERS_OP)
    h['X-Operator-Id'] = 'qc_002'
    h['X-Operator-Name'] = '质检员-刘伟'
    h['X-Operator-Role'] = 'inspector'
    h['X-Idempotency-Key'] = 'test-final-atomic-001'
    r = requests.post(f'{BASE_URL}/rectifications', headers=h, json={
        'project_id': 1, 'inspection_id': 1,
        'issue_description': '分域测试', 'category': '测试', 'severity': 'low',
        'deadline': '2026-06-03T00:00:00'
    })
    print(f'  Status: {r.status_code}')
    print(f'  New rect_id: {r.json().get("id")}')
    assert r.status_code == 201, f'Expected 201, got {r.status_code}'
    assert r.json()['id'] != rect_id, 'Should have different ID'

@test('Test 7: Domain isolation - same operator, different entity type succeeds')
def t7():
    h = dict(HEADERS_OP)
    h['X-Operator-Id'] = 'qc_001'
    h['X-Operator-Name'] = '质检员-马丽'
    h['X-Operator-Role'] = 'inspector'
    h['X-Idempotency-Key'] = 'test-final-atomic-001'
    r = requests.post(f'{BASE_URL}/projects', headers=h, json={
        'name': '测试项目2', 'code': 'TEST-002', 'address': '测试地址2',
        'manager_id': 'mgr_002', 'manager_name': '王强'
    })
    print(f'  Status: {r.status_code}')
    print(f'  New project_id: {r.json().get("id")}')
    assert r.status_code == 201, f'Expected 201, got {r.status_code}'

@test('Test 8: Optimistic lock version mismatch returns 409 CONCURRENT_CONFLICT')
def t8():
    h = dict(HEADERS_OP)
    h['X-Expected-Version'] = '999'
    r = requests.post(f'{BASE_URL}/rectifications/3/assign', headers=h, json={
        'assignee_id': 'clean_001', 'assignee_name': '保洁员-李芳'
    })
    print(f'  Status: {r.status_code}')
    print(f'  Error: {r.json().get("error")}')
    assert r.status_code == 409, f'Expected 409, got {r.status_code}'
    assert r.json().get('error') == 'CONCURRENT_CONFLICT', f"Wrong error: {r.json().get('error')}"

@test('Test 9: Optimistic lock correct version succeeds, version increments')
def t9():
    global current_version, new_version
    r = requests.get(f'{BASE_URL}/rectifications/3')
    current_version = r.json()['version']
    print(f'  Current version: {current_version}')
    h = dict(HEADERS_OP)
    h['X-Expected-Version'] = str(current_version)
    r = requests.post(f'{BASE_URL}/rectifications/3/assign', headers=h, json={
        'assignee_id': 'clean_001', 'assignee_name': '保洁员-李芳'
    })
    print(f'  Status: {r.status_code}')
    assert r.status_code == 200, f'Expected 200, got {r.status_code}'
    new_version = r.json()['version']
    print(f'  Old version: {current_version}, New version: {new_version}')
    assert new_version == current_version + 1, f'Version not incremented: {current_version} -> {new_version}'

@test('Test 10: Idempotency record exists with correct composite key')
def t10():
    import sys
    sys.path.insert(0, '/Users/zhangliu/Documents/private/model-test/trae-test-4/cleaning-quality')
    from app.database import SessionLocal
    from app.models.idempotency import IdempotencyKey
    db = SessionLocal()
    count = db.query(IdempotencyKey).filter(
        IdempotencyKey.idempotency_key == 'test-final-atomic-001',
        IdempotencyKey.entity_type == 'rectification',
        IdempotencyKey.operator_id == 'qc_001',
        IdempotencyKey.entity_id == rect_id
    ).count()
    db.close()
    print(f'  Idempotency record count: {count}')
    assert count == 1, f'Expected 1 idempotency record, got {count}'

@test('Test 11: Error format is unified (error + detail fields)')
def t11():
    r = requests.post(f'{BASE_URL}/projects', headers=HEADERS_OP, json={
        'name': '测试项目', 'code': 'TEST-003', 'address': '测试地址',
        'manager_id': 'mgr_001', 'manager_name': '张明'
    })
    body = r.json()
    print(f'  Keys in error response: {list(body.keys())}')
    assert 'error' in body, 'Missing error field'
    assert 'detail' in body, 'Missing detail field'

print('=' * 60)
print('Test Suite: Atomic Commit & Header Validation')
print('=' * 60)

rect_id = None
current_version = None
new_version = None

t1()
t2()
t3()
t4()
t5()
t6()
t7()
t8()
t9()
t10()
t11()

print('\n' + '=' * 60)
print(f'Results: {passed} passed, {failed} failed')
print('=' * 60)

if failed > 0:
    sys.exit(1)
