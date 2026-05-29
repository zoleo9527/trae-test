#!/usr/bin/env python3
import requests
import json

BASE_URL = "http://localhost:3000/api"

def login(username, password):
    r = requests.post(f"{BASE_URL}/auth/login", json={"username": username, "password": password})
    return r.json()["data"]["token"]

def main():
    print("=== 测试第三轮修复（简化版）===\n")
    
    # 1. 登录获取token
    print("=== 1. 登录获取各角色Token ===")
    manager_token = login("manager", "manager123")
    worker_token = login("worker", "worker123")
    sales_token = login("sales", "sales123")
    print("✅ 登录成功\n")
    
    # 2. 测试养护员能看到自己作为currentHandler的协商
    print("=== 2. 测试养护员能看到自己作为currentHandler的协商审计 ===")
    
    # 获取一个草稿协商
    r = requests.get(f"{BASE_URL}/negotiations", headers={"Authorization": f"Bearer {sales_token}"})
    draft_neg_id = r.json()["data"][0]["id"]
    print(f"草稿协商ID: {draft_neg_id}")
    
    # 销售提交（带幂等键）
    r = requests.post(f"{BASE_URL}/negotiations/{draft_neg_id}/submit",
        headers={
            "Authorization": f"Bearer {sales_token}",
            "x-idempotency-key": "test-submit-1"
        })
    print(f"提交: {r.json()['success']}")
    
    # 经理批准 - 养护员自动成为currentHandler
    r = requests.patch(f"{BASE_URL}/negotiations/{draft_neg_id}/status",
        headers={
            "Authorization": f"Bearer {manager_token}",
            "x-idempotency-key": "test-approve-1"
        },
        json={"newStatus": "APPROVED"})
    print(f"批准: {r.json()['success']}")
    
    # 养护员查看仪表盘
    r = requests.get(f"{BASE_URL}/dashboard", headers={"Authorization": f"Bearer {worker_token}"})
    items = r.json()["data"]["recentActivities"]
    negotiation_items = [x for x in items if x["entityType"] == "ReseedNegotiation"]
    if negotiation_items:
        print(f"✅ 养护员看到协商审计: {len(negotiation_items)}条")
        for item in negotiation_items:
            print(f"   - {item['action']} by {item['user']['name']}")
    else:
        print(f"❌ 养护员看不到协商审计，所有审计: {[(x['entityType'], x['user']['name']) for x in items]}")
    print()
    
    # 3. 测试REWORK_REQUIRED后能重新submit
    print("=== 3. 测试REWORK_REQUIRED后能重新submit ===")
    
    # 获取另一个草稿协商
    r = requests.get(f"{BASE_URL}/negotiations", headers={"Authorization": f"Bearer {sales_token}"})
    draft_neg_id = None
    for n in r.json()["data"]:
        if n["status"] == "DRAFT":
            draft_neg_id = n["id"]
            break
    
    print(f"草稿协商ID: {draft_neg_id}")
    
    # 销售提交
    r = requests.post(f"{BASE_URL}/negotiations/{draft_neg_id}/submit",
        headers={
            "Authorization": f"Bearer {sales_token}",
            "x-idempotency-key": "test-submit-2"
        })
    print(f"首次提交: {r.json()['success']}")
    
    # 经理退回待修改
    r = requests.patch(f"{BASE_URL}/negotiations/{draft_neg_id}/status",
        headers={
            "Authorization": f"Bearer {manager_token}",
            "x-idempotency-key": "test-rework-1"
        },
        json={"newStatus": "REWORK_REQUIRED", "reworkNote": "请修改"})
    print(f"退回待修改: {r.json()['success']}")
    
    # 查看状态
    r = requests.get(f"{BASE_URL}/negotiations/{draft_neg_id}", headers={"Authorization": f"Bearer {sales_token}"})
    print(f"当前状态: {r.json()['data']['status']}")
    
    # 销售重新提交（关键测试）
    r = requests.post(f"{BASE_URL}/negotiations/{draft_neg_id}/submit",
        headers={
            "Authorization": f"Bearer {sales_token}",
            "x-idempotency-key": "test-submit-3"
        })
    result = r.json()
    if result["success"] and result["data"]["status"] == "MANAGER_REVIEW":
        print(f"✅ REWORK_REQUIRED后重新提交成功! 新状态: {result['data']['status']}")
    else:
        print(f"❌ 重新提交失败!")
        print(f"   结果: {result}")
    
    print()
    print("=== 所有测试完成 ===")

if __name__ == "__main__":
    main()
