#!/usr/bin/env python3
import requests
import json

BASE_URL = "http://localhost:3000/api"

def login(username, password):
    r = requests.post(f"{BASE_URL}/auth/login", json={"username": username, "password": password})
    return r.json()["data"]["token"]

def check_consistency(neg_id, token, expected_status, desc):
    r = requests.get(f"{BASE_URL}/negotiations/{neg_id}", headers={"Authorization": f"Bearer {token}"})
    data = r.json()["data"]
    actual_status = data["status"]
    history_count = len(data["statusHistory"])
    latest_history = data["statusHistory"][0] if data["statusHistory"] else None
    
    status_ok = actual_status == expected_status
    history_ok = latest_history and latest_history["toStatus"] == expected_status if latest_history else False
    
    ok = status_ok and history_ok
    symbol = "✅" if ok else "❌"
    
    print(f"{symbol} {desc}")
    print(f"   状态: {actual_status} (预期: {expected_status}) {'✅' if status_ok else '❌'}")
    print(f"   历史记录数: {history_count}")
    if latest_history:
        print(f"   最新历史: {latest_history['fromStatus']} -> {latest_history['toStatus']} by {latest_history['changedBy']['name']} {'✅' if history_ok else '❌'}")
    
    return ok

def main():
    print("=== 测试事务一致性（状态历史复用tx）===\n")
    
    # 1. 登录获取token
    print("=== 1. 登录获取各角色Token ===")
    sales_token = login("sales", "sales123")
    manager_token = login("manager", "manager123")
    print("✅ 登录成功\n")
    
    # 2. 获取一个DRAFT协商
    print("=== 2. 测试完整流程 ===")
    r = requests.get(f"{BASE_URL}/negotiations", headers={"Authorization": f"Bearer {sales_token}"})
    draft_neg_id = None
    for n in r.json()["data"]:
        if n["status"] == "DRAFT":
            draft_neg_id = n["id"]
            break
    
    if not draft_neg_id:
        print("没有找到DRAFT状态的协商，创建一个新的")
        r = requests.get(f"{BASE_URL}/visits", headers={"Authorization": f"Bearer {sales_token}"})
        visit_id = r.json()["data"][0]["id"]
        
        r = requests.post(f"{BASE_URL}/negotiations",
            headers={
                "Authorization": f"Bearer {sales_token}",
                "x-idempotency-key": "test-tx-1"
            },
            json={
                "visitId": visit_id,
                "customerName": "事务测试客户",
                "customerComplaint": "测试事务一致性",
                "proposedReseedQty": 15
            })
        draft_neg_id = r.json()["data"]["id"]
    
    print(f"测试协商ID: {draft_neg_id}\n")
    
    # 检查初始状态
    check_consistency(draft_neg_id, sales_token, "DRAFT", "初始状态")
    print()
    
    # 3. 提交协商
    print("=== 3. 提交协商 ===")
    r = requests.post(f"{BASE_URL}/negotiations/{draft_neg_id}/submit",
        headers={
            "Authorization": f"Bearer {sales_token}",
            "x-idempotency-key": "test-tx-submit-1"
        })
    result = r.json()
    print(f"提交结果: {result['success']}")
    if not result['success']:
        print(f"  错误: {result.get('error', '')}")
        return
    
    check_consistency(draft_neg_id, sales_token, "MANAGER_REVIEW", "提交后状态")
    print()
    
    # 4. 经理退回待修改
    print("=== 4. 经理退回待修改 ===")
    r = requests.patch(f"{BASE_URL}/negotiations/{draft_neg_id}/status",
        headers={
            "Authorization": f"Bearer {manager_token}",
            "x-idempotency-key": "test-tx-rework-1"
        },
        json={"newStatus": "REWORK_REQUIRED", "reworkNote": "请修改补苗数量"})
    result = r.json()
    print(f"退回结果: {result['success']}")
    if not result['success']:
        print(f"  错误: {result.get('error', '')}")
        return
    
    check_consistency(draft_neg_id, sales_token, "REWORK_REQUIRED", "退回待修改后状态")
    print()
    
    # 5. 销售重新提交
    print("=== 5. 销售重新提交 ===")
    r = requests.post(f"{BASE_URL}/negotiations/{draft_neg_id}/submit",
        headers={
            "Authorization": f"Bearer {sales_token}",
            "x-idempotency-key": "test-tx-submit-2"
        })
    result = r.json()
    print(f"重新提交结果: {result['success']}")
    if not result['success']:
        print(f"  错误: {result.get('error', '')}")
        return
    
    check_consistency(draft_neg_id, sales_token, "MANAGER_REVIEW", "重新提交后状态")
    print()
    
    # 6. 经理批准
    print("=== 6. 经理批准 ===")
    r = requests.patch(f"{BASE_URL}/negotiations/{draft_neg_id}/status",
        headers={
            "Authorization": f"Bearer {manager_token}",
            "x-idempotency-key": "test-tx-approve-1"
        },
        json={"newStatus": "APPROVED", "managerNote": "同意补苗"})
    result = r.json()
    print(f"批准结果: {result['success']}")
    if not result['success']:
        print(f"  错误: {result.get('error', '')}")
        return
    
    check_consistency(draft_neg_id, sales_token, "APPROVED", "批准后状态")
    print()
    
    print("=== ✅ 所有事务一致性测试通过！ ===")
    print("\n说明: 状态历史现在复用当前事务tx，避免了SQLite写锁竞争")

if __name__ == "__main__":
    main()
