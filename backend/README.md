# 乐器租赁 - 学校合作与回款进度管理系统

Go Fiber + Postgres 构建的乐器租赁业务后端，覆盖乐器管理、租出归还、维修判责、学校合作、回款进度全链路，每次数据变更均留痕可回查。

## 本地启动

### 前置条件

- Go 1.22+
- Docker（用于运行 Postgres）
- Docker Compose

### 1. 启动 Postgres

```bash
cd backend
docker compose up -d
```

等待 Postgres 就绪（约 5 秒），可执行 `docker compose logs -f` 观察输出直到出现 `database system is ready to accept connections`。

### 2. 启动后端服务

```bash
cd backend
go run main.go
```

服务默认监听 `http://localhost:8080`。如端口被占用，可通过环境变量指定：

```bash
PORT=8081 go run main.go
```

首次启动时，GORM 自动迁移所有表，seed 程序会在 `users` 表为空时自动插入演示数据（含 6 个用户、10 件乐器、5 所学校、4 笔租赁、5 笔回款、2 条维修、1 条待审归还）。

### 环境变量

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `DB_HOST` | `localhost` | Postgres 主机 |
| `DB_PORT` | `5432` | Postgres 端口 |
| `DB_USER` | `rental` | 数据库用户 |
| `DB_PASSWORD` | `rental123` | 数据库密码 |
| `DB_NAME` | `instrument_rental` | 数据库名 |
| `JWT_SECRET` | `instrument-rental-jwt-secret-2026` | JWT 签名密钥 |
| `PORT` | `8080` | HTTP 监听端口 |

## 演示入口

### 登录获取 Token

```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

返回中 `token` 字段即为 JWT，后续请求在 Header 中携带：

```
Authorization: Bearer <token>
```

### 演示账号

| 用户名 | 密码 | 角色 | 用途 |
|--------|------|------|------|
| `admin` | `admin123` | 系统管理员 | 全部权限 |
| `consultant1` | `consult123` | 租赁顾问 | 乐器/租赁/学校/回款 |
| `consultant2` | `consult123` | 租赁顾问 | 同上 |
| `technician1` | `tech123` | 维修师傅 | 维修工单 |
| `technician2` | `tech123` | 维修师傅 | 维修工单 |
| `store_owner1` | `store123` | 门店老板 | 归还登记 |

### 首页数据（仪表盘）

```bash
curl http://localhost:8080/api/dashboard/stats \
  -H "Authorization: Bearer <token>"
```

返回待处理归还、已驳回、逾期租赁、待回款、逾期回款等核心指标。

### 关键接口速览

| 方法 | 路径 | 说明 |
|------|------|------|
| `POST` | `/api/auth/login` | 登录 |
| `GET` | `/api/auth/me` | 当前用户 |
| `GET` | `/api/dashboard/stats` | 仪表盘统计 |
| `GET` | `/api/dashboard/activities` | 最近操作动态 |
| `GET` | `/api/dashboard/audit-logs` | 审计日志（可按实体类型/ID/用户筛选） |
| `GET` | `/api/instruments` | 乐器列表（支持 status/type/keyword 筛选） |
| `POST` | `/api/instruments` | 新增乐器 |
| `GET` | `/api/rentals` | 租赁列表（支持 school_id/instrument_id/status/日期范围筛选） |
| `POST` | `/api/rentals` | 创建租赁 |
| `POST` | `/api/rentals/batch` | 批量创建租赁 |
| `GET` | `/api/returns` | 归还列表 |
| `POST` | `/api/returns` | 登记归还（含损坏描述+押金扣减） |
| `PUT` | `/api/returns/:id/review` | 审核归还（通过/驳回） |
| `GET` | `/api/maintenances` | 维修列表 |
| `POST` | `/api/maintenances` | 创建维修工单 |
| `GET` | `/api/schools` | 学校列表 |
| `PUT` | `/api/schools/:id` | 更新学校合作状态（全留痕） |
| `GET` | `/api/payments` | 回款列表 |
| `POST` | `/api/payments/:id/record` | 登记回款 |
| `POST` | `/api/payments/batch` | 批量更新回款 |
| `PUT` | `/api/batch/rentals` | 批量更新租赁 |
| `PUT` | `/api/batch/payments` | 批量更新回款 |
| `PUT` | `/api/batch/schools` | 批量更新学校 |
| `POST` | `/api/batch/payments` | 批量创建回款 |

## 初始化方式

1. **自动迁移**：`main.go` 中 `database.DB.AutoMigrate(...)` 会在每次启动时检查并更新表结构，无需手动建表。
2. **自动种子**：`seed.Run(cfg)` 检测 `users` 表是否为空，为空则注入演示数据，已有数据不会覆盖。
3. **重置数据**：如需重新初始化，先停掉服务，再执行：

```bash
docker compose down -v
docker compose up -d
go run main.go
```

这将删除 Postgres 数据卷并重建。

## 权限模型

| 角色 | 乐器 | 租赁 | 归还 | 维修 | 学校 | 回款 | 批量 |
|------|------|------|------|------|------|------|------|
| admin | CRUD | CRUD | 审核归还 | CRUD | CRUD | CRUD | 全部 |
| consultant | CRU | CRU | 登记归还 | R | CRU | CRU | - |
| maintenance | R | R | - | CRU | R | R | - |
| store_owner | R | R | 登记归还 | R | R | R | - |

## 审计留痕

所有非 GET 请求自动记录 `audit_logs` 表，包含：
- 操作人（`user_id`）
- 操作类型（`action`）：create / update / delete / review / batch_update / batch_create / record_payment
- 实体类型与 ID（`entity_type`, `entity_id`）
- 变更前后值（`old_value`, `new_value`，JSONB）
- 来源 IP（`ip_address`）

学校合作状态变更、回款进度变更等关键链路均通过 service 层显式写入 `old_value` 和 `new_value`，可通过 `GET /api/dashboard/audit-logs?entity_type=school&entity_id=1` 回查任意实体的完整变更历史。

## 定时任务

系统内置 cron 任务（每日凌晨 2 点执行）：
- 自动标记逾期租赁（`rental.status → overdue`）
- 自动标记逾期回款（`payment.status → overdue`）
