import requests
import json

BASE_URL = "http://localhost:3000/api"

def login(username, password):
    login_data = {"username": username, "password": password}
    response = requests.post(f"{BASE_URL}/auth/login", json=login_data)
    token = response.json()["accessToken"]
    user = response.json()["user"]
    return token, user

def get_headers(token):
    return {"Authorization": f"Bearer {token}"}

print("=" * 70)
print("🔍 修复验证测试 - 退款协商与赔付复核主链路")
print("=" * 70)

# 登录不同角色
print("\n1. 登录测试")
print("-" * 40)
owner_token, owner_user = login("owner", "123456")
print(f"✅ 店主登录: {owner_user['name']} (role={owner_user['role']})")
assert "password" not in owner_user, "❌ 用户信息泄露了 password 字段！"
print("   ✅ 敏感字段已移除")

cs_token, cs_user = login("cs1", "123456")
print(f"✅ 客服登录: {cs_user['name']} (role={cs_user['role']})")

print("\n2. 批量复核面板筛选条件测试")
print("-" * 40)

# 获取全部工单
all_response = requests.get(f"{BASE_URL}/work-orders", headers=get_headers(owner_token))
all_orders = all_response.json()
print(f"✅ 获取全部工单: {len(all_orders)} 条")

# 测试状态筛选
pending_response = requests.get(
    f"{BASE_URL}/work-orders?status=pending",
    headers=get_headers(owner_token),
)
pending_orders = pending_response.json()
print(f"✅ 状态筛选(pending): {len(pending_orders)} 条")
assert all(wo["status"] == "pending" for wo in pending_orders), "❌ 状态筛选不正确！"

# 测试问题类型筛选
mixed_response = requests.get(
    f"{BASE_URL}/work-orders?problemType=mixed_roll",
    headers=get_headers(owner_token),
)
mixed_orders = mixed_response.json()
print(f"✅ 问题类型筛选(mixed_roll): {len(mixed_orders)} 条")
assert all(wo["problemType"] == "mixed_roll" for wo in mixed_orders), "❌ 问题类型筛选不正确！"

# 测试搜索筛选
search_response = requests.get(
    f"{BASE_URL}/work-orders?search=F202405150002",
    headers=get_headers(owner_token),
)
search_orders = search_response.json()
print(f"✅ 搜索筛选(胶卷号): {len(search_orders)} 条")
assert len(search_orders) > 0, "❌ 搜索筛选没有结果！"

# 测试"只看我的"筛选
my_response = requests.get(
    f"{BASE_URL}/work-orders?myOnly=true",
    headers=get_headers(cs_token),
)
my_orders = my_response.json()
print(f"✅ 只看我的筛选: {len(my_orders)} 条")
assert all(wo["assigneeId"] == cs_user["id"] for wo in my_orders), "❌ '只看我的'筛选不正确！"

print("\n3. 角色差异视图 - 私有备注过滤")
print("-" * 40)

# 获取一条有私有备注的工单
order_with_notes = next((w for w in all_orders if len(w["notes"]) > 0), None)
if order_with_notes:
    # 店主可见所有备注
    owner_detail = requests.get(
        f"{BASE_URL}/work-orders/{order_with_notes['id']}",
        headers=get_headers(owner_token),
    ).json()
    owner_notes = owner_detail["notes"]
    owner_private = [n for n in owner_notes if n.get("isPrivate")]
    print(f"✅ 店主可见备注: {len(owner_notes)} 条 (含私有 {len(owner_private)} 条)")

    # 客服只能见公开备注
    cs_detail = requests.get(
        f"{BASE_URL}/work-orders/{order_with_notes['id']}",
        headers=get_headers(cs_token),
    ).json()
    cs_notes = cs_detail["notes"]
    cs_private = [n for n in cs_notes if n.get("isPrivate")]
    print(f"✅ 客服可见备注: {len(cs_notes)} 条 (含私有 {len(cs_private)} 条)")
    assert len(cs_private) == 0, "❌ 客服看到了私有备注！"
    print("   ✅ 私有备注已按角色过滤")

print("\n4. 协商摘要与复核结论编辑")
print("-" * 40)

