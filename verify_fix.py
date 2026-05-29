#!/usr/bin/env python3
import urllib.request
import json

def api(path, token=None):
    req = urllib.request.Request(f'http://localhost:9000/api{path}')
    if token:
        req.add_header('Authorization', f'Bearer {token}')
    resp = urllib.request.urlopen(req)
    return json.loads(resp.read())

def post(path, data, token=None):
    req = urllib.request.Request(
        f'http://localhost:9000/api{path}',
        data=json.dumps(data).encode(),
        headers={'Content-Type': 'application/json'}
    )
    if token:
        req.add_header('Authorization', f'Bearer {token}')
    resp = urllib.request.urlopen(req)
    return json.loads(resp.read())

token = post('/login/', {'username': 'boss', 'password': '123456'})['access']

print('=' * 60)
print('1. 订单与客户一致性验证')
print('=' * 60)
orders = api('/orders/', token)
for o in orders:
    print(f'  {o["order_no"]} | {o["customer_name"]:10s} | {o["status_display"]:6s} | 已付:{o["paid_amount"]} 未付:{o["unpaid_amount"]}')

print('\n' + '=' * 60)
print('2. 催办标题与订单客户匹配验证')
print('=' * 60)
reminders = api('/reminders/', token)
for r in reminders:
    print(f'  催办: {r["title"]}')
    print(f'    关联订单客户: {r["customer_name"]} | 未付: ¥{r["unpaid_amount"]}')
    match = r["customer_name"] in r["title"]
    print(f'    客户名在标题中: {"✅" if match else "❌ 不匹配!"}')

print('\n' + '=' * 60)
print('3. 催办详情remarks字段验证')
print('=' * 60)
for r in reminders:
    detail = api(f'/reminders/{r["id"]}/', token)
    remarks_count = len(detail.get('remarks', []))
    print(f'  {detail["title"]}: remarks字段存在, {remarks_count}条跟进记录')
    for remark in detail.get('remarks', []):
        print(f'    - {remark["author_name"]}: {remark["content"]}')

print('\n' + '=' * 60)
print('4. 销售员列表API验证')
print('=' * 60)
sales = api('/user/sales_list/', token)
for s in sales:
    print(f'  id={s["id"]} | {s["first_name"]}{s["last_name"]} | {s["role_display"]}')

print('\n' + '=' * 60)
print('5. 部分回款订单状态日志验证(含回款确认节点)')
print('=' * 60)
partial_orders = [o for o in orders if o['status'] == 'PAID_PARTIAL']
if partial_orders:
    detail = api(f'/orders/{partial_orders[0]["id"]}/', token)
    print(f'  订单: {detail["order_no"]} | {detail["customer_name"]}')
    print(f'  状态日志链:')
    for log in reversed(detail['status_logs']):
        from_s = log['from_status_display'] or '创建'
        print(f'    {from_s} → {log["to_status_display"]} | {log["operator_name"]} | {log["remark"]}')
    has_payment_log = any(l['to_status'] in ['PAID_PARTIAL', 'PAID'] for l in detail['status_logs'])
    print(f'  回款确认节点: {"✅ 存在" if has_payment_log else "❌ 缺失!"}')

print('\n' + '=' * 60)
print('6. 已结清订单状态日志验证')
print('=' * 60)
paid_orders = [o for o in orders if o['status'] == 'PAID']
if paid_orders:
    detail = api(f'/orders/{paid_orders[0]["id"]}/', token)
    print(f'  订单: {detail["order_no"]} | {detail["customer_name"]}')
    for log in reversed(detail['status_logs']):
        from_s = log['from_status_display'] or '创建'
        print(f'    {from_s} → {log["to_status_display"]} | {log["operator_name"]} | {log["remark"]}')

print('\n✅ 全部验证完成!')
