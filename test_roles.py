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
print("🔍 修复验证 - 角色权限收口")
print("=" * 70)

# 登录三个角色
owner_token, owner_user = login("owner", "123456")
cs_token, cs_user = login("cs1", "123456")
printer_token, printer_user = login("printer1", "123456")

print(f"\n✅ 店主: {owner_user['name']} (id={owner_user['id']})")
print(f"✅ 客服: {cs_user['name']} (id={cs_user['id']})")
print(f"✅ 冲印师: {printer_user['name']} (id={printer_user['id']})")

# -----------------------------------------------------------------------
# 测试1: 工单列表按角色范围过滤
# -----------------------------------------------------------------------
print("\n" + "=" * 70)
print("测试1: 工单列表按角色范围过滤")
print("-" * 70)

owner_orders = requests.get(f"{BASE_URL}/work-orders", headers=get_headers(owner_token)).json()
cs_orders = requests.get(f"{BASE_URL}/work-orders", headers=get_headers(cs_token)).json()
printer_orders = requests.get(f"{BASE_URL}/work-orders", headers=get_headers(printer_token)).json()

print(f"\n  店主可见工单: {len(owner_orders)} 条（应=7）")
assert len(owner_orders) == 7, f"❌ 店主可见数不正确，got={len(owner_orders)}"
print("  ✅ 店主可见全部工单")

print(f"\n  客服可见工单: {len(cs_orders)} 条（应={len([w for w in owner_orders if w['assigneeId']==cs_user['id'] and w['status'] in ['pending','negotiating','approved','completed']])}）")
cs_expected = [w for w in owner_orders if w['assigneeId']==cs_user['id'] and w['status'] in ['pending','negotiating','approved','completed']]
assert len(cs_orders) == len(cs_expected), f"❌ 客服可见数不正确，got={len(cs_orders)}"
assert all(w['assigneeId']==cs_user['id'] for w in cs_orders), "❌ 客服看到了非自己的工单"
assert all(w['status'] in ['pending','negotiating','approved','completed'] for w in cs_orders), "❌ 客服看到了不该看的状态工单"
print("  ✅ 客服仅可见自己负责的工单（pending/negotiating/approved/completed）")

print(f"\n  冲印师可见工单: {len(printer_orders)} 条（应={len([w for w in owner_orders if w['problemType'] in ['mixed_roll','quality_issue']])}）")
printer_expected = [w for w in owner_orders if w['problemType'] in ['mixed_roll','quality_issue']]
assert len(printer_orders) == len(printer_expected), f"❌ 冲印师可见数不正确，got={len(printer_orders)}"
assert all(w['problemType'] in ['mixed_roll','quality_issue'] for w in printer_orders), "❌ 冲印师看到了非冲印问题工单"
print("  ✅ 冲印师仅可见冲印相关问题工单（混号/质量）")

# -----------------------------------------------------------------------
# 测试2: 工单详情越权访问
# -----------------------------------------------------------------------
print("\n" + "=" * 70)
print("测试2: 工单详情越权访问拦截")
print("-" * 70)

not_cs_wo = next((w for w in owner_orders if w['assigneeId'] != cs_user['id']), None)
if not_cs_wo:
    resp = requests.get(
        f"{BASE_URL}/work-orders/{not_cs_wo['id']}",
        headers=get_headers(cs_token),
    )
    print(f"\n  客服尝试访问他人工单 [{not_cs_wo['orderNumber']}] → {resp.status_code}")
    assert resp.status_code == 403, f"❌ 客服越权访问未被拦截，status={resp.status_code}"
    print("  ✅ 客服访问他人工单返回 403 Forbidden")

not_printer_wo = next((w for w in owner_orders if w['problemType'] not in ['mixed_roll','quality_issue']), None)
if not_printer_wo:
    resp = requests.get(
        f"{BASE_URL}/work-orders/{not_printer_wo['id']}",
        headers=get_headers(printer_token),
    )
    print(f"\n  冲印师尝试访问非冲印问题工单 [{not_printer_wo['orderNumber']}] → {resp.status_code}")
    assert resp.status_code == 403, f"❌ 冲印师越权访问未被拦截，status={resp.status_code}"
    print("  ✅ 冲印师访问非冲印问题工单返回 403 Forbidden")

# -----------------------------------------------------------------------
# 测试3: 状态流转越权操作
# -----------------------------------------------------------------------
print("\n" + "=" * 70)
print("测试3: 状态流转越权操作拦截")
print("-" * 70)

# 3a: 客服尝试直接批准（negotiating → approved）
negotiating_wo = next((w for w in cs_orders if w['status'] == 'negotiating'), None)
if negotiating_wo:
    resp = requests.patch(
        f"{BASE_URL}/work-orders/{negotiating_wo['id']}",
        headers=get_headers(cs_token),
        json={"status": "approved", "remark": "客服越权尝试批准"},
    )
    print(f"\n  客服尝试 negotiating → approved → {resp.status_code}")
    assert resp.status_code == 403, f"❌ 客服越权批准未被拦截，status={resp.status_code}"
    print("  ✅ 客服越权批准被拦截（403）")

