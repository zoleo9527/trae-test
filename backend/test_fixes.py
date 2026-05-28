#!/usr/bin/env python3
from datetime import datetime
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.main import app
from app.database import Base, get_db
from app import models
from app.auth import get_password_hash

SQLALCHEMY_DATABASE_URL = "sqlite:///./test_ship_agent.db"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base.metadata.drop_all(bind=engine)
Base.metadata.create_all(bind=engine)


def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)


def init_test_data():
    db = TestingSessionLocal()
    users = [
        models.User(
            username="admin",
            email="admin@test.com",
            full_name="Admin",
            role=models.UserRole.ADMIN,
            hashed_password=get_password_hash("admin123"),
            is_active=True
        ),
        models.User(
            username="manager",
            email="manager@test.com",
            full_name="Manager",
            role=models.UserRole.AGENT_MANAGER,
            hashed_password=get_password_hash("test123"),
            is_active=True
        ),
        models.User(
            username="site",
            email="site@test.com",
            full_name="Site",
            role=models.UserRole.SITE_COORDINATOR,
            hashed_password=get_password_hash("test123"),
            is_active=True
        ),
        models.User(
            username="document",
            email="document@test.com",
            full_name="Doc",
            role=models.UserRole.DOCUMENT_SPECIALIST,
            hashed_password=get_password_hash("test123"),
            is_active=True
        ),
        models.User(
            username="finance",
            email="finance@test.com",
            full_name="Finance",
            role=models.UserRole.FINANCE,
            hashed_password=get_password_hash("test123"),
            is_active=True
        ),
    ]
    db.add_all(users)

    berth = models.BerthPlan(
        vessel_name="测试船A", port="上海港",
        eta=datetime(2026, 6, 1, 10, 0, 0), created_by=1
    )
    db.add(berth)
    db.flush()

    payment = models.AdvancePayment(
        berth_plan_id=berth.id,
        reference_number="PAY-TEST-001",
        vendor_name="测试供应商",
        amount=5000.0,
        currency="CNY",
        payment_status=models.PaymentStatus.UNPAID,
        reimbursement_status=models.PaymentStatus.OVERDUE,
        created_by=1
    )
    db.add(payment)
    db.commit()
    db.close()


def print_test(name, passed, detail=""):
    status = "✅ PASS" if passed else "❌ FAIL"
    print(f"{status} - {name}")
    if detail and not passed:
        print(f"   详情: {detail}")


init_test_data()

print("=" * 70)
print("船舶代理系统 - 权限过滤与事务一致性验证")
print("=" * 70)

# ── A. 首页统计角色过滤 ──────────────────────────────────────────

print("\n[A1] 现场协调看首页 - pending_payments 应为 null")
print("-" * 70)
try:
    site_login = client.post("/api/token", data={"username": "site", "password": "test123"})
    site_token = site_login.json()["access_token"]
    site_headers = {"Authorization": f"Bearer {site_token}"}

    resp = client.get("/api/dashboard", headers=site_headers)
    stats = resp.json()["stats"]
    pp = stats.get("pending_payments")
    op = stats.get("overdue_payments")
    print_test("site: pending_payments 为 null", pp is None, f"实际值: {pp}")
    print_test("site: overdue_payments 为 null", op is None, f"实际值: {op}")
except Exception as e:
    print_test("site dashboard", False, str(e))

print("\n[A2] 单证专员看首页 - pending_payments 应为 null")
print("-" * 70)
try:
    doc_login = client.post("/api/token", data={"username": "document", "password": "test123"})
    doc_token = doc_login.json()["access_token"]
    doc_headers = {"Authorization": f"Bearer {doc_token}"}

    resp = client.get("/api/dashboard", headers=doc_headers)
    stats = resp.json()["stats"]
    pp = stats.get("pending_payments")
    op = stats.get("overdue_payments")
    print_test("document: pending_payments 为 null", pp is None, f"实际值: {pp}")
    print_test("document: overdue_payments 为 null", op is None, f"实际值: {op}")
except Exception as e:
    print_test("document dashboard", False, str(e))

