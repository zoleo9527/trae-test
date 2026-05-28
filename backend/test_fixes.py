#!/usr/bin/env python3
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
            username="finance",
            email="finance@test.com",
            full_name="Finance",
            role=models.UserRole.FINANCE,
            hashed_password=get_password_hash("test123"),
            is_active=True
        ),
    ]
    db.add_all(users)
    db.commit()
    db.close()


def print_test(name, passed, detail=""):
    status = "✅ PASS" if passed else "❌ FAIL"
    print(f"{status} - {name}")
    if detail and not passed:
        print(f"   详情: {detail}")


init_test_data()

print("="*70)
print("船舶代理系统 - 权限与留痕修复验证")
print("="*70)

print("\n1. 测试 create_user 匿名调用拦截")
print("-"*70)
try:
    response = client.post(
        "/api/users",
        json={
            "username": "hacker",
            "email": "hacker@test.com",
            "full_name": "Anonymous Hacker",
            "role": "admin",
            "password": "hack123"
        }
    )
    print_test("匿名调用create_user被拒绝", response.status_code == 401,
               f"状态码: {response.status_code}, 响应: {response.text[:200]}")
except Exception as e:
    print_test("匿名调用create_user被拒绝", False, str(e))

print("\n2. 测试 OAuth 登录获取 Token")
print("-"*70)
try:
    response = client.post(
        "/api/token",
        data={"username": "admin", "password": "admin123"}
    )
    token = None
    if response.status_code == 200:
        token = response.json().get("access_token")
        print_test("登录获取Token成功", token is not None)
    else:
        print_test("登录获取Token成功", False,
                   f"状态码: {response.status_code}, 响应: {response.text[:200]}")
except Exception as e:
    print_test("登录获取Token成功", False, str(e))
    token = None

