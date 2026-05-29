# 汽配商行 - 询价报价与配件锁库系统

## 项目概述

基于 Go Fiber + PostgreSQL 实现的汽配商行管理系统，核心功能包括询价报价、配件锁库、库存管理等。系统采用 RBAC 权限控制，支持管理员、门店老板、配件销售、库管四种角色的严格隔离视图。

## 技术栈

- **Web 框架**: Go Fiber v2
- **数据库**: PostgreSQL 14+
- **ORM**: GORM
- **认证**: JWT
- **权限**: RBAC (基于角色的访问控制，角色间无隐式继承)

## 快速启动

### 1. 环境配置

```bash
cp .env.example .env
```

编辑 `.env` 文件，配置数据库连接：

```env
SERVER_HOST=0.0.0.0
SERVER_PORT=8080
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=autoparts
DB_SSLMODE=disable
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRE_HOURS=24
```

### 2. 数据库准备

```sql
CREATE DATABASE autoparts;
```

### 3. 安装依赖并启动

```bash
go mod tidy
go run cmd/main.go
```

服务启动时自动执行数据库迁移并初始化基础用户数据。

### 4. （可选）导入演示数据

```bash
go run scripts/seed_demo_data.go
```

## 测试账号

系统初始化时自动创建以下测试账号，密码均为 `123456`：

| 用户名 | 角色 | 姓名 | 能做什么 |
|--------|------|------|----------|
| admin | 管理员 | 系统管理员 | 全部权限 |
| owner | 门店老板 | 店老板 | 查看询价/锁库、管理客户、退货审核 |
| sales1 | 销售员 | 销售员小张 | 询价单创建/修改/取消、报价单全操作 |
| warehouse1 | 库管 | 库管老李 | 锁库创建/释放/拣货/退货申请/批量释放 |

> 演示数据脚本会额外创建 sales2、warehouse2 等账号，但主入口初始化仅包含以上 4 个。

## 角色权限矩阵

各角色权限严格隔离，无隐式继承：

| 功能 | 管理员 | 门店老板 | 销售员 | 库管 |
|------|--------|----------|--------|------|
| 客户管理（增删改查） | ✅ | ✅ | ✅ | ❌ |
| 询价单查看/列表/导出/链路追踪 | ✅ | ✅ | ✅ | ❌ |
| 询价单创建/修改/删除/取消 | ✅ | ❌ | ✅ | ❌ |
| 报价单全部操作（创建/审核/取消/列表/导出） | ✅ | ❌ | ✅ | ❌ |
| 锁库单查看/列表 | ✅ | ✅ | ❌ | ✅ |
| 退货审核 | ✅ | ✅ | ❌ | ❌ |
| 锁库创建/释放/拣货 | ✅ | ❌ | ❌ | ✅ |
| 退货申请 | ✅ | ❌ | ❌ | ✅ |
| 批量释放/导出 | ✅ | ❌ | ❌ | ✅ |

**关键设计**：老板不继承销售和库管权限。老板能查看询价和锁库数据、审核退货，但不能创建询价单、审核报价、创建锁库单、拣货或批量释放。

## 询价状态流转

询价单状态只能由业务动作自动推进，不允许手工修改：

| 业务动作 | enquiry 状态变化 |
|---------|-----------------|
| 创建询价单 | → pending |
| 创建报价单 | pending → quoted |
| 报价审核通过 | quoted → confirmed |
| 创建锁库单 | confirmed → locked |
| 手工取消（仅限未完成） | 任意 → cancelled |

Update 接口只能修改加急、优先级、备注和明细，不能变更 status。

## 链路追踪

通过 `GET /api/v1/enquiries/:id/trace` 接口查看完整业务链路，返回内容包含：

- 询价单基础信息和明细
- 关联的报价单摘要
- 关联的锁库单摘要
- 全链路审计日志（涵盖 enquiry / quote / lock / lock_item 四个模块的所有操作记录）

## API 路由概览

所有接口前缀为 `/api/v1`。

### 公开路由

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /auth/login | 登录 |

### 认证路由（需 Bearer Token）