print("\n[A3] 管理员看首页 - pending_payments 应有数值")
print("-" * 70)
try:
    admin_login = client.post("/api/token", data={"username": "admin", "password": "admin123"})
    admin_token = admin_login.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    resp = client.get("/api/dashboard", headers=admin_headers)
    stats = resp.json()["stats"]
    pp = stats.get("pending_payments")
    op = stats.get("overdue_payments")
    print_test("admin: pending_payments 为数字", isinstance(pp, int), f"实际值: {pp}")
    print_test("admin: overdue_payments 为数字", isinstance(op, int), f"实际值: {op}")
except Exception as e:
    print_test("admin dashboard", False, str(e))

print("\n[A4] 财务看首页 - pending_payments 应有数值")
print("-" * 70)
try:
    fin_login = client.post("/api/token", data={"username": "finance", "password": "test123"})
    fin_token = fin_login.json()["access_token"]
    fin_headers = {"Authorization": f"Bearer {fin_token}"}

    resp = client.get("/api/dashboard", headers=fin_headers)
    stats = resp.json()["stats"]
    pp = stats.get("pending_payments")
    op = stats.get("overdue_payments")
    print_test("finance: pending_payments 为数字", isinstance(pp, int), f"实际值: {pp}")
    print_test("finance: overdue_payments 为数字", isinstance(op, int), f"实际值: {op}")
except Exception as e:
    print_test("finance dashboard", False, str(e))

# ── B. 事务一致性：创建+审计同一事务 ────────────────────────────

print("\n[B1] 靠泊计划创建 + 审计 - 同一事务")
print("-" * 70)
try:
    resp = client.post(
        "/api/berths",
        headers=admin_headers,
        json={"vessel_name": "事务测试船", "port": "深圳港", "eta": "2026-07-01T08:00:00"}
    )
    berth_id = resp.json().get("id")
    print_test("靠泊创建成功", resp.status_code == 201, f"状态码: {resp.status_code}")

    audit_resp = client.get(
        f"/api/audit?resource_type=berth_plan&resource_id={berth_id}",
        headers=admin_headers
    )
    logs = audit_resp.json()
    create_logs = [l for l in logs if l.get("action") == "create"]
    print_test("靠泊创建有审计记录", len(create_logs) == 1, f"记录数: {len(create_logs)}")
except Exception as e:
    print_test("靠泊创建+审计", False, str(e))

print("\n[B2] 船员换班创建 + 审计 - 同一事务")
print("-" * 70)
try:
    berth_list_resp = client.get("/api/berths", headers=admin_headers)
    berth_list = berth_list_resp.json()
    berth_plan_id = berth_list[0]["id"] if berth_list else 1

    resp = client.post(
        "/api/crew",
        headers=admin_headers,
        json={
            "berth_plan_id": berth_plan_id,
            "change_type": "sign_on",
            "crew_name": "测试船员",
            "crew_rank": "船长",
            "nationality": "中国"
        }
    )
    crew_id = resp.json().get("id")
    print_test("换班创建成功", resp.status_code == 201, f"状态码: {resp.status_code}")

    audit_resp = client.get(
        f"/api/audit?resource_type=crew_change&resource_id={crew_id}",
        headers=admin_headers
    )
    logs = audit_resp.json()
    create_logs = [l for l in logs if l.get("action") == "create"]
    print_test("换班创建有审计记录", len(create_logs) == 1, f"记录数: {len(create_logs)}")
except Exception as e:
    print_test("换班创建+审计", False, str(e))

print("\n[B3] 截点创建 + 审计 - 同一事务")
print("-" * 70)
try:
    resp = client.post(
        "/api/checkpoints",
        headers=admin_headers,
        json={
            "title": "测试截点",
            "checkpoint_type": "document",
            "due_date": "2026-07-15T10:00:00"
        }
    )
    cp_id = resp.json().get("id")
    print_test("截点创建成功", resp.status_code == 201, f"状态码: {resp.status_code}")

    audit_resp = client.get(
        f"/api/audit?resource_type=checkpoint&resource_id={cp_id}",
        headers=admin_headers
    )
    logs = audit_resp.json()
    create_logs = [l for l in logs if l.get("action") == "create"]
    print_test("截点创建有审计记录", len(create_logs) == 1, f"记录数: {len(create_logs)}")
except Exception as e:
    print_test("截点创建+审计", False, str(e))

