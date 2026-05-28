#!/usr/bin/env python3
from datetime import datetime, timedelta
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

SQLALCHEMY_DATABASE_URL = "sqlite:///./test_overdue.db"
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
    now = datetime.now()

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
            username="finance",
            email="finance@test.com",
            full_name="Finance",
            role=models.UserRole.FINANCE,
            hashed_password=get_password_hash("test123"),
            is_active=True
        ),
    ]
    db.add_all(users)
    db.flush()

    berth = models.BerthPlan(
        vessel_name="测试船A", port="上海港",
        eta=now + timedelta(days=5), created_by=1
    )
    db.add(berth)
    db.flush()
    berth_id = berth.id

    crew = models.CrewChange(
        berth_plan_id=berth_id,
        change_type=models.CrewChangeType.SIGN_ON,
        crew_name="测试船员1",
        crew_rank="船长",
        nationality="中国",
        status=models.TaskStatus.PENDING,
        created_by=1
    )
    db.add(crew)
    db.flush()
    crew_id = crew.id

    checkpoints = [
        models.CheckpointReminder(
            berth_plan_id=berth_id,
            crew_change_id=crew_id,
            title="已超期-护照审核",
            checkpoint_type="document",
            due_date=now - timedelta(days=3),
            status=models.TaskStatus.PENDING,
            priority=1,
            assigned_to=1
        ),
        models.CheckpointReminder(
            berth_plan_id=berth_id,
            title="已超期-引水申请",
            checkpoint_type="port_service",
            due_date=now - timedelta(days=1),
            status=models.TaskStatus.IN_PROGRESS,
            priority=2,
            assigned_to=1
        ),
        models.CheckpointReminder(
            berth_plan_id=berth_id,
            crew_change_id=crew_id,
            title="未超期-机票预订",
            checkpoint_type="travel",
            due_date=now + timedelta(days=5),
            status=models.TaskStatus.PENDING,
            priority=2,
            assigned_to=1
        ),
        models.CheckpointReminder(
            berth_plan_id=berth_id,
            title="已完成的超期截点",
            checkpoint_type="other",
            due_date=now - timedelta(days=7),
            status=models.TaskStatus.COMPLETED,
            priority=3,
            assigned_to=1
        ),
    ]
    db.add_all(checkpoints)
    db.commit()
    db.close()


def print_test(name, passed, detail=""):
    status = "✅ PASS" if passed else "❌ FAIL"
    print(f"{status} - {name}")
    if detail and not passed:
        print(f"   详情: {detail}")


def get_token(username, password):
    resp = client.post("/api/token", data={"username": username, "password": password})
    return resp.json()["access_token"]


init_test_data()

print("=" * 70)
print("船舶代理系统 - 首页 overdue_items 验证")
print("=" * 70)

# ── 管理员：有权看到 crew 信息 ─────────────────────────────────────

print("\n[1] 管理员 - overdue_items 返回正确")
print("-" * 70)

admin_token = get_token("admin", "admin123")
admin_headers = {"Authorization": f"Bearer {admin_token}"}
resp = client.get("/api/dashboard", headers=admin_headers)
data = resp.json()
stats = data["stats"]
overdue_items = data.get("overdue_items", [])

print_test("响应包含 overdue_items 字段", "overdue_items" in data)
print_test("overdue_checkpoints 统计=2", stats["overdue_checkpoints"] == 2, f"实际: {stats['overdue_checkpoints']}")
print_test("overdue_items 返回 2 条", len(overdue_items) == 2, f"实际: {len(overdue_items)}")

