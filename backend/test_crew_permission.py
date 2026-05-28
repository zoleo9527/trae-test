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

SQLALCHEMY_DATABASE_URL = "sqlite:///./test_crew_permission.db"
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
    db.flush()

    berth = models.BerthPlan(
        vessel_name="测试船A", port="上海港",
        eta=datetime(2026, 6, 1, 10, 0, 0), created_by=1
    )
    db.add(berth)
    db.flush()
    berth_id = berth.id

    checkpoints_pending = [
        models.CheckpointReminder(
            berth_plan_id=berth_id,
            title="截点1",
            checkpoint_type="document",
            due_date=datetime(2026, 6, 5, 10, 0, 0),
            status=models.TaskStatus.PENDING,
            priority=1,
            assigned_to=1
        ),
        models.CheckpointReminder(
            berth_plan_id=berth_id,
            title="截点2",
            checkpoint_type="document",
            due_date=datetime(2026, 6, 6, 10, 0, 0),
            status=models.TaskStatus.REJECTED,
            priority=1,
            assigned_to=1
        ),
        models.CheckpointReminder(
            berth_plan_id=berth_id,
            title="截点3",
            checkpoint_type="document",
            due_date=datetime(2026, 6, 7, 10, 0, 0),
            status=models.TaskStatus.NEEDS_REVIEW,
            priority=1,
            assigned_to=1
        ),
    ]
    db.add_all(checkpoints_pending)
    db.flush()

    berths_pending = [
        models.BerthPlan(
            vessel_name="待审核船1", port="宁波港",
            eta=datetime(2026, 6, 10, 10, 0, 0),
            status=models.TaskStatus.PENDING, created_by=1
        ),
        models.BerthPlan(
            vessel_name="已驳回船1", port="深圳港",
            eta=datetime(2026, 6, 11, 10, 0, 0),
            status=models.TaskStatus.REJECTED, created_by=1
        ),
        models.BerthPlan(
            vessel_name="待回查船1", port="广州港",
            eta=datetime(2026, 6, 12, 10, 0, 0),
            status=models.TaskStatus.NEEDS_REVIEW, created_by=1
        ),
    ]
    db.add_all(berths_pending)
    db.flush()

    crew_pending = [
        models.CrewChange(
            berth_plan_id=berth_id,
            change_type=models.CrewChangeType.SIGN_ON,
            crew_name="待处理船员1",
            crew_rank="船长",
            nationality="中国",
            status=models.TaskStatus.PENDING,
            created_by=1
        ),
        models.CrewChange(
            berth_plan_id=berth_id,
            change_type=models.CrewChangeType.SIGN_OFF,
            crew_name="已驳回船员1",
            crew_rank="大副",
            nationality="中国",
            status=models.TaskStatus.REJECTED,
            created_by=1
        ),
        models.CrewChange(
            berth_plan_id=berth_id,
            change_type=models.CrewChangeType.TRANSFER,
            crew_name="待回查船员1",
            crew_rank="轮机长",
            nationality="中国",
            status=models.TaskStatus.NEEDS_REVIEW,
            created_by=1
        ),
    ]
    db.add_all(crew_pending)
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


def count_by_type(items, type_name):
    return sum(1 for item in items if item.get("type") == type_name)


init_test_data()

print("=" * 70)
print("船舶代理系统 - 首页 crew 数据权限过滤验证")
print("=" * 70)

CREW_ROLES = {"admin", "manager", "site", "document"}
NO_CREW_ROLES = {"finance"}

# ── 有换班权限角色测试 ────────────────────────────────────────────

print("\n[1] 有换班权限角色 - 统计字段包含 crew 数据")
print("-" * 70)

for username in CREW_ROLES:
    token = get_token(username, "admin123" if username == "admin" else "test123")
    headers = {"Authorization": f"Bearer {token}"}
    resp = client.get("/api/dashboard", headers=headers)
    stats = resp.json()["stats"]
    pending = stats.get("pending_tasks")
    rejected = stats.get("rejected_items")
    need_review = stats.get("need_review")
    total_crew = stats.get("total_crew_changes")

    print(f"\n  角色: {username}")
    print_test(f"  {username}: pending_tasks = 4 (1cp+2br+1cr)", pending == 4, f"实际: {pending}")
    print_test(f"  {username}: rejected_items = 3 (1cp+1br+1cr)", rejected == 3, f"实际: {rejected}")
    print_test(f"  {username}: need_review = 3 (1cp+1br+1cr)", need_review == 3, f"实际: {need_review}")
    print_test(f"  {username}: total_crew_changes = 3", total_crew == 3, f"实际: {total_crew}")

