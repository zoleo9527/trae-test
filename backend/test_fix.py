import urllib.request
import json

def get(url):
    with urllib.request.urlopen(url) as r:
        return json.loads(r.read())

def post(url, data):
    req = urllib.request.Request(
        url,
        data=json.dumps(data).encode(),
        headers={'Content-Type': 'application/json'},
        method='POST'
    )
    with urllib.request.urlopen(req) as r:
        return json.loads(r.read())

print("=== 1. 检查各状态申诉数量 ===")
stats = get('http://localhost:8000/api/dashboard/stats')
print(f"待处理申诉: {stats['pending_appeals']}")
print(f"已驳回申诉: {stats['rejected_appeals']}")
print(f"需回查申诉: {stats['need_review']}")
print(f"异常订单: {stats['abnormal_orders']}")

print("\n=== 2. 检查商家结算单数量 ===")
settlements = get('http://localhost:8000/api/settlements')
print(f"结算单总数: {settlements['total']}")
for s in settlements['data']:
    print(f"  {s['id']}: {s['merchant_name']}")

print("\n=== 3. 测试申诉通过（验证补贴金额验证）===")
pending = get('http://localhost:8000/api/appeals?status=pending')
if pending['data']:
    appeal_id = pending['data'][0]['id']
    order_id = pending['data'][0]['order_id']
    merchant_name = pending['data'][0]['merchant_name']
    print(f"测试申诉: {appeal_id} ({merchant_name})")
    
    try:
        post(f'http://localhost:8000/api/appeals/{appeal_id}/process', {
            'status': 'approved',
            'process_note': '测试空补贴',
            'subsidy_amount': None
        })
    except Exception as e:
        print(f"空补贴验证: {e}")
    
    print("\n=== 4. 正常通过申诉，验证结算和留痕 ===")
    result = post(f'http://localhost:8000/api/appeals/{appeal_id}/process', {
        'status': 'approved',
        'process_note': '已核实，同意补贴35元',
        'subsidy_amount': 35.0
    })
    print(f"申诉处理结果: 状态={result['status']}, 补贴={result['subsidy_amount']}")
    
    print(f"\n=== 5. 检查操作留痕（申诉ID: {appeal_id}）===")
    logs = get(f'http://localhost:8000/api/operation-logs?appeal_id={appeal_id}')
    print(f"关联的操作日志数量: {logs['total']}")
    for log in logs['data']:
        time_str = log['created_at'][5:16].replace('T', ' ')
        print(f"  {time_str} | {log['action']} | {log['description']}")
        if log['appeal_id']:
            print(f"         ✅ 关联申诉ID: {log['appeal_id']}")
        else:
            print(f"         ❌ 未关联申诉ID")

print("\n=== 6. 检查更新后的结算单 ===")
settlements2 = get('http://localhost:8000/api/settlements')
for s in settlements2['data']:
    print(f"  {s['id']}: {s['merchant_name']}, 补贴合计: ¥{s['total_subsidy']:.2f}")
