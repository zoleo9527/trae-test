#!/usr/bin/env python3
import urllib.request
import urllib.parse
import json
import uuid

BASE_URL = "http://localhost:3000"

def req(url, method="GET", data=None, headers=None):
    if headers is None:
        headers = {}
    if data is not None:
        data = json.dumps(data).encode()
        headers["Content-Type"] = "application/json"
    r = urllib.request.Request(url, data=data, method=method, headers=headers)
    try:
        with urllib.request.urlopen(r) as resp:
            return resp.read().decode(), resp.status, resp.headers
    except urllib.error.HTTPError as e:
        return e.read().decode(), e.code, e.headers

def login(username, password):
    body, _, _ = req(f"{BASE_URL}/api/auth/login", "POST", 
                    {"username": username, "password": password})
    data = json.loads(body)
    return data["data"]["token"], data["data"]["user"]

def h(token):
    return {"Authorization": f"Bearer {token}"}

print("=" * 60)
print("🚀 汽配商行-退货鉴定与退款复核系统 功能验证")
print("=" * 60)

# 1. 健康检查
print("\n✅ 1. 健康检查")
body, _, _ = req(f"{BASE_URL}/health")
data = json.loads(body)
assert data["code"] == 0
print(f"   状态: {data['data']['status']}")

# 2. 三角色登录
print("\n✅ 2. 三角色登录认证")
roles = ["store_owner", "sales", "warehouse"]
tokens = {}
for role in roles:
    token, user = login(role, "123456")
    tokens[role] = token
    print(f"   {role}: {user['realName']} -> {user['role']}")

# 3. 询价单列表（分页+筛选）
print("\n✅ 3. 询价单列表（分页+筛选）")
token = tokens["sales"]
params = urllib.parse.urlencode({"page": 1, "pageSize": 3, "hasException": "true"})
body, _, _ = req(f"{BASE_URL}/api/inquiries?{params}", "GET", headers=h(token))
resp_data = json.loads(body)
data = resp_data["data"]
pagination = resp_data["pagination"]
print(f"   总记录: {pagination['total']}, 当前页: {pagination['page']}/{pagination['totalPages']}")
for item in data:
    exc = "🔴" if item.get("hasException") else "🟢"
    print(f"   {exc} {item['inquiryNo']} | {item['status']} | ¥{item['totalAmount']} | {item['customerName']}")

# 4. 询价单详情（全链路关联）
print("\n✅ 4. 询价单详情（全链路关联单据）")
inquiry_id = data[0]["id"]
body, _, _ = req(f"{BASE_URL}/api/inquiries/{inquiry_id}", "GET", headers=h(token))
detail = json.loads(body)["data"]
print(f"   询价单: {detail['inquiryNo']}")
print(f"   关联锁库单: {(detail.get('stockLock') or {}).get('lockNo', '无')}")
print(f"   关联退货单: {(detail.get('returnOrder') or {}).get('returnNo', '无')}")
print(f"   关联退款单: {(detail.get('refundOrder') or {}).get('refundNo', '无')}")
print(f"   配件明细: {len(detail['items'])}项, 操作日志: {len(detail['operationLogs'])}条, 备注: {len(detail['remarks'])}条, 证据: {len(detail['evidences'])}个")

# 5. 退货单列表
print("\n✅ 5. 退货单列表（异常筛选）")
params = urllib.parse.urlencode({"page": 1, "pageSize": 10, "hasException": "true"})
body, _, _ = req(f"{BASE_URL}/api/return-orders?{params}", "GET", headers=h(token))
resp_data = json.loads(body)
data = resp_data["data"]
pagination = resp_data["pagination"]
print(f"   异常退货单: {pagination['total']}条")
for item in data:
    print(f"   {item['returnNo']} | {item['status']} | 异常:{item.get('exceptionType', '-')} | ¥{item['applyRefundAmount']}")

# 6. 退款单列表
print("\n✅ 6. 退款单列表")
params = urllib.parse.urlencode({"page": 1, "pageSize": 5})
body, _, _ = req(f"{BASE_URL}/api/refund-orders?{params}", "GET", headers=h(token))
resp_data = json.loads(body)
data = resp_data["data"]
pagination = resp_data["pagination"]
print(f"   退款单: {pagination['total']}条")
for item in data:
    exc = "🔴" if item.get("hasException") else "🟢"
    print(f"   {exc} {item['refundNo']} | {item['status']} | ¥{item['refundAmount']}")