print("\n[B4] 垫付创建 + 审计 - 同一事务")
print("-" * 70)
try:
    berth_list_resp = client.get("/api/berths", headers=admin_headers)
    berth_list = berth_list_resp.json()
    berth_plan_id = berth_list[0]["id"] if berth_list else 1

    resp = client.post(
        "/api/payments",
        headers=admin_headers,
        json={
            "berth_plan_id": berth_plan_id,
            "reference_number": "PAY-TEST-002",
            "vendor_name": "事务测试供应商",
            "amount": 3000.0,
            "currency": "CNY"
        }
    )
    pay_id = resp.json().get("id")
    print_test("垫付创建成功", resp.status_code == 201, f"状态码: {resp.status_code}")

    audit_resp = client.get(
        f"/api/audit?resource_type=payment&resource_id={pay_id}",
        headers=admin_headers
    )
    logs = audit_resp.json()
    create_logs = [l for l in logs if l.get("action") == "create"]
    print_test("垫付创建有审计记录", len(create_logs) == 1, f"记录数: {len(create_logs)}")
except Exception as e:
    print_test("垫付创建+审计", False, str(e))

print("\n[B5] 沟通记录创建 + 审计 - 同一事务")
print("-" * 70)
try:
    resp = client.post(
        "/api/communications",
        headers=admin_headers,
        json={
            "communication_type": "email",
            "subject": "事务测试邮件",
            "content": "验证沟通记录审计",
            "sender": "admin@test.com",
            "recipient": "port@test.com"
        }
    )
    comm_id = resp.json().get("id")
    print_test("沟通创建成功", resp.status_code == 201, f"状态码: {resp.status_code}")

    audit_resp = client.get(
        f"/api/audit?resource_type=communication&resource_id={comm_id}",
        headers=admin_headers
    )
    logs = audit_resp.json()
    create_logs = [l for l in logs if l.get("action") == "create"]
    print_test("沟通创建有审计记录", len(create_logs) == 1, f"记录数: {len(create_logs)}")
except Exception as e:
    print_test("沟通创建+审计", False, str(e))

print("\n[B6] 用户创建 + 审计 - 同一事务")
print("-" * 70)
try:
    resp = client.post(
        "/api/users",
        headers=admin_headers,
        json={
            "username": "tx_test_user",
            "email": "tx@test.com",
            "full_name": "事务测试",
            "role": "site_coordinator",
            "password": "test123"
        }
    )
    user_id = resp.json().get("id")
    print_test("用户创建成功", resp.status_code == 200, f"状态码: {resp.status_code}")

    audit_resp = client.get(
        f"/api/audit?resource_type=user&resource_id={user_id}",
        headers=admin_headers
    )
    logs = audit_resp.json()
    create_logs = [l for l in logs if l.get("action") == "create"]
    print_test("用户创建有审计记录", len(create_logs) == 1, f"记录数: {len(create_logs)}")
except Exception as e:
    print_test("用户创建+审计", False, str(e))

# ── C. 更新操作审计前后值 ────────────────────────────────────────

print("\n[C1] 更新截点状态 - 审计前后值完整")
print("-" * 70)
try:
    cp_list_resp = client.get("/api/checkpoints", headers=admin_headers)
    cp_list = cp_list_resp.json()
    if cp_list:
        cp = cp_list[0]
        cp_id = cp["id"]
        cp_version = cp["version"]

        update_resp = client.put(
            f"/api/checkpoints/{cp_id}",
            headers=admin_headers,
            json={"status": "in_progress", "version": cp_version}
        )
        print_test("截点更新成功", update_resp.status_code == 200, f"状态码: {update_resp.status_code}")

        audit_resp = client.get(
            f"/api/audit?resource_type=checkpoint&resource_id={cp_id}",
            headers=admin_headers
        )
        logs = audit_resp.json()
        update_logs = [l for l in logs if l.get("action") == "update"]
        if update_logs:
            old_status = update_logs[0]["old_values"].get("status")
            new_status = update_logs[0]["new_values"].get("status")
            print_test("旧状态为 pending", old_status == "pending", f"实际: {old_status}")
            print_test("新状态为 in_progress", new_status == "in_progress", f"实际: {new_status}")
        else:
            print_test("截点更新审计存在", False, "未找到更新审计日志")
    else:
        print_test("截点更新测试", False, "无截点数据")
except Exception as e:
    print_test("截点更新审计", False, str(e))

print("\n" + "=" * 70)
print("验证完成")
print("=" * 70)

try:
    os.remove("test_ship_agent.db")
except Exception:
    pass