if len(overdue_items) >= 2:
    cp1 = overdue_items[0]
    cp2 = overdue_items[1]

    print_test("第1条 - 最早超期的护照审核", cp1["title"] == "已超期-护照审核")
    print_test("第1条 - 优先级=1", cp1["priority"] == 1)
    print_test("第1条 - 状态=pending", cp1["status"] == "pending")
    print_test("第1条 - 包含船舶上下文", "船舶: 测试船A" in (cp1.get("context") or ""), f"context: {cp1.get('context')}")
    print_test("第1条 - 包含船员上下文", "船员: 测试船员1 - sign_on" in (cp1.get("context") or ""), f"context: {cp1.get('context')}")

    print_test("第2条 - 引水申请", cp2["title"] == "已超期-引水申请")
    print_test("第2条 - 优先级=2", cp2["priority"] == 2)
    print_test("第2条 - 状态=in_progress", cp2["status"] == "in_progress")
    print_test("第2条 - 包含船舶上下文", "船舶: 测试船A" in (cp2.get("context") or ""), f"context: {cp2.get('context')}")
    print_test("第2条 - 不包含船员上下文(crew_change_id=null)", "船员:" not in (cp2.get("context") or ""), f"context: {cp2.get('context')}")

# ── 财务角色：crew 信息过滤 ────────────────────────────────────────

print("\n[2] 财务角色 - overdue_items 过滤 crew 信息")
print("-" * 70)

finance_token = get_token("finance", "test123")
finance_headers = {"Authorization": f"Bearer {finance_token}"}
resp = client.get("/api/dashboard", headers=finance_headers)
data = resp.json()
stats = data["stats"]
overdue_items = data.get("overdue_items", [])

print_test("overdue_items 存在", "overdue_items" in data)
print_test("overdue_items 返回 2 条", len(overdue_items) == 2, f"实际: {len(overdue_items)}")

if len(overdue_items) >= 2:
    cp1 = overdue_items[0]
    print_test("第1条 - 包含船舶上下文", "船舶: 测试船A" in (cp1.get("context") or ""), f"context: {cp1.get('context')}")
    print_test("第1条 - 不包含船员上下文", "船员:" not in (cp1.get("context") or ""), f"context: {cp1.get('context')}")

print_test("total_crew_changes = null", stats.get("total_crew_changes") is None, f"实际: {stats.get('total_crew_changes')}")

# ── 验证 pending_items 也有 context ─────────────────────────────────

print("\n[3] pending_items 补充了 context 字段")
print("-" * 70)

pending_items = data.get("pending_items", [])
checkpoint_items = [item for item in pending_items if item["type"] == "checkpoint"]

print_test("有 checkpoint 类型的 pending_item", len(checkpoint_items) > 0)

if checkpoint_items:
    cp = checkpoint_items[0]
    print_test("checkpoint pending 包含 context 字段", "context" in cp)
    print_test("checkpoint context 有船舶信息", "船舶: 测试船A" in (cp.get("context") or ""), f"context: {cp.get('context')}")

# ── 验证 rejected_items / need_review_items 也有 context ─────────

print("\n[4] rejected_items 与 need_review_items 补充了 context 字段")
print("-" * 70)

rejected_items = data.get("rejected_items", [])
need_review_items = data.get("need_review_items", [])
print_test("rejected_items 字段存在", "rejected_items" in data)
print_test("need_review_items 字段存在", "need_review_items" in data)

# ── 回归：原有功能不受影响 ─────────────────────────────────────────

print("\n[5] 回归 - 原有字段保持正确")
print("-" * 70)
print_test("pending_tasks 是数字", isinstance(stats.get("pending_tasks"), int))
print_test("active_berths 是数字", isinstance(stats.get("active_berths"), int))
print_test("pending_payments = 0", stats.get("pending_payments") == 0)

# ── 逾期排序：最早超期的排最前 ────────────────────────────────────

print("\n[6] 逾期截点按截止时间升序排列")
print("-" * 70)
if len(overdue_items) >= 2:
    due1 = datetime.fromisoformat(overdue_items[0]["due_date"].replace("Z", "+00:00"))
    due2 = datetime.fromisoformat(overdue_items[1]["due_date"].replace("Z", "+00:00"))
    print_test("第1条比第2条更早超期", due1 < due2, f"{due1} < {due2}")

print("\n" + "=" * 70)
print("验证完成")
print("=" * 70)

try:
    os.remove("test_overdue.db")
except Exception:
    pass