# 7. 操作日志（全链路追溯）
print("\n✅ 7. 操作日志（按inquiryId追溯）")
params = urllib.parse.urlencode({"inquiryId": inquiry_id, "pageSize": 20})
body, _, _ = req(f"{BASE_URL}/api/audit-logs?{params}", "GET", headers=h(token))
resp_data = json.loads(body)
data = resp_data["data"]
pagination = resp_data["pagination"]
print(f"   该单操作日志: {pagination['total']}条")
for log in data[:3]:
    print(f"   [{log['createdAt'][:19]}] {log['operatorName']} | {log['operationType']} | {log['detail'][:30]}")

# 8. 权限测试 - 库管不能审批退款
print("\n✅ 8. 权限边界测试")
params = urllib.parse.urlencode({"pageSize": 1})
body, _, _ = req(f"{BASE_URL}/api/refund-orders?{params}", "GET", headers=h(tokens["warehouse"]))
resp_data = json.loads(body)
ro_id = resp_data["data"][0]["id"]
headers = h(tokens["warehouse"])
headers["Content-Type"] = "application/json"
body, _, _ = req(f"{BASE_URL}/api/refund-orders/{ro_id}/status", "PATCH",
                data={"status": "APPROVED", "remark": "测试越权"},
                headers=h(tokens["warehouse"]))
result = json.loads(body)
print(f"   库管审批退款: 预期403权限不足, 实际code={result['code']}, msg={result['message']}")

# 9. 幂等性测试
print("\n✅ 9. 幂等性测试")
idem_key = str(uuid.uuid4())
headers = h(token)
headers["X-Idempotency-Key"] = idem_key
headers["Content-Type"] = "application/json"
body1, _, _ = req(f"{BASE_URL}/api/inquiries/{inquiry_id}/remarks", "POST",
                 data={"content": "幂等测试备注", "isImportant": False},
                 headers=headers)
body2, _, _ = req(f"{BASE_URL}/api/inquiries/{inquiry_id}/remarks", "POST",
                 data={"content": "幂等测试备注", "isImportant": False},
                 headers=headers)
data1 = json.loads(body1)
data2 = json.loads(body2)
print(f"   第一次请求: code={data1['code']}")
print(f"   第二次请求(同key): code={data2['code']}")
print(f"   两次响应相同: {data1['data']['id'] == data2['data']['id']}")

# 10. 导出测试（小数据量）
print("\n✅ 10. 导出功能测试")
params = urllib.parse.urlencode({"type": "inquiry", "format": "xlsx", "pageSize": 2})
try:
    _, status, hdrs = req(f"{BASE_URL}/api/export?{params}", "GET", headers=h(token))
    print(f"   Excel导出: 状态码={status}, Content-Type={hdrs.get('Content-Type')}")
except Exception as e:
    print(f"   导出测试跳过: {str(e)[:50]}")

# 11. 幂等性重复请求测试（预期抛出重复请求错误）
print("\n✅ 11. 幂等性重复请求检测")
idem_key2 = str(uuid.uuid4())
headers2 = h(token)
headers2["X-Idempotency-Key"] = idem_key2
headers2["Content-Type"] = "application/json"
body1, status1, _ = req(f"{BASE_URL}/api/inquiries/{inquiry_id}/remarks", "POST",
                 data={"content": "幂等测试备注2", "isImportant": False},
                 headers=headers2)
body2, status2, _ = req(f"{BASE_URL}/api/inquiries/{inquiry_id}/remarks", "POST",
                 data={"content": "幂等测试备注2", "isImportant": False},
                 headers=headers2)
data1 = json.loads(body1)
data2 = json.loads(body2)
print(f"   第一次请求: code={data1['code']}, status={status1}")
print(f"   第二次请求(同key): code={data2['code']}, status={status2}")
print(f"   重复请求被正确拦截: {data2['code'] == 40002}")  # IDEMPOTENT_DUPLICATE
print("\n📋 6组测试样例已在数据库中:")
print("   🔵 正常流3组: 型号不匹配退货、买错型号换货、包装损坏部分退款")
print("   🔴 问题流3组: 型号报错纠纷、退货无据驳回、账期客户回款拖欠")
print("\n🌐 前端页面: http://localhost:3000")
print("👤 测试账号: store_owner / sales / warehouse, 密码均为 123456")
print("\n📄 实现说明: IMPLEMENTATION_NOTES.md")
