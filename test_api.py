import urllib.parse
import urllib.request
import json

base_url = 'http://127.0.0.1:8000/api/exceptions'

def get_json(url, params=None):
    if params:
        url = url + '?' + urllib.parse.urlencode(params)
    req = urllib.request.Request(url)
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode('utf-8'))

print('=== 1. 同时过滤 source_type=装车 和 source_id=2 ===')
params = {'source_type': '装车', 'source_id': 2}
data = get_json(base_url, params)
for item in data:
    print(f'  id={item["id"]}, source_type={item["source_type"]}, source_id={item["source_id"]}')

print('\n=== 2. 只过滤 source_id=2 ===')
params = {'source_id': 2}
data = get_json(base_url, params)
for item in data:
    print(f'  id={item["id"]}, source_type={item["source_type"]}, source_id={item["source_id"]}')

print('\n=== 3. get_by_source 接口 (source_type=装车, source_id=2) ===')
params = {'source_type': '装车', 'source_id': 2}
data = get_json(f'{base_url}/by-source', params)
for item in data:
    print(f'  id={item["id"]}, source_type={item["source_type"]}, source_id={item["source_id"]}, created_at={item["created_at"]}')

print('\n=== 4. 测试原有过滤功能 (status=待处理) ===')
params = {'status': '待处理'}
data = get_json(base_url, params)
for item in data:
    print(f'  id={item["id"]}, status={item["status"]}')

print('\n=== 5. 测试原有过滤功能 (severity=紧急) ===')
params = {'severity': '紧急'}
data = get_json(base_url, params)
for item in data:
    print(f'  id={item["id"]}, severity={item["severity"]}')