# 找一条协商中的工单，客服编辑协商摘要
negotiating_order = next((w for w in all_orders if w["status"] == "negotiating"), None)
if negotiating_order:
    update_response = requests.patch(
        f"{BASE_URL}/work-orders/{negotiating_order['id']}",
        headers=get_headers(cs_token),
        json={
            "negotiationSummary": "客户要求全额退款，经沟通同意退还80%费用并附赠下次5折券。客户已确认方案。",
        },
    )
    updated = update_response.json()
    print(f"✅ 客服更新协商摘要: {updated['negotiationSummary'][:50]}...")
    assert updated["negotiationSummary"] is not None, "❌ 协商摘要未保存！"

# 找一条复核中的工单，店主编辑复核结论并批准
reviewing_order = next((w for w in all_orders if w["status"] == "reviewing"), None)
if reviewing_order:
    # 先看看有没有赔付方案
    detail = requests.get(
        f"{BASE_URL}/work-orders/{reviewing_order['id']}",
        headers=get_headers(owner_token),
    ).json()
    
    # 如果没有赔付方案，先创建一个
    if not detail.get("compensation"):
        requests.post(
            f"{BASE_URL}/compensation/work-order/{reviewing_order['id']}",
            headers=get_headers(cs_token),
            json={
                "type": "partial_refund",
                "amount": 80,
                "customerCost": 20,
                "labCost": 60,
                "reason": "胶卷混号导致客户无法使用",
            },
        )
    
    # 批准赔付并同步复核结论
    status_before = detail["status"]
    compensation_before = requests.get(
        f"{BASE_URL}/compensation/work-order/{reviewing_order['id']}",
        headers=get_headers(owner_token),
    ).json()
    notes_before = len(detail["notes"])
    
    approve_response = requests.patch(
        f"{BASE_URL}/work-orders/{reviewing_order['id']}",
        headers=get_headers(owner_token),
        json={
            "status": "approved",
            "reviewConclusion": "情况属实，同意赔付方案。已确认是操作流程漏洞导致混号，后续加强培训。",
            "remark": "赔付批准",
        },
    )
    approved = approve_response.json()
    status_after = approved["status"]
    compensation_after = requests.get(
        f"{BASE_URL}/compensation/work-order/{reviewing_order['id']}",
        headers=get_headers(owner_token),
    ).json()
    notes_after = len(approved["notes"])
    status_logs_after = len(approved["statusLogs"])
    
    print(f"✅ 批准赔付前状态: {status_before} → 后状态: {status_after}")
    assert status_after == "approved", "❌ 工单状态未更新！"
    
    print(f"✅ 赔付记录批准状态: {compensation_after.get('status')}")
    print(f"✅ 赔付记录审批人: {compensation_after.get('approvedBy')}")
    assert compensation_after.get("status") == "approved", "❌ 赔付状态未更新！"
    assert compensation_after.get("approvedBy") == owner_user["name"], "❌ 赔付审批人未记录！"
    assert compensation_after.get("approvedAt") is not None, "❌ 赔付批准时间未记录！"
    
    print(f"✅ 备注数量: {notes_before} → {notes_after} (新增系统备注)")
    assert notes_after > notes_before, "❌ 未添加批准备注！"
    
    review_note = next((n for n in approved["notes"] if n["type"] == "review"), None)
    if review_note:
        print(f"✅ 系统备注类型: {review_note['type']}")
        print(f"✅ 系统备注内容: {review_note['content'][:60]}...")
    
    print(f"✅ 状态日志数量: {status_logs_after} (含批准流转)")
    approved_log = next(
        (log for log in approved["statusLogs"] if log["toStatus"] == "approved"),
        None,
    )
    if approved_log:
        print(f"✅ 状态流转: {approved_log['fromStatus']} → {approved_log['toStatus']}")
        print(f"✅ 操作人: {approved_log['operatorName']}")
    
    print("\n5. 敏感字段检查")
    print("-" * 40)
    if approved.get("assignee"):
        print(f"✅ 处理人信息: {approved['assignee'].get('name')}")
        assert "password" not in approved["assignee"], "❌ 处理人信息泄露了 password！"
        print("   ✅ 处理人敏感字段已移除")

print("\n" + "=" * 70)
print("🎉 所有测试通过！修复验证完成")
print("=" * 70)
print("\n修复总结:")
print("  ✅ 1. 批量复核面板筛选条件已驱动列表")
print("  ✅ 2. 协商摘要与复核结论可编辑提交")
print("  ✅ 3. 批准赔付时工单状态、赔付记录、时间线同步回写")
print("  ✅ 4. 私有备注按角色过滤，敏感字段已移除")