print("\n[2] 有换班权限角色 - 列表字段包含 crew 条目")
print("-" * 70)

for username in CREW_ROLES:
    token = get_token(username, "admin123" if username == "admin" else "test123")
    headers = {"Authorization": f"Bearer {token}"}
    resp = client.get("/api/dashboard", headers=headers)
    data = resp.json()
    pending_items = data.get("pending_items", [])
    rejected_items = data.get("rejected_items", [])
    need_review_items = data.get("need_review_items", [])

    pending_crew = count_by_type(pending_items, "crew")
    rejected_crew = count_by_type(rejected_items, "crew")
    review_crew = count_by_type(need_review_items, "crew")

    print(f"\n  角色: {username}")
    print_test(f"  {username}: pending_items 有 crew ({pending_crew})", pending_crew == 1, f"实际: {pending_crew}")
    print_test(f"  {username}: rejected_items 有 crew ({rejected_crew})", rejected_crew == 1, f"实际: {rejected_crew}")
    print_test(f"  {username}: need_review_items 有 crew ({review_crew})", review_crew == 1, f"实际: {review_crew}")

# ── 无换班权限角色测试 ────────────────────────────────────────────

print("\n[3] 无换班权限角色 - 统计字段排除 crew 数据")
print("-" * 70)

for username in NO_CREW_ROLES:
    token = get_token(username, "test123")
    headers = {"Authorization": f"Bearer {token}"}
    resp = client.get("/api/dashboard", headers=headers)
    stats = resp.json()["stats"]
    pending = stats.get("pending_tasks")
    rejected = stats.get("rejected_items")
    need_review = stats.get("need_review")
    total_crew = stats.get("total_crew_changes")

    print(f"\n  角色: {username}")
    print_test(f"  {username}: pending_tasks = 3 (1cp+2br, 无cr)", pending == 3, f"实际: {pending}")
    print_test(f"  {username}: rejected_items = 2 (1cp+1br, 无cr)", rejected == 2, f"实际: {rejected}")
    print_test(f"  {username}: need_review = 2 (1cp+1br, 无cr)", need_review == 2, f"实际: {need_review}")
    print_test(f"  {username}: total_crew_changes = null", total_crew is None, f"实际: {total_crew}")

print("\n[4] 无换班权限角色 - 列表字段排除 crew 条目")
print("-" * 70)

for username in NO_CREW_ROLES:
    token = get_token(username, "test123")
    headers = {"Authorization": f"Bearer {token}"}
    resp = client.get("/api/dashboard", headers=headers)
    data = resp.json()
    pending_items = data.get("pending_items", [])
    rejected_items = data.get("rejected_items", [])
    need_review_items = data.get("need_review_items", [])

    pending_crew = count_by_type(pending_items, "crew")
    rejected_crew = count_by_type(rejected_items, "crew")
    review_crew = count_by_type(need_review_items, "crew")

    print(f"\n  角色: {username}")
    print_test(f"  {username}: pending_items 无 crew ({pending_crew})", pending_crew == 0, f"实际: {pending_crew}")
    print_test(f"  {username}: rejected_items 无 crew ({rejected_crew})", rejected_crew == 0, f"实际: {rejected_crew}")
    print_test(f"  {username}: need_review_items 无 crew ({review_crew})", review_crew == 0, f"实际: {review_crew}")

# ── 支付字段验证（确保之前的修复仍然有效） ────────────────────

print("\n[5] 支付字段权限保持正确")
print("-" * 70)

for username in ["admin", "manager", "finance"]:
    token = get_token(username, "admin123" if username == "admin" else "test123")
    headers = {"Authorization": f"Bearer {token}"}
    resp = client.get("/api/dashboard", headers=headers)
    stats = resp.json()["stats"]
    pp = stats.get("pending_payments")
    print_test(f"  {username}: pending_payments = 0 (数字)", pp == 0, f"实际: {pp}")

for username in ["site", "document"]:
    token = get_token(username, "test123")
    headers = {"Authorization": f"Bearer {token}"}
    resp = client.get("/api/dashboard", headers=headers)
    stats = resp.json()["stats"]
    pp = stats.get("pending_payments")
    print_test(f"  {username}: pending_payments = null", pp is None, f"实际: {pp}")

print("\n" + "=" * 70)
print("验证完成")
print("=" * 70)

try:
    os.remove("test_crew_permission.db")
except Exception:
    pass
