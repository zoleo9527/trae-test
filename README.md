# 桶装水配送 - 客诉补送与赔付记录系统

基于 Go Fiber + PostgreSQL 的客诉补送与赔付记录一体化服务层。

## 核心设计理念

**不拆分客诉、补送、赔付** - 三者本来就是连着跑的：
- 一个客诉可以触发多次补送和多次赔付
- 补送完成自动影响客诉状态
- 赔付审批通过自动影响客诉状态
- 所有操作全部留痕，关键动作前后值、操作者、时间点全部可追

**角色差异化视图** - 不同角色看到的数据范围不同：
- **管理员 (admin)**: 看到全站所有数据
- **站长 (station_master)**: 仅看到本站数据，可审批赔付
- **司机 (driver)**: 仅看到分配给自己的补送任务
- **客服 (customer_service)**: 可创建客诉、申请赔付，但看不到内部备注

## 技术栈

- **Web框架**: Go Fiber v2
- **ORM**: GORM
- **数据库**: PostgreSQL
- **认证**: JWT (HS256)
- **密码加密**: bcrypt
- **异步任务**: 内置 Worker Pool (可扩展为独立服务)
- **文件上传**: 本地存储 + SHA256 校验

## 目录结构

```
.
├── cmd/api/
│   ├── main.go          # 服务入口
│   └── seeder.go        # 演示数据
├── internal/
│   ├── config/          # 配置加载
│   ├── database/        # 数据库连接
│   ├── models/          # 数据模型
│   ├── handlers/        # HTTP 处理器
│   ├── middleware/      # 中间件 (鉴权、角色)
│   ├── services/        # 业务逻辑层
│   ├── utils/           # 工具函数
│   ├── async/           # 异步任务池
│   └── audit/           # 审计日志
├── pkg/
│   ├── types/           # 枚举类型
│   └── dto/             # 数据传输对象
├── migrations/          # SQL 迁移 (GORM 自动迁移)
├── uploads/             # 上传文件目录
├── .env                 # 环境变量
├── .env.example         # 环境变量示例
└── go.mod
```

## 快速启动

### 1. 准备数据库

```sql
-- 创建数据库
CREATE DATABASE water_delivery;
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env`（已预置），根据实际情况修改：

```
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=water_delivery
JWT_SECRET=water-delivery-super-secret-key-2024
```

### 3. 启动服务

```bash
# 安装依赖
go mod tidy

# 启动服务
go run ./cmd/api
```

服务将在 `http://localhost:3000` 启动。

首次启动会自动：
- 连接数据库
- 执行 GORM AutoMigrate 创建所有表
- 自动注入演示数据（如果表为空）

## 角色切换说明

演示环境预置了7个账号，密码统一为 `123456`：

| 角色 | 用户名 | 密码 | 说明 |
|------|--------|------|------|
| 管理员 | `admin` | `123456` | 全站所有权限 |
| 站长(朝阳) | `station_master_1` | `123456` | 朝阳路水站，可审批赔付 |
| 站长(海淀) | `station_master_2` | `123456` | 海淀水站 |
| 司机1 | `driver_1` | `123456` | 王师傅，看自己的补送任务 |
| 司机2 | `driver_2` | `123456` | 刘师傅 |
| 客服1 | `cs_1` | `123456` | 陈客服，创建客诉/赔付 |
| 客服2 | `cs_2` | `123456` | 赵客服 |

**切换角色方法**：调用不同账号的登录接口，拿到 token 后在请求头带上 `Authorization: Bearer {token}`

## API 接口总览

### 认证接口

```bash
# 登录（公开）
POST /api/v1/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "123456"
}

# 获取当前用户信息
GET /api/v1/auth/me
Authorization: Bearer {token}

# 健康检查
GET /api/v1/health
```

### 客诉接口

