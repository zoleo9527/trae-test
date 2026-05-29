#!/usr/bin/env python3
import requests

BASE_URL = "http://localhost:3000/api"

def login(username, password):
    r = requests.post(f"{BASE_URL}/auth/login", json={"username": username, "password": password})
    return r.json()["data"]["token"]

sales_token = login("sales", "sales123")
manager_token = login("manager", "manager123")
worker_token = login("worker", "worker123")

print("=== 测试REWORK_REQUIRED后重新submit ===\n")

# 获取DRAFT协商
r = requests.get(f"{BASE_URL}/negotiations", headers={"Authorization": f"Bearer {sales_token}"})
draft_neg_id = None
for n in r.json()["data"]:
    if n["status"] == "DRAFT":
        draft_neg_id = n["id"]
        break
print(f"DRAFT协商ID: {draft_neg_id}")

# 提交
r = requests.post(f"{BASE_URL}/negotiations/{draft_neg_id}/submit",
    headers={
        "Authorization": f"Bearer {sales_token}",
        "x-idempotency-key": "test-submit-001"
    })
print(f"提交结果: {r.json()['success']}")
if not r.json()['success']:
    print(f"  错误: {r.json().get('error', '')}")

# 经理退回待修改
r = requests.patch(f"{BASE_URL}/negotiations/{draft_neg_id}/status",
    headers={
        "Authorization": f"Bearer {manager_token}",
        "x-idempotency-key": "test-rework-001"
    },
    json={"newStatus": "REWORK_REQUIRED", "reworkNote": "请修改"})
print(f"退回待修改结果: {r.json()['success']}")
if not r.json()['success']:
    print(f"  错误: {r.json().get('error', '')}")

# 查看当前状态
r = requests.get(f"{BASE_URL}/negotiations/{draft_neg_id}", headers={"Authorization": f"Bearer {sales_token}"})
print(f"当前状态: {r.json()['data']['status']}")

# 重新提交
r = requests.post(f"{BASE_URL}/negotiations/{draft_neg_id}/submit",
    headers={
        "Authorization": f"Bearer {sales_token}",
        "x-idempotency-key": "test-submit-002"
    })
result = r.json()
print(f"重新提交结果: {result['success']}")
if result['success']:
    print(f"新状态: {result['data']['status']}")
    if result['data']['status'] == 'MANAGER_REVIEW':
        print("✅ REWORK_REQUIRED后重新提交成功!")
else:
    print(f"错误: {result.get('error', '')}")

print("\n=== 测试养护员能看到currentHandler的协商审计 ===\n")

# 获取APPROVED状态的协商
r = requests.get(f"{BASE_URL}/negotiations", headers={"Authorization": f"Bearer {manager_token}"})
for n in r.json()["data"]:
    print(f"  {n['id']}: {n['status']}, currentHandler: {n.get('currentHandler',{}).get('name','')}")

# 养护员查看仪表盘
r = requests.get(f"{BASE_URL}/dashboard", headers={"Authorization": f"Bearer {worker_token}"})
items = r.json()["data"]["recentActivities"]
print(f"\n养护员看到的审计数量: {len(items)}")
for item in items:
    print(f"  - {item['entityType']}: {item['action']} by {item['user']['name']}")

negotiation_items = [x for x in items if x["entityType"] == "ReseedNegotiation"]
if negotiation_items:
    print(f"\n✅ 养护员看到协商审计: {len(negotiation_items)}条")
else:
    print(f"\n⚠️  养护员暂未看到协商审计（可能需要先触发一些操作）")