| 方法 | 路径 | 说明 | 允许角色 |
|------|------|------|----------|
| GET | /auth/profile | 获取当前用户信息 | 全部 |
| POST | /auth/change-password | 修改密码 | 全部 |
| GET | /tasks | 任务列表 | 全部 |
| GET | /tasks/:id | 任务详情 | 全部 |

### 客户路由（admin / owner / sales）

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /customers | 创建客户 |
| GET | /customers/:id | 客户详情 |
| PUT | /customers/:id | 更新客户 |
| DELETE | /customers/:id | 删除客户 |
| POST | /customers/list | 客户列表（销售只看自己创建的） |

### 询价单路由

**查看类（admin / owner / sales）**：

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /enquiries/:id | 询价单详情 |
| GET | /enquiries/:id/trace | 链路追踪（含审计日志） |
| POST | /enquiries/list | 询价单列表 |
| POST | /enquiries/export | 导出 |

**操作类（admin / sales，owner 不可操作）**：

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /enquiries | 创建询价单 |
| PUT | /enquiries/:id | 修改询价单（不含 status） |
| DELETE | /enquiries/:id | 删除询价单 |
| POST | /enquiries/:id/cancel | 取消询价单 |

### 报价单路由（admin / sales，owner 不可访问）

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /quotes | 创建报价单 |
| GET | /quotes/:id | 报价单详情 |
| POST | /quotes/:id/review | 审核报价 |
| POST | /quotes/:id/cancel | 取消报价 |
| POST | /quotes/list | 报价单列表 |
| POST | /quotes/export | 导出 |

### 锁库单路由

**老板查看 + 退货审核（admin / owner）**：

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /locks/:id | 锁库单详情 |
| POST | /locks/list | 锁库单列表（库管只看自己创建的） |
| POST | /locks/:lockOrderId/return/:itemId/review | 退货审核 |

**仓库操作（admin / warehouse，owner 不可操作）**：

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /locks | 创建锁库单 |
| POST | /locks/:id/release | 释放锁库 |
| POST | /locks/:id/pick | 拣货出库 |
| POST | /locks/:id/return | 申请退货 |
| POST | /locks/batch-release | 批量释放 |
| POST | /locks/export | 导出 |

## 错误处理

统一错误响应格式：

```json
{
  "success": false,
  "code": "VALIDATION_ERROR",
  "message": "参数校验失败",
  "details": { "customer_id": "客户ID不能为空" }
}
```

| 错误码 | HTTP 状态码 | 说明 |
|---------|-------------|------|
| VALIDATION_ERROR | 400 | 参数校验失败 |
| UNAUTHORIZED | 401 | 未授权 |
| PERMISSION_DENIED | 403 | 权限不足 |
| NOT_FOUND | 404 | 资源不存在 |
| STATUS_CONFLICT | 409 | 状态冲突/状态不允许操作 |
| STOCK_INSUFFICIENT | 409 | 库存不足 |
| INTERNAL_ERROR | 500 | 服务器内部错误 |

## 演示数据中的异常场景

1. **状态冲突**：尝试修改已完成询价单 → 409
2. **状态手工推进被拒**：通过 Update 接口提交 status 字段 → 409
3. **库存不足**：锁定库存为 0 的配件（ENG-002）→ 409
4. **权限不足**：库管尝试访问客户列表 → 403
5. **权限不足**：销售尝试访问锁库列表 → 403
6. **权限不足**：老板尝试创建询价单 → 403
7. **已过期报价单**：审核已过期报价 → 409
8. **参数校验**：创建询价单缺少必要字段 → 400
9. **退货流程**：测试待退货状态的锁库单退货审核

## 刻意简化的部分

1. **支付结算**：未实现收银、收款、发票
2. **财务报表**：未实现应收账款、账龄分析
3. **库存预警通知**：未实现自动通知
4. **消息推送**：未实现站内信/短信
5. **文件上传**：未实现图片、附件上传
6. **多仓库**：当前仅支持单仓库
7. **供应商管理**：未实现
8. **采购管理**：未实现
9. **前端界面**：仅提供 API 接口

## License

MIT