```bash
# 创建客诉 (所有登录用户)
POST /api/v1/complaints
Content-Type: application/json
Authorization: Bearer {token}

{
  "customer_id": "{客户UUID}",
  "order_id": "{关联订单UUID，可选}",
  "type": "missing_delivery",
  "title": "少送了2桶水",
  "description": "详细描述...",
  "empty_bucket_diff": 0,
  "priority": 3
}

# 筛选查询客诉 (自动按角色过滤数据范围)
GET /api/v1/complaints?page=1&page_size=20&status=pending&priority=3&search=关键词
Authorization: Bearer {token}

# 查询参数支持:
# - station_id: 按水站过滤
# - customer_id: 按客户过滤
# - assigned_to: 按处理人过滤
# - status: pending/processing/resolved/closed/rejected
# - type: missing_delivery/damaged_bucket/wrong_product/late_delivery/empty_bucket_issue/quality_issue/other
# - priority: 1-5
# - search: 搜索标题/客户名/电话
# - page, page_size: 分页

# 获取客诉详情 (含补送、赔付、照片、备注、审计日志)
GET /api/v1/complaints/{id}
Authorization: Bearer {token}

# 更新客诉状态
PUT /api/v1/complaints/{id}/status
Content-Type: application/json
Authorization: Bearer {token}

{
  "status": "processing",
  "notes": "备注内容，可选"
}

# 分配处理人 (仅 admin, station_master)
POST /api/v1/complaints/{id}/assign
Content-Type: application/json
Authorization: Bearer {token}

{
  "assigned_to": "{用户UUID}"
}

# 添加备注
POST /api/v1/complaints/{id}/notes
Content-Type: application/json
Authorization: Bearer {token}

{
  "content": "备注内容",
  "is_internal": true/false  # 内部备注客服看不到
}

# 上传照片
POST /api/v1/complaints/{id}/photos
Content-Type: multipart/form-data
Authorization: Bearer {token}

file: 选择图片文件
description: 照片描述
```

### 补送接口 (与客诉关联)

```bash
# 创建补送单 (admin, station_master, customer_service)
POST /api/v1/complaints/{complaint_id}/redeliveries
Content-Type: application/json
Authorization: Bearer {token}

{
  "driver_id": "{司机UUID，可选}",
  "water_amount": 2,
  "empty_bucket_adjust": 0,  # 空桶调整数，+增加 -减少
  "scheduled_at": "2024-05-28T08:00:00Z",
  "notes": "备注"
}

# 更新补送状态 (admin, station_master, driver)
PUT /api/v1/complaints/{complaint_id}/redeliveries/{redelivery_id}/status
Content-Type: application/json
Authorization: Bearer {token}

{
  "status": "delivered",
  "photo_url": "/uploads/xxx.jpg",  # 签收照片，可选
  "notes": "客户已签收"
}

# 司机查看自己的补送任务
GET /api/v1/driver/redeliveries
Authorization: Bearer {driver_token}
```

### 赔付接口 (与客诉关联)

```bash
# 申请赔付 (admin, station_master, customer_service)
POST /api/v1/complaints/{complaint_id}/compensations
Content-Type: application/json
Authorization: Bearer {token}

{
  "type": "refund",           # refund/free_bucket/discount/water_ticket
  "amount": 75.0,              # 现金金额
  "water_amount": 0,           # 赠水数量
  "description": "赔付说明"
}

# 注意: admin 和 station_master 创建的赔付自动审核通过
# customer_service 创建的赔付需要站长审批

# 审批赔付 (admin, station_master)
PUT /api/v1/complaints/compensations/{compensation_id}/approve
Content-Type: application/json
Authorization: Bearer {token}

{
  "approved": true/false,
  "notes": "审批意见"
}

# 标记赔付已支付 (admin, station_master)
PUT /api/v1/complaints/compensations/{id}/paid
Authorization: Bearer {token}

# 查看待审批赔付 (admin, station_master)
GET /api/v1/station/compensations/pending
Authorization: Bearer {token}
```

## 业务状态流转

### 客诉状态流转

```
pending (待处理)
    ↓
processing (处理中) ←┐
    ↓                │
resolved (已解决)   │
    ↓                │
closed (已关闭) ────┘
    ↑
rejected (已驳回) ─┘
```

### 补送状态流转

```
scheduled (已排期)
    ↓
in_transit (运输中)
    ↓
delivered (已送达)
    ↑
failed (派送失败) → 可重新排期为 scheduled
    ↓
cancelled (已取消)
```

### 赔付状态流转

```
pending (待审批)
    ↓
approved (已批准) → paid (已支付)
    ↓
rejected (已驳回)
```

## 关键业务规则

1. **自动状态联动**:
   - 补送全部完成 + 赔付全部审批通过 → 客诉自动标记为 resolved
   - 客诉分配处理人时，如果是 pending 状态自动改为 processing

