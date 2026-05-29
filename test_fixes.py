#!/usr/bin/env python3
import requests
import json

BASE_URL = "http://localhost:3000/api"

def login(username, password):
    r = requests.post(f"{BASE_URL}/auth/login", json={"username": username, "password": password})
    return r.json()["data"]["token"]

def main():
    print("=== 测试第二轮修复 ===\n")
    
    # 1. 登录获取token
    print("=== 1. 登录获取各角色Token ===")
    manager_token = login("manager", "manager123")
    print(f"Manager Token: {manager_token[:30]}...")
    
    worker_token = login("worker", "worker123")
    print(f"Worker Token:  {worker_token[:30]}...")
    
    sales_token = login("sales", "sales123")
    print(f"Sales Token:   {sales_token[:30]}...")
    print()
    
    # 2. 测试recentActivities按用户实体过滤
    print("=== 2. 测试recentActivities按用户实体过滤 ===")
    
    # 先让养护员创建一条养护记录
    r = requests.get(f"{BASE_URL}/plots", headers={"Authorization": f"Bearer {manager_token}"})
    plot_id = r.json()["data"][0]["id"]
    
    requests.post(f"{BASE_URL}/maintenance", 
        headers={
            "Authorization": f"Bearer {worker_token}",
            "x-idempotency-key": "test-worker-filter"
        },
        json={
            "plotId": plot_id,
            "maintenanceDate": "2025-05-20",
            "type": "WATERING",
            "durationMinutes": 60
        })
    
    # 经理查看
    r = requests.get(f"{BASE_URL}/dashboard", headers={"Authorization": f"Bearer {manager_token}"})
    items = r.json()["data"]["recentActivities"]
    types = set(x["entityType"] for x in items)
    users = set(x["user"]["name"] for x in items)
    print(f"经理看到: 数量={len(items)}, 类型={types}, 用户={users}")
    
    # 养护员查看
    r = requests.get(f"{BASE_URL}/dashboard", headers={"Authorization": f"Bearer {worker_token}"})
    items = r.json()["data"]["recentActivities"]
    types = set(x["entityType"] for x in items)
    users = set(x["user"]["name"] for x in items)
    all_self = all(u == "李养护" for u in users) if items else True
    if all_self:
        print(f"✅ 养护员仅看到自己: 数量={len(items)}, 类型={types}, 用户={users}")
    else:
        print(f"❌ 养护员看到别人: 数量={len(items)}, 类型={types}, 用户={users}")
    
    # 销售查看
    r = requests.get(f"{BASE_URL}/dashboard", headers={"Authorization": f"Bearer {sales_token}"})
    items = r.json()["data"]["recentActivities"]
    types = set(x["entityType"] for x in items)
    users = set(x["user"]["name"] for x in items)
    all_self = all(u == "王销售" for u in users) if items else True
    if all_self:
        print(f"✅ 销售仅看到自己: 数量={len(items)}, 类型={types}, 用户={users}")
    else:
        print(f"❌ 销售看到别人: 数量={len(items)}, 类型={types}, 用户={users}")
    print()
    
    # 3. 测试待办完成幂等保护
    print("=== 3. 测试待办完成幂等保护 ===")
    r = requests.get(f"{BASE_URL}/dashboard/todos", headers={"Authorization": f"Bearer {manager_token}"})
    todo_id = r.json()["data"][0]["id"]
    print(f"待办ID: {todo_id}")
    
    r = requests.patch(f"{BASE_URL}/dashboard/todos/{todo_id}/complete", 
        headers={"Authorization": f"Bearer {manager_token}"})
    result = r.json()
    if not result["success"] and "幂等键" in result.get("error", ""):
        print(f"✅ 幂等保护生效: {result['error']}")
    else:
        print(f"❌ 幂等保护失败: {result}")
    print()
    
    # 4. 测试收紧的协商状态流转
    print("=== 4. 测试收紧的协商状态流转 ===")
    r = requests.get(f"{BASE_URL}/negotiations", headers={"Authorization": f"Bearer {manager_token}"})
    neg_id = None
    for n in r.json()["data"]:
        if n["status"] == "DRAFT":
            neg_id = n["id"]
            break
    print(f"DRAFT状态协商ID: {neg_id}")
    
    # 销售尝试绕过submit直接进入MANAGER_REVIEW
    r = requests.patch(f"{BASE_URL}/negotiations/{neg_id}/status",
        headers={
            "Authorization": f"Bearer {sales_token}",
            "x-idempotency-key": "test-bypass-submit"
        },
        json={"newStatus": "MANAGER_REVIEW"})
    result = r.json()
    if not result["success"]:
        print(f"✅ 绕过submit被禁止: {result.get('error', '操作被禁止')}")
    else:
        print(f"❌ 可以绕过submit!")
    
    # 销售尝试退回DRAFT
    r = requests.patch(f"{BASE_URL}/negotiations/{neg_id}/status",
        headers={
            "Authorization": f"Bearer {sales_token}",
            "x-idempotency-key": "test-back-draft"
        },
        json={"newStatus": "DRAFT"})
    result = r.json()
    if not result["success"]:
        print(f"✅ 退回草稿被禁止: {result.get('error', '操作被禁止')}")
    else:
        print(f"❌ 可以退回草稿!")
    
    print()
    print("=== 所有测试完成 ===")

if __name__ == "__main__":
    main()