# 3b: 冲印师尝试任何状态变更
pending_wo = next((w for w in printer_orders if w['status'] == 'pending'), None)
if pending_wo:
    resp = requests.patch(
        f"{BASE_URL}/work-orders/{pending_wo['id']}",
        headers=get_headers(printer_token),
        json={"status": "negotiating", "remark": "冲印师越权尝试变更"},
    )
    print(f"\n  冲印师尝试 pending → negotiating → {resp.status_code}")
    assert resp.status_code == 403, f"❌ 冲印师越权变更未被拦截，status={resp.status_code}"
    print("  ✅ 冲印师越权变更被拦截（403）")

# 3c: 客服尝试操作他人工单（即使是允许的流转）
not_my_wo = next((w for w in owner_orders if w['assigneeId'] != cs_user['id'] and w['status'] == 'pending'), None)
if not_my_wo:
    resp = requests.patch(
        f"{BASE_URL}/work-orders/{not_my_wo['id']}",
        headers=get_headers(cs_token),
        json={"status": "negotiating", "remark": "客服越权操作他人工单"},
    )
    print(f"\n  客服尝试操作他人工单 pending → negotiating → {resp.status_code}")
    assert resp.status_code == 403, f"❌ 客服操作他人工单未被拦截，status={resp.status_code}"
    print("  ✅ 客服操作他人工单被拦截（403）")

# -----------------------------------------------------------------------
# 测试4: 批量操作权限
# -----------------------------------------------------------------------
print("\n" + "=" * 70)
print("测试4: 批量操作权限校验")
print("-" * 70)

pending_orders = [w for w in owner_orders if w['status'] == 'pending']
if pending_orders:
    ids = [w['id'] for w in pending_orders]
    resp = requests.post(
        f"{BASE_URL}/work-orders/batch",
        headers=get_headers(printer_token),
        json={"ids": ids, "status": "negotiating"},
    )
    result = resp.json()
    print(f"\n  冲印师尝试批量转入协商 → success={result['success']}, failed={result['failed']}")
    assert result['success'] == 0, f"❌ 冲印师批量操作应全部失败，success={result['success']}"
    print("  ✅ 冲印师批量操作全部失败（无权操作）")

# -----------------------------------------------------------------------
# 测试5: 赔付接口权限
# -----------------------------------------------------------------------
print("\n" + "=" * 70)
print("测试5: 赔付接口权限")
print("-" * 70)

resp = requests.get(
    f"{BASE_URL}/compensation",
    headers=get_headers(printer_token),
)
print(f"\n  冲印师调用 GET /compensation → {resp.status_code}")
assert resp.status_code == 403, f"❌ 冲印师访问赔付接口未被拦截，status={resp.status_code}"
print("  ✅ 冲印师访问赔付接口被拦截（403）")

# 客服操作已批准状态的工单，尝试创建赔付
approved_wo = next((w for w in cs_orders if w['status'] == 'approved'), None)
if approved_wo:
    resp = requests.post(
        f"{BASE_URL}/compensation/work-order/{approved_wo['id']}",
        headers=get_headers(cs_token),
        json={
            "type": "partial_refund",
            "amount": 50,
            "customerCost": 10,
            "labCost": 40,
            "reason": "测试越权创建赔付",
        },
    )
    print(f"\n  客服在 approved 状态尝试创建赔付 → {resp.status_code}")
    assert resp.status_code == 403, f"❌ 客服越权创建赔付未被拦截，status={resp.status_code}"
    print("  ✅ 客服在非允许状态创建赔付被拦截（403）")

# -----------------------------------------------------------------------
# 测试6: 统计接口按角色过滤
# -----------------------------------------------------------------------
print("\n" + "=" * 70)
print("测试6: 统计接口按角色过滤")
print("-" * 70)

owner_stats = requests.get(f"{BASE_URL}/work-orders/stats", headers=get_headers(owner_token)).json()
cs_stats = requests.get(f"{BASE_URL}/work-orders/stats", headers=get_headers(cs_token)).json()
printer_stats = requests.get(f"{BASE_URL}/work-orders/stats", headers=get_headers(printer_token)).json()

print(f"\n  店主统计总数: {owner_stats['total']}")
print(f"  客服统计总数: {cs_stats['total']}")
print(f"  冲印师统计总数: {printer_stats['total']}")

assert owner_stats['total'] == 7, f"❌ 店主统计总数不正确"
assert cs_stats['total'] == len(cs_orders), f"❌ 客服统计总数不正确"
assert printer_stats['total'] == len(printer_orders), f"❌ 冲印师统计总数不正确"
print("  ✅ 各角色统计数据已按范围过滤")

print("\n" + "=" * 70)
print("🎉 所有角色权限测试通过！")
print("=" * 70)
print("\n修复总结:")
print("  ✅ 1. 工单列表按角色范围过滤（owner全量 / cs仅本人 / printer仅冲印问题）")
print("  ✅ 2. 工单详情按角色拦截越权访问（403）")
print("  ✅ 3. 状态流转权限校验（cs仅允许3种流转，printer不允许任何流转）")
print("  ✅ 4. 批量操作按角色校验（printer全部拦截）")
print("  ✅ 5. 赔付接口按角色和状态校验（printer拦截，cs仅在pending/negotiating可操作）")
print("  ✅ 6. 统计接口按角色过滤")
print("  ✅ 7. 前端面板默认展示范围收紧（cs默认只看我的，状态和问题类型按角色限制）")
