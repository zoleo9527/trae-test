#!/usr/bin/env python3
import requests
import json

BASE_URL = "http://localhost:3000/api"

def login(username, password):
    r = requests.post(f"{BASE_URL}/auth/login", json={"username": username, "password": password})
    return r.json()["data"]["token"]

def main():
    print("=== 测试第三轮修复 ===\n")
    
    # 1. 登录获取token
    print("=== 1. 登录获取各角色Token ===")
    manager_token = login("manager", "manager123")
    print(f"Manager Token: {manager_token[:30]}...")
    
    worker_token = login("worker", "worker123")
    print(f"Worker Token:  {worker_token[:30]}...")
    
    sales_token = login("sales", "sales123")
    print(f"Sales Token:   {sales_token[:30]}...")
    print()
    
    # 2. 测试养护员能看到自己作为currentHandler的协商审计
    print("=== 2. 测试养护员能看到自己作为currentHandler的协商审计 ===")
    
    # 先让经理把一个协商的状态改为 APPROVED，让养护员成为currentHandler
    r = requests.get(f"{BASE_URL}/negotiations", headers={"Authorization": f"Bearer {manager_token}"})
    draft_neg_id = None
    for n in r.json()["data"]:
        if n["status"] == "DRAFT":
            draft_neg_id = n["id"]
            break
    print(f"DRAFT协商ID: {draft_neg_id}")
    
    # 销售先submit
    r = requests.post(f"{BASE_URL}/negotiations/{draft_neg_id}/submit",
        headers={
            "Authorization": f"Bearer {sales_token}",
            "x-idempotency-key": "test-submit-worker-1"
        })
    print(f"销售提交结果: {r.json()['success']}")
    if not r.json()['success']:
        print(f"  错误: {r.json().get('error')}")
    
    # 经理批准（养护员会自动成为currentHandler）
    r = requests.patch(f"{BASE_URL}/negotiations/{draft_neg_id}/status",
        headers={
            "Authorization": f"Bearer {manager_token}",
            "x-idempotency-key": "test-approve-worker-1"
        },
        json={"newStatus": "APPROVED"})
    print(f"经理批准结果: {r.json()['success']}")
    if not r.json()['success']:
        print(f"  错误: {r.json().get('error')}")
    
    # 养护员查看仪表盘，应该能看到该协商的审计记录
    r = requests.get(f"{BASE_URL}/dashboard", headers={"Authorization": f"Bearer {worker_token}"})
    items = r.json()["data"]["recentActivities"]
    negotiation_items = [x for x in items if x["entityType"] == "ReseedNegotiation"]
    if negotiation_items:
        print(f"✅ 养护员看到协商审计: 数量={len(negotiation_items)}")
        for item in negotiation_items:
            print(f"   - {item['action']} by {item['user']['name']}")
    else:
        print(f"❌ 养护员看不到协商审计，所有审计: {[(x['entityType'], x['user']['name']) for x in items]}")
    print()
    
    # 3. 测试REWORK_REQUIRED后能重新submit
    print("=== 3. 测试REWORK_REQUIRED后能重新submit ===")
    
    # 创建一个新协商
    r = requests.get(f"{BASE_URL}/visits", headers={"Authorization": f"Bearer {sales_token}"})
    visit_id = r.json()["data"][0]["id"]
    
    r = requests.post(f"{BASE_URL}/negotiations",
        headers={
            "Authorization": f"Bearer {sales_token}",
            "x-idempotency-key": "test-rework-submit-1"
        },
        json={
            "visitId": visit_id,
            "customerName": "测试客户",
            "customerComplaint": "测试投诉",
            "proposedReseedQty": 10
        })
    print(f"创建协商响应: {r.status_code}")
    result = r.json()
    print(f"创建协商结果: {result['success']}")
    if not result['success']:
        print(f"  错误: {result.get('error')}")
        print(f"  完整响应: {result}")
        return
    
    new_neg_id = result["data"]["id"]
    print(f"新建协商ID: {new_neg_id}")
    
    # 销售提交
    r = requests.post(f"{BASE_URL}/negotiations/{new_neg_id}/submit",
        headers={
            "Authorization": f"Bearer {sales_token}",
            "x-idempotency-key": "test-rework-submit-2"
        })
    print(f"首次提交: {r.json()['success']}")
    
    # 经理退回待修改
    r = requests.patch(f"{BASE_URL}/negotiations/{new_neg_id}/status",
        headers={
            "Authorization": f"Bearer {manager_token}",
            "x-idempotency-key": "test-rework-require"
        },
        json={"newStatus": "REWORK_REQUIRED", "reworkNote": "需要修改补苗数量"})
    print(f"经理退回待修改: {r.json()['success']}")
    if not r.json()['success']:
        print(f"  错误: {r.json().get('error')}")
    
    # 查看协商状态
    r = requests.get(f"{BASE_URL}/negotiations/{new_neg_id}", headers={"Authorization": f"Bearer {sales_token}"})
    print(f"当前状态: {r.json()['data']['status']}")
    
    # 销售重新提交（关键测试）
    r = requests.post(f"{BASE_URL}/negotiations/{new_neg_id}/submit",
        headers={
            "Authorization": f"Bearer {sales_token}",
            "x-idempotency-key": "test-rework-submit-3"
        })
    result = r.json()
    if result["success"] and result["data"]["status"] == "MANAGER_REVIEW":
        print(f"✅ REWORK_REQUIRED后重新提交成功! 新状态: {result['data']['status']}")
    else:
        print(f"❌ REWORK_REQUIRED后重新提交失败!")
        print(f"   结果: {result}")
    
    print()
    print("=== 所有测试完成 ===")

if __name__ == "__main__":
    main()