2. **空桶自动调整**:
   - 补送完成时，empty_bucket_adjust 会自动更新客户的空桶数量
   - 空桶争议全程记录在客诉中，避免后续对账扯皮

3. **角色权限控制**:
   - 客服看不到内部备注 (is_internal=true)
   - 司机只能看到分配给自己的补送任务
   - 非管理员只能看到本站数据
   - 赔付审批只有 admin 和 station_master 有权限

4. **审计追踪**:
   - 所有状态变更记录前后值
   - 所有分配操作记录新旧处理人
   - 所有照片上传记录文件哈希
   - 所有审批操作记录审批人和意见

## 审计日志字段说明

每条审计日志包含：
- `entity_type`: 实体类型 (complaint/redelivery/compensation)
- `entity_id`: 实体ID
- `action`: 操作类型 (create/update/status_change/upload/approve/reject/assign/**create_note**)
- `user_id`: 操作人
- `field_name`: 变更字段名
- `old_value`: 变更前值
- `new_value`: 变更后值
- `metadata`: 附加信息（JSON格式，create_note 时包含 `note_id`、`is_internal`）
- `note_id`: **新增备注时返回** - 对应的备注ID
- `is_internal`: **新增备注时返回** - 是否为内部备注
- `created_at`: 操作时间

## 异步任务

内置3个Worker处理异步任务：

| 任务类型 | 说明 | 触发器 |
|---------|------|--------|
| `photo_verification` | 照片真实性校验 | 上传照片后自动触发 |
| `status_notify` | 状态变更通知 | 任何状态变更后 |
| `monthly_reconcile` | 月度对账 | 手动触发 |

## 演示数据说明

系统预置了5个完整的业务场景：

1. **场景1 - 少送补送+赔付** (已完成)
   - 客诉：北京科技有限公司少送2桶水
   - 补送：2桶水已送达，有签收照片
   - 赔付：额外赠送1桶水，已批准已支付
   - 状态：客诉已解决

2. **场景2 - 空桶争议** (处理中)
   - 客诉：家庭用户空桶数量差3个
   - 处理中：客服正在核实

3. **场景3 - 水桶漏水** (待处理)
   - 客诉：阳光幼儿园水桶漏水
   - 有照片证据，已审核通过
   - 赔付申请75元待审批

4. **场景4 - 配送延误** (已关闭)
   - 客诉：配送晚3小时
   - 赔付：50元优惠券，已支付

5. **场景5 - 送错品牌** (处理中)
   - 客诉：送错品牌
   - 补送：已排期，等待换回

所有场景都包含完整的：
- 状态变化历史
- 操作人记录
- 备注（含内部/外部）
- 审计日志

## 边界与限制 (当前版本做轻了的部分)

1. **文件存储**: 当前用本地文件系统，生产环境建议接对象存储 (OSS/S3)
2. **消息通知**: 当前只打日志，生产环境建议接短信/企业微信/邮件
3. **工作流引擎**: 当前是硬编码状态机，复杂场景建议接 Camunda
4. **报表统计**: 当前只有基础分页查询，复杂报表建议接 BI 工具
5. **权限粒度**: 当前是角色级，复杂场景建议做 RBAC + 数据权限
6. **对账系统**: 当前只有基础月度对账，完整财务对账需要接财务系统
7. **支付集成**: 当前赔付只是记账，实际支付需要接支付网关

## 故障排查

### 数据库连接失败
```
检查 .env 中的 DB_* 配置
确认 PostgreSQL 服务已启动
确认数据库 water_delivery 已创建
确认用户有访问权限
```

### 认证失败
```
确认 token 在有效期内 (默认24小时)
确认 Authorization 头格式为 "Bearer {token}"
确认 JWT_SECRET 配置正确
```

### 权限不足 (403)
```
确认当前用户角色有对应接口的访问权限
确认数据范围在当前角色的可见范围内
```

## 常用测试命令

```bash
# 登录拿token
TOKEN=$(curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"123456"}' | jq -r .access_token)

# 查询客诉列表
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/api/v1/complaints?page=1&page_size=10"

# 查看客诉详情
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/v1/complaints/{complaint_id}

# 切换客服角色
CS_TOKEN=$(curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"cs_1","password":"123456"}' | jq -r .access_token)

# 客服查看客诉（看不到内部备注）
curl -H "Authorization: Bearer $CS_TOKEN" \
  http://localhost:3000/api/v1/complaints/{complaint_id}
```