if token:
    headers = {"Authorization": f"Bearer {token}"}

    print("\n3. 测试管理员角色权限 - 创建用户")
    print("-"*70)
    try:
        response = client.post(
            "/api/users",
            headers=headers,
            json={
                "username": "testuser_api",
                "email": "testuser@test.com",
                "full_name": "测试用户",
                "role": "site_coordinator",
                "password": "test123"
            }
        )
        print_test("管理员创建用户成功", response.status_code == 200,
                   f"状态码: {response.status_code}, 响应: {response.text[:200]}")
    except Exception as e:
        print_test("管理员创建用户成功", False, str(e))

    print("\n4. 测试审计日志 - 创建用户有记录")
    print("-"*70)
    try:
        response = client.get(
            "/api/audit?resource_type=user",
            headers=headers
        )
        logs = response.json() if response.status_code == 200 else []
        user_create_logs = [l for l in logs if l.get("action") == "create"]
        print_test("用户创建操作有审计记录", len(user_create_logs) > 0,
                   f"审计日志数量: {len(user_create_logs)}")
    except Exception as e:
        print_test("用户创建操作有审计记录", False, str(e))

    print("\n5. 测试靠泊计划权限 - 财务角色无法创建")
    print("-"*70)
    try:
        finance_login = client.post(
            "/api/token",
            data={"username": "finance", "password": "test123"}
        )
        finance_token = finance_login.json().get("access_token")
        finance_headers = {"Authorization": f"Bearer {finance_token}"}

        response = client.post(
            "/api/berths",
            headers=finance_headers,
            json={
                "vessel_name": "测试船",
                "port": "上海港",
                "eta": "2026-06-01T10:00:00"
            }
        )
        print_test("财务角色创建靠泊被拒绝", response.status_code == 403,
                   f"状态码: {response.status_code}")
    except Exception as e:
        print_test("财务角色创建靠泊被拒绝", False, str(e))

    print("\n6. 测试更新操作审计 - 前后值正确记录")
    print("-"*70)
    try:
        create_resp = client.post(
            "/api/berths",
            headers=headers,
            json={
                "vessel_name": "审计测试船",
                "port": "宁波港",
                "eta": "2026-06-15T08:00:00",
                "remarks": "初始备注"
            }
        )
        berth_id = create_resp.json().get("id")
        berth_version = create_resp.json().get("version")

        update_resp = client.put(
            f"/api/berths/{berth_id}",
            headers=headers,
            json={
                "port": "深圳港",
                "eta": "2026-06-20T08:00:00",
                "remarks": "修改后的备注",
                "version": berth_version
            }
        )
        print_test("更新靠泊计划成功", update_resp.status_code == 200,
                   f"状态码: {update_resp.status_code}")

        audit_resp = client.get(
            f"/api/audit?resource_type=berth_plan&resource_id={berth_id}",
            headers=headers
        )
        logs = audit_resp.json() if audit_resp.status_code == 200 else []
        update_logs = [l for l in logs if l.get("action") == "update"]

        if len(update_logs) > 0:
            log = update_logs[0]
            old_values = log.get("old_values", {})
            new_values = log.get("new_values", {})

            old_port_ok = old_values.get("port") == "宁波港"
            new_port_ok = new_values.get("port") == "深圳港"
            old_eta_ok = "2026-06-15" in str(old_values.get("eta", ""))
            new_eta_ok = "2026-06-20" in str(new_values.get("eta", ""))
            values_different = old_values.get("port") != new_values.get("port")

            print_test("更新审计记录存在", len(update_logs) > 0)
            print_test("旧值正确 - port", old_port_ok,
                       f"期望: 宁波港, 实际: {old_values.get('port')}")
            print_test("新值正确 - port", new_port_ok,
                       f"期望: 深圳港, 实际: {new_values.get('port')}")
            print_test("旧值正确 - eta", old_eta_ok,
                       f"期望包含: 2026-06-15, 实际: {old_values.get('eta')}")
            print_test("新值正确 - eta", new_eta_ok,
                       f"期望包含: 2026-06-20, 实际: {new_values.get('eta')}")
            print_test("前后值不相同", values_different,
                       f"old_values: {old_values.get('port')}, new_values: {new_values.get('port')}")
        else:
            print_test("更新审计记录存在", False, "未找到更新审计日志")

    except Exception as e:
        print_test("更新操作审计测试", False, str(e))

    print("\n7. 测试沟通记录审计留痕")
    print("-"*70)
    try:
        comm_resp = client.post(
            "/api/communications",
            headers=headers,
            json={
                "communication_type": "email",
                "subject": "审计测试邮件",
                "content": "这是测试沟通内容",
                "sender": "admin@test.com",
                "recipient": "test@test.com"
            }
        )
        comm_id = comm_resp.json().get("id")
        print_test("创建沟通记录成功", comm_resp.status_code == 201,
                   f"状态码: {comm_resp.status_code}")

        audit_resp = client.get(
            f"/api/audit?resource_type=communication&resource_id={comm_id}",
            headers=headers
        )
        logs = audit_resp.json() if audit_resp.status_code == 200 else []
        print_test("沟通记录有审计日志", len(logs) > 0,
                   f"审计日志数量: {len(logs)}")
    except Exception as e:
        print_test("沟通记录审计留痕测试", False, str(e))

    print("\n8. 测试现场协调角色权限")
    print("-"*70)
    try:
        site_login = client.post(
            "/api/token",
            data={"username": "site", "password": "test123"}
        )
        site_token = site_login.json().get("access_token")
        site_headers = {"Authorization": f"Bearer {site_token}"}

        response = client.get("/api/berths", headers=site_headers)
        print_test("现场协调可查询靠泊计划", response.status_code == 200)

        response = client.get("/api/payments", headers=site_headers)
        print_test("现场协调无法查询款项", response.status_code == 403,
                   f"状态码: {response.status_code}")

        response = client.get("/api/audit", headers=site_headers)
        print_test("现场协调无法查询审计日志", response.status_code == 403,
                   f"状态码: {response.status_code}")
    except Exception as e:
        print_test("现场协调角色权限测试", False, str(e))

    print("\n9. 测试 Swagger 文档 OAuth 授权链路")
    print("-"*70)
    try:
        docs_response = client.get("/docs")
        print_test("Swagger文档可访问", docs_response.status_code == 200)

        openapi_response = client.get("/openapi.json")
        openapi_spec = openapi_response.json() if openapi_response.status_code == 200 else {}
        oauth2_schemes = openapi_spec.get("components", {}).get("securitySchemes", {})
        token_url = oauth2_schemes.get("OAuth2PasswordBearer", {}).get("flows", {}).get("password", {}).get("tokenUrl")
        print_test("OAuth tokenUrl 路径正确", token_url == "/api/token",
                   f"期望: /api/token, 实际: {token_url}")
    except Exception as e:
        print_test("Swagger文档测试", False, str(e))

print("\n" + "="*70)
print("验证完成")
print("="*70)

os.remove("test_ship_agent.db")
