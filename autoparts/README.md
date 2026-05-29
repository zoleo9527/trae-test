# 汽配商行 - 询价报价与配件锁库系统

## 项目概述

基于 Go Fiber + PostgreSQL 实现的汽配商行管理系统，核心功能包括询价报价、配件锁库、库存管理等。系统采用 RBAC 权限控制，支持门店老板、配件销售、库管等不同角色的差异化视图。

## 技术栈

- **Web 框架**: Go Fiber v2
- **数据库**: PostgreSQL 14+
- **ORM**: GORM
- **认证**: JWT
- **权限**: RBAC (基于角色的访问控制)

## 目录结构

```
autoparts/
├── cmd/
│   └── main.go              # 主入口
├── internal/
│   ├── config/              # 配置管理
│   ├── controller/          # 控制器层
│   ├── dto/               # 数据传输对象
│   ├── middleware/        # 中间件
│   ├── model/             # 数据模型
│   ├── service/           # 业务服务层
│   └── util/              # 工具函数
├── pkg/
│   └── errors/            # 错误处理
├── scripts/                 # 脚本
│   └── seed_demo_data.go # 演示数据脚本
├── .env.example           # 环境变量示例
├── go.mod
└── README.md
```

## 快速启动

### 1. 环境配置

复制环境变量文件：

```bash
cp .env.example .env
```

编辑 `.env` 文件，配置数据库连接：

```env
# 服务器配置
SERVER_HOST=0.0.0.0
SERVER_PORT=8080

# 数据库配置
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=autoparts
DB_SSLMODE=disable

# JWT 配置
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRE_HOURS=24
```

### 2. 数据库准备

确保 PostgreSQL 服务已启动，并创建数据库：

```sql
CREATE DATABASE autoparts;
```

### 3. 安装依赖

```bash
go mod tidy
```

### 4. 启动服务

```bash
go run cmd/main.go
```

服务将自动执行数据库迁移并初始化基础数据。

### 5. （可选）导入演示数据

```bash
go run scripts/seed_demo_data.go
```

## 测试账号

系统初始化时会自动创建以下测试账号，密码均为 `123456`：

| 用户名 | 角色 | 姓名 | 说明 |
|--------|------|------|------|
| admin | 管理员 | 系统管理员 | 拥有所有权限 |
| owner | 门店老板 | 店老板-王总 | 查看报表、管理客户 |
| sales1 | 销售员 | 销售员-小张 | 询价、报价 |
| sales2 | 销售员 | 销售员-小李 | 询价、报价 |
| warehouse1 | 库管 | 库管-老李 | 锁库、拣货、退货 |
| warehouse2 | 库管 | 库管-小王 | 锁库、拣货、退货 |

## 核心功能

### 1. 询价报价流程

**询价单 (Enquiry) → 报价单 (Quote) → 配件锁库 (Lock) → 拣货出库 (Pick) → 完成 (Complete)

**状态流转：

```
待处理 → 已报价 → 已确认 → 已锁库 → 已完成
     ↓         ↓
   已取消    已拒绝
```

### 2. 角色权限矩阵

| 功能 | 管理员 | 门店老板 | 销售员 | 库管 |
|------|--------|----------|--------|------|
| 用户管理 | ✅ | ❌ | ❌ | ❌ |
| 客户管理 | ✅ | ✅ | ✅ | ❌ |
| 创建询价单 | ✅ | ✅ | ✅ | ❌ |
| 创建报价单 | ✅ | ✅ | ✅ | ❌ |
| 审核报价 | ✅ | ✅ | ✅ | ❌ |
| 创建锁库单 | ✅ | ❌ | ❌ | ✅ |
| 拣货出库 | ✅ | ❌ | ❌ | ✅ |
| 退货处理 | ✅ | ✅ | ❌ | ✅ |
| 批量释放锁库 | ✅ | ❌ | ❌ | ✅ |
| 查看审计日志 | ✅ | ✅ | ❌ | ❌ |
| 导出数据 | ✅ | ✅ | ✅ | ✅ |

### 3. 链路追踪

通过 `GET /api/enquiries/:id/chain` 接口可以查看完整的业务链路：

- 询价单信息
- 关联的报价单
- 关联的锁库单
- 所有状态变更历史
- 操作人信息

### 4. 批量操作

- 批量释放锁库：`POST /api/locks/batch-release`
- 支持通过筛选条件批量操作

### 5. 异步任务

