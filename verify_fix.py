#!/usr/bin/env python3
import urllib.request
import json

# Get token
req = urllib.request.Request(
    'http://localhost:9000/api/login/',
    data=json.dumps({"username":"boss","password":"123456"}).encode(),
    headers={'Content-Type': 'application/json'}
)
resp = urllib.request.urlopen(req)
token = json.loads(resp.read())['access']

print("=" * 60)
print("=== 部分回款订单状态日志验证 ===")
print("=" * 60)

# Get partial payment order
req = urllib.request.Request('http://localhost:9000/api/orders/?status=PAID_PARTIAL')
req.add_header('Authorization', f'Bearer {token}')
resp = urllib.request.urlopen(req)
orders = json.loads(resp.read())
if orders:
    oid = orders[0]['id']
    req = urllib.request.Request(f'http://localhost:9000/api/orders/{oid}/')
    req.add_header('Authorization', f'Bearer {token}')
    resp = urllib.request.urlopen(req)
    detail = json.loads(resp.read())
    print(f'订单号: {detail["order_no"]}')
    print(f'客户: {detail["customer_name"]}')
    print(f'总金额: {detail["total_amount"]} | 已付: {detail["paid_amount"]} | 未付: {detail["unpaid_amount"]}')
    print('\n状态流转日志:')
    for log in detail["status_logs"]:
        from_status = log["from_status_display"] or "创建"
        print(f'  ✓ {from_status} -> {log["to_status_display"]}')
        print(f'    操作人: {log["operator_name"]} | {log["remark"] or "-"}')

print("\n" + "=" * 60)
print("=== 催办任务及备注验证 ===")
print("=" * 60)

req = urllib.request.Request('http://localhost:9000/api/reminders/')
req.add_header('Authorization', f'Bearer {token}')
resp = urllib.request.urlopen(req)
reminders = json.loads(resp.read())
for r in reminders:
    print(f'\n★ {r["title"]}')
    print(f'  状态: {r["status_display"]} | 优先级: {r["priority_display"]}')
    print(f'  责任人: {r["assignee_name"]} | 创建人: {r["creator_name"]}')
    
    # Get detail with remarks
    req = urllib.request.Request(f'http://localhost:9000/api/reminders/{r["id"]}/')
    req.add_header('Authorization', f'Bearer {token}')
    resp = urllib.request.urlopen(req)
    detail = json.loads(resp.read())
    if detail.get('remarks'):
        print(f'  跟进记录:')
        for remark in detail['remarks']:
            print(f'    - {remark["author_name"]}: {remark["content"]}')

print("\n" + "=" * 60)
print("=== 销售员下钻筛选验证 ===")
print("=" * 60)

for sid, sname in [(2, "李销售"), (3, "王销售")]:
    req = urllib.request.Request(f'http://localhost:9000/api/orders/?sales_id={sid}')
    req.add_header('Authorization', f'Bearer {token}')
    resp = urllib.request.urlopen(req)
    orders = json.loads(resp.read())
    print(f'{sname}: {len(orders)} 个订单')
    for o in orders[:3]:
        print(f'  - {o["order_no"]} | {o["status_display"]} | ¥{o["total_amount"]}')
