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
print("🔍 修复验证 - 赔付审批回写一致性 + 冲印师越权接口")
print("=" * 70)

owner_token, owner_user = login("owner", "123456")
cs_token, cs_user = login("cs1", "123456")
printer_token, printer_user = login("printer1", "123456")

print(f"\n✅ 店主: {owner_user['name']} | 客服: {cs_user['name']} | 冲印师: {printer_user['name']}")

# -----------------------------------------------------------------------
# 测试1: 批准赔付时 reviewConclusion 与 compensation.ownerReview 一致性
# -----------------------------------------------------------------------
print("\n" + "=" * 70)
print("测试1: 批准赔付时 reviewConclusion ↔ ownerReview 同步")
print("-" * 70)

all_orders = requests.get(f"{BASE_URL}/work-orders", headers=get_headers(owner_token)).json()
reviewing = next((w for w in all_orders if w["status"] == "reviewing"), None)

if not reviewing:
    negotiating = next((w for w in all_orders if w["status"] == "negotiating"), None)
    if negotiating:
        requests.patch(
            f"{BASE_URL}/work-orders/{negotiating['id']}",
            headers=get_headers(cs_token),
            json={"status": "reviewing", "remark": "提交复核"},
        )
        reviewing = negotiating

if reviewing:
    detail = requests.get(
        f"{BASE_URL}/work-orders/{reviewing['id']}",
        headers=get_headers(owner_token),
    ).json()

    if not detail.get("compensation"):
        requests.post(
            f"{BASE_URL}/compensation/work-order/{reviewing['id']}",
            headers=get_headers(cs_token),
            json={
                "type": "partial_refund",
                "amount": 88,
                "customerCost": 12,
                "labCost": 76,
                "reason": "胶卷混号赔付",
            },
        )

    review_text = "经核实确认混号事实，同意按方案赔付。后续需更新混号检测SOP。"

    # 1a: 先保存复核结论，再批准（模拟前端：批准时携带 reviewConclusion）
    print("\n  场景A: 批准时携带 reviewConclusion")
    approve_resp = requests.patch(
        f"{BASE_URL}/work-orders/{reviewing['id']}",
        headers=get_headers(owner_token),
        json={
            "status": "approved",
            "reviewConclusion": review_text,
        },
    ).json()

    compensation = requests.get(
        f"{BASE_URL}/compensation/work-order/{reviewing['id']}",
        headers=get_headers(owner_token),
    ).json()

    wo_conclusion = approve_resp.get("reviewConclusion", "")
    comp_review = compensation.get("ownerReview", "")

    print(f"    工单 reviewConclusion: {wo_conclusion[:50]}...")
    print(f"    赔付 ownerReview:      {comp_review[:50]}...")

    assert wo_conclusion == review_text, f"❌ 工单 reviewConclusion 不一致！got={wo_conclusion}"
    assert comp_review == review_text, f"❌ 赔付 ownerReview 不一致！got={comp_review}"
    assert comp_review == wo_conclusion, "❌ reviewConclusion 与 ownerReview 脱节！"
    print("  ✅ reviewConclusion == ownerReview，完全一致")

    # 1b: 批准后再次编辑复核结论，compensation.ownerReview 应同步
    print("\n  场景B: 批准后再次编辑复核结论")
    updated_conclusion = review_text + "【追加】已通知冲印组加强混号核验。"
    edit_resp = requests.patch(
        f"{BASE_URL}/work-orders/{reviewing['id']}",
        headers=get_headers(owner_token),
        json={"reviewConclusion": updated_conclusion},
    ).json()

    compensation2 = requests.get(
        f"{BASE_URL}/compensation/work-order/{reviewing['id']}",
        headers=get_headers(owner_token),
    ).json()

    wo_conclusion2 = edit_resp.get("reviewConclusion", "")
    comp_review2 = compensation2.get("ownerReview", "")

    print(f"    工单 reviewConclusion: {wo_conclusion2[:50]}...")
    print(f"    赔付 ownerReview:      {comp_review2[:50]}...")

    assert comp_review2 == updated_conclusion, f"❌ 编辑后 ownerReview 未同步！got={comp_review2}"
    assert wo_conclusion2 == updated_conclusion, f"❌ 编辑后 reviewConclusion 未更新！got={wo_conclusion2}"
    print("  ✅ 编辑复核结论后 ownerReview 同步更新")

# -----------------------------------------------------------------------
# 测试2: 冲印师不可见私有备注（enrichWorkOrder + getNotes 双端验证）
# -----------------------------------------------------------------------
print("\n" + "=" * 70)
print("测试2: 冲印师私有备注越权修复")
print("-" * 70)

all_orders2 = requests.get(f"{BASE_URL}/work-orders", headers=get_headers(owner_token)).json()
order_with_private = None
for wo in all_orders2:
    if any(n.get("isPrivate") for n in wo.get("notes", [])):
        order_with_private = wo
        break

if not order_with_private:
    target = next((w for w in all_orders2 if len(w.get("notes", [])) > 0), all_orders2[0])
    requests.post(
        f"{BASE_URL}/work-orders/{target['id']}/notes",
        headers=get_headers(cs_token),
        json={
            "content": "这是一条内部私有备注，冲印师不应看到",
            "type": "internal",
            "isPrivate": True,
        },
    )
    order_with_private = requests.get(
        f"{BASE_URL}/work-orders/{target['id']}",
        headers=get_headers(owner_token),
    ).json()

if order_with_private:
    wo_id = order_with_private["id"]
    owner_private = [n for n in order_with_private.get("notes", []) if n.get("isPrivate")]
    print(f"  店主可见私有备注: {len(owner_private)} 条")

    printer_detail = requests.get(
        f"{BASE_URL}/work-orders/{wo_id}",
        headers=get_headers(printer_token),
    ).json()
    printer_notes = printer_detail.get("notes", [])
    printer_private = [n for n in printer_notes if n.get("isPrivate")]
    print(f"  冲印师 GET /work-orders/:id 可见私有备注: {len(printer_private)} 条")
    assert len(printer_private) == 0, "❌ 冲印师通过详情接口看到了私有备注！"
    print("  ✅ 详情接口(enrichWorkOrder): 冲印师不可见私有备注")

    printer_notes_resp = requests.get(
        f"{BASE_URL}/work-orders/{wo_id}/notes",
        headers=get_headers(printer_token),
    ).json()
    printer_notes2 = [n for n in printer_notes_resp if n.get("isPrivate")]
    print(f"  冲印师 GET /work-orders/:id/notes 可见私有备注: {len(printer_notes2)} 条")
    assert len(printer_notes2) == 0, "❌ 冲印师通过 notes 接口看到了私有备注！"
    print("  ✅ 备注接口(getNotes): 冲印师不可见私有备注")

print("\n" + "=" * 70)
print("🎉 所有修复验证通过！")
print("=" * 70)
print("\n修复总结:")
print("  ✅ 1. 批准赔付时 reviewConclusion ↔ compensation.ownerReview 一致")
print("  ✅ 2. 批准后编辑复核结论，ownerReview 同步回写")
print("  ✅ 3. 冲印师通过 enrichWorkOrder 不可见私有备注")
print("  ✅ 4. 冲印师通过 getNotes 接口不可见私有备注")