- 数据导出任务在后台异步执行
- 支持查询任务状态
- 支持下载导出文件

### 6. 审计日志

系统自动记录所有关键操作：
- 创建、更新、删除操作
- 状态变更
- 操作人、操作时间
- 变更前后数据对比

## API 接口示例

### 认证接口

#### 登录

```bash
# 登录
POST /api/auth/login
Content-Type: application/json

{
  "username": "sales1",
  "password": "123456"
}
```

### 询价单接口

```bash
# 创建询价单
POST /api/enquiries
Authorization: Bearer {token}

{
  "customer_id": 1,
  "license_plate": "京A12345",
  "car_model": "大众帕萨特",
  "is_urgent": false,
  "items": [
    {
      "part_id": 1,
      "quantity": 2,
      "remark": "前刹车片"
    }
  ],
  "remark": "常规保养"
}
```

```bash
# 查询询价单列表（支持筛选）
GET /api/enquiries?status=pending&is_urgent=true&keyword=京A
```

```bash
# 查看业务链路
GET /api/enquiries/:id/chain
```

### 报价单接口

```bash
# 创建报价单
POST /api/quotes
{
  "enquiry_id": 1,
  "valid_days": 7,
  "items": [
    {
      "enquiry_item_id": 1,
      "quote_price": 350.00
    }
  ]
}
```

```bash
# 审核报价
POST /api/quotes/:id/review
{
  "status": "accepted"  # 或 "rejected"
  "reject_reason": ""
}
```

### 锁库单接口

```bash
# 创建锁库单
POST /api/locks
{
  "enquiry_id": 1,
  "quote_id": 1
}
```

```bash
# 拣货出库
POST /api/locks/:id/pick
```

```bash
# 申请退货
POST /api/locks/:id/request-return
{
  "reason": "型号不符",
  "items": [
    {
      "lock_item_id": 1,
      "quantity": 1
    }
  ]
}
```

```bash
# 审核退货
POST /api/locks/:id/review-return
{
  "approved": true,
  "review_remark": "同意退货"
}
```

```bash
# 批量释放锁库
POST /api/locks/batch-release
{
  "ids": [1, 2, 3]
}
```

## 错误处理

系统采用统一的错误响应格式：

```json
{
  "success": false,
  "code": "VALIDATION_ERROR",
  "message": "参数校验失败",
  "details": {
    "customer_id": "客户ID不能为空"
  }
}
```

主要错误类型：

| 错误码 | HTTP 状态码 | 说明 |
|---------|-------------|------|
| VALIDATION_ERROR | 400 | 参数校验失败 |
| UNAUTHORIZED | 401 | 未授权 |
| PERMISSION_DENIED | 403 | 权限不足 |
| NOT_FOUND | 404 | 资源不存在 |
| STATUS_CONFLICT | 409 | 状态冲突 |
| STOCK_INSUFFICIENT | 409 | 库存不足 |
| INTERNAL_ERROR | 500 | 服务器内部错误 |

## 演示数据中的异常场景

运行演示数据脚本后，可以测试以下异常场景：

1. **状态冲突**：尝试修改状态为 "已完成" 的询价单
2. **库存不足**：尝试锁定 ENG-002（机油滤清器），库存为0
3. **权限不足**：使用库管账号创建询价单
4. **权限不足**：使用销售账号进行拣货操作
5. **已过期报价单**：尝试审核已过期的报价单
6. **参数校验**：创建询价单时缺少必要字段
7. **高风险客户**：查看"王五-高风险账期客户的账期风险
8. **退货流程**：测试待退货状态的锁库单退货审核

## 刻意简化的部分

本项目为演示版本，以下功能做了简化：

1. **支付结算模块
2. **财务报表**：未实现应收账款、账龄分析
3. **库存预警**：未实现库存预警通知
4. **消息推送**：未实现消息推送
5. **文件上传**：未实现图片、附件上传
6. **数据备份**：未实现自动备份
7. **多仓库**：当前仅支持单仓库
8. **供应商管理**：未实现供应商管理
9. **采购管理**：未实现采购管理
10. **前端界面**：未实现前端界面，仅提供API接口

## 开发说明

### 环境要求

- Go 1.21+
- PostgreSQL 14+

### 代码规范

- 服务层做厚，控制器做薄
- 错误处理统一使用 pkg/errors
- DTO 层做参数校验
- 审计日志自动记录
- 数据库操作使用事务保证数据一致性

## License

MIT
