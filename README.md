# 跑腿平台-用户退款与客服回查系统

基于 Go Fiber + PostgreSQL 构建的服务层，专注于用户退款、客服回查、派单与补贴的一体化处理。

---

## 🚀 快速开始

### 1. 环境要求

- Go 1.21+
- PostgreSQL 14+
- (可选) Redis 6+

### 2. 数据库准备

```sql
-- 创建数据库
CREATE DATABASE runner_platform;

-- 创建用户（可选）
CREATE USER runner WITH PASSWORD 'runner';
GRANT ALL PRIVILEGES ON DATABASE runner_platform TO runner;
```

### 3. 配置环境变量

复制 `.env` 文件并根据实际情况修改：

```bash
cp .env.example .env
```

主要配置项：
```env
PORT=8080
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=runner_platform
DATABASE_SSL_MODE=disable

JWT_SECRET=runner-platform-super-secret-key-2024
JWT_EXPIRE_HOURS=24
```

### 4. 安装依赖

```bash
go mod download
```

### 5. 编译运行

```bash
# 方式1: 直接运行
go run cmd/main.go

# 方式2: 编译后运行
go build -o runner-platform ./cmd/main.go
./runner-platform
```

服务启动后会自动：
1. 连接数据库
2. 执行数据库迁移（AutoMigrate）
3. 插入演示数据（首次启动）
4. 启动异步任务处理Worker

默认端口: `8080`

### 6. 验证服务

```bash
curl http://localhost:8080/api/v1/health
```

预期响应:
```json
{"status":"ok","time":"2024-05-20T18:30:00+08:00"}
```

---

## 👤 演示账号

所有账号默认密码: `123456`

| 用户名 | 角色 | 真实姓名 | 部门 | 说明 |
|--------|------|----------|------|------|
| `admin` | 系统管理员 | 系统管理员 | 技术部 | 最高权限 |
| `ops_manager` | 运营经理 | 张明 | 运营部 | 审核补贴、查看全量数据 |
| `dispatcher_01` | 调度员 | 李华 | 调度中心 | 派单、更新订单状态 |
| `dispatcher_02` | 调度员 | 王芳 | 调度中心 | 派单、更新订单状态 |
| `cs_01` | 客服 | 赵晓 | 客服部 | 审核退款、处理申诉 |
| `cs_02` | 客服 | 孙婷 | 客服部 | 审核退款、处理申诉 |
| `user_01` | 普通用户 | 陈伟 | - | 申请退款、申诉 |
| `user_02` | 普通用户 | 刘洋 | - | 申请退款、申诉 |
| `user_03` | 普通用户 | 周静 | - | 申请退款、申诉 |
| `runner_01` | 骑手 | 吴强 | 配送组A | 查看订单、申诉 |
| `runner_02` | 骑手 | 郑凯 | 配送组A | 查看订单、申诉 |
| `merchant_01` | 商家 | 好又多超市 | 商家 | 查看订单、申诉 |
| `merchant_02` | 商家 | 美味餐厅 | 商家 | 查看订单、申诉 |

### 登录示例

```bash
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"ops_manager","password":"123456"}'
```

---

## 🔄 角色切换指南

### 方式1: 更换Token（推荐）

不同角色登录获取不同的Token，在请求头中切换：

```bash
# 运营经理操作 - 创建补贴
TOKEN=$(curl -s -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"ops_manager","password":"123456"}' | jq -r '.data.access_token')

curl -X POST http://localhost:8080/api/v1/subsidies \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "order_id": "<订单UUID>",
    "payee_id": "<用户UUID>",
    "payee_type": "user",
    "amount": 50.00,
    "reason": "订单超时补偿",
    "description": "用户首次遇到超时"
  }'

# 客服操作 - 审核退款
TOKEN_CS=$(curl -s -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"cs_01","password":"123456"}' | jq -r '.data.access_token')

curl -X POST http://localhost:8080/api/v1/refunds/<退款UUID>/review \
  -H "Authorization: Bearer $TOKEN_CS" \
  -H "Content-Type: application/json" \
  -d '{"status":"approved","remark":"超时属实，同意退款"}'
```

### 方式2: 使用不同终端会话

| 终端 | 登录角色 | 职责场景 |
|------|----------|----------|
| 终端1 | ops_manager | 查看仪表盘、创建/审核补贴 |
| 终端2 | dispatcher_01 | 创建订单、派单、更新状态 |
| 终端3 | cs_01 | 审核退款、处理申诉、添加备注 |
| 终端4 | user_01 | 申请退款、申诉 |
| 终端5 | runner_01 | 查看订单、提起申诉 |

### 完整流程演练示例

```bash
# 1. 调度员创建订单
curl -X POST http://localhost:8080/api/v1/orders \
  -H "Authorization: Bearer $DISPATCHER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "<user_01的UUID>",
    "merchant_id": "<merchant_01的UUID>",
    "order_type": "food",
    "goods_description": "麻辣香锅",
    "goods_value": 88.00,
    "delivery_fee": 8.00,
    "pickup_address": "好又多超市...",
    "delivery_address": "用户地址..."
  }'

# 2. 调度员指派给骑手
curl -X POST http://localhost:8080/api/v1/orders/<订单ID>/assign \
  -H "Authorization: Bearer $DISPATCHER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"runner_id": "<runner_01的UUID>"}'

# 3. 用户申请退款
curl -X POST http://localhost:8080/api/v1/refunds \
  -H "Authorization: Bearer $USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "order_id": "<订单ID>",
    "reason": "timeout",
    "amount": 96.00,
    "description": "超时45分钟，餐品已凉"
  }'

# 4. 客服添加内部备注
curl -X POST http://localhost:8080/api/v1/refunds/<退款ID>/remarks \
  -H "Authorization: Bearer $CS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content": "已核实GPS确实超时35分钟", "is_internal": true}'

# 5. 客服审核通过
curl -X POST http://localhost:8080/api/v1/refunds/<退款ID>/review \
  -H "Authorization: Bearer $CS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "approved", "remark": "超时属实"}'

# 6. 骑手提起申诉
curl -X POST http://localhost:8080/api/v1/appeals \
  -H "Authorization: Bearer $RUNNER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "order_id": "<订单ID>",
    "refund_id": "<退款ID>",
    "title": "超时判定有误",
    "content": "我在17:58就到了，等用户12分钟"
  }'

# 7. 运营经理处理申诉
curl -X POST http://localhost:8080/api/v1/appeals/<申诉ID>/handle \
  -H "Authorization: Bearer $OPS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "upheld",
    "result": "申诉成立，撤销对骑手的罚款，补偿50元"
  }'

# 8. 运营经理创建补贴
curl -X POST http://localhost:8080/api/v1/subsidies \
  -H "Authorization: Bearer $OPS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "order_id": "<订单ID>",
    "appeal_id": "<申诉ID>",
    "payee_id": "<runner_01的UUID>",
    "payee_type": "runner",
    "amount": 50.00,
    "reason": "误判申诉通过，补贴骑手"
  }'

# 9. 查看退款完整链路
curl http://localhost:8080/api/v1/refunds/<退款ID>/detail \
  -H "Authorization: Bearer $OPS_TOKEN"
```

---

## 📋 已实现的核心能力

### ✅ 完整链路追踪
- 订单 → 退款 → 申诉 → 补贴 全链路关联
- 每个关键动作都记录操作日志（前后值、变更字段、操作人、时间、IP）
- 所有业务对象支持添加备注（公开/内部）
- 详情接口返回完整的操作历史

### ✅ 角色权限隔离
- 7种角色，精细到接口级的权限控制
- 运营经理、调度员、客服各有专属操作面
- 操作人信息自动注入日志，无需前端传递

### ✅ 多条件筛选
- 所有列表接口支持多条件组合查询
- 订单号模糊匹配
- 按状态、用户、日期范围筛选
- 统一分页格式

### ✅ 异步任务处理
- 退款通知自动入队
- 退款审批通过后5分钟自动标记完成
- 申诉/补贴结果自动通知
- 任务失败自动重试（最多3次）

### ✅ 演示数据
- 15条历史订单（含不同状态）
- 6条退款申请（含各种状态）
- 4条申诉（骑手、用户、商家各角色）
- 4条补贴记录（含已支付、待审核等状态）
- 完整的操作日志和备注历史

---

## ⚠️ 当前边界（轻量处理的部分）

### 1. 支付集成
- **现状**: 退款支付、补贴支付仅做状态标记，无真实支付网关调用
- **建议**: 接入支付宝/微信支付API时，扩展 `refund_payment` 和 `subsidy_payment` 任务处理器

### 2. 消息通知
- **现状**: 通知仅打日志，无真实推送（短信/App推送/邮件）
- **建议**: 集成第三方推送服务时，在任务处理器中添加真实调用

### 3. 文件上传
- **现状**: 凭证图片仅存储URL字符串，无实际文件上传处理
- **建议**: 接入对象存储（OSS/S3），添加文件上传接口

### 4. 实时通信
- **现状**: 状态变更仅通过异步任务处理，无WebSocket实时推送
- **建议**: 关键状态变更时，通过WebSocket通知相关方

### 5. 复杂报表
- **现状**: 仅提供基础的仪表盘统计
- **建议**: 基于操作日志和业务数据，开发按时段、按角色、按原因的多维度分析报表

### 6. 工作流引擎
- **现状**: 退款/申诉审核流程是硬编码的单级审核
- **建议**: 复杂场景（大额退款、多级审批）接入工作流引擎

### 7. 地理信息
- **现状**: 地址仅存文本，无经纬度和地图服务
- **建议**: 集成地图服务，计算真实配送距离和预计时间

### 8. Redis缓存
- **现状**: 已预留Redis配置但未实际使用
- **建议**: 热点数据（订单详情、用户信息）接入缓存，减轻DB压力

---

## 📁 项目结构

```
runner-platform/
├── cmd/
│   └── main.go                 # 主程序入口
├── internal/
│   ├── config/                 # 配置加载
│   │   └── config.go
│   ├── database/               # 数据库连接
│   │   └── database.go
│   ├── models/                 # 数据模型
│   │   └── models.go
│   ├── schemas/                # 请求/响应DTO
│   │   ├── auth.go
│   │   ├── order.go
│   │   ├── refund.go
│   │   ├── appeal.go
│   │   └── subsidy.go
│   ├── services/               # 业务逻辑层
│   │   ├── auth_service.go
│   │   ├── order_service.go
│   │   ├── refund_service.go
│   │   ├── appeal_service.go
│   │   ├── subsidy_service.go
│   │   └── log_service.go
│   ├── handlers/               # HTTP处理器
│   │   ├── auth_handler.go
│   │   ├── order_handler.go
│   │   ├── refund_handler.go
│   │   ├── appeal_handler.go
│   │   ├── subsidy_handler.go
│   │   └── log_handler.go
│   ├── middleware/             # 中间件
│   │   └── auth.go
│   ├── utils/                  # 工具函数
│   │   ├── jwt.go
│   │   ├── password.go
│   │   ├── response.go
│   │   ├── operation_log.go
│   │   └── order_no.go
│   ├── worker/                 # 异步任务
│   │   └── task_worker.go
│   └── seed/                   # 演示数据
│       └── seed.go
├── docs/                       # 文档
│   └── API.md
├── .env                        # 环境变量
├── go.mod
├── go.sum
└── README.md
```

---

## 🔧 常用命令

```bash
# 编译
go build -o runner-platform ./cmd/main.go

# 运行
go run cmd/main.go

# 查看模块依赖
go mod graph

# 更新依赖
go mod tidy
```

---

## 📝 数据库表说明

核心表共9张：

| 表名 | 说明 | 关键字段 |
|------|------|----------|
| `users` | 用户表 | role, status |
| `orders` | 订单表 | status, timeout_reason |
| `refunds` | 退款表 | status, reason, reviewed_by |
| `appeals` | 申诉表 | status, appealer_type, handler_id |
| `subsidies` | 补贴表 | status, payee_type, approved_by |
| `remarks` | 备注表 | target_type, is_internal |
| `operation_logs` | 操作日志 | action, old_value, new_value, changed_fields |
| `assignments` | 派单记录 | runner_id, assigned_by |
| `task_queue` | 任务队列 | task_type, status, retry_count |

---

## 🤝 核心设计原则

1. **谁操作谁留痕**: 所有写操作自动记录操作人、时间、IP
2. **状态驱动**: 退款/申诉/补贴均为状态机，非法状态流转直接拒绝
3. **关联优先**: 所有相关对象（订单→退款→申诉→补贴）建立外键关联，一键追溯
4. **异步解耦**: 通知、支付等耗时操作入队异步处理，不阻塞主流程
5. **权限最小化**: 接口级别控制角色访问，避免越权操作
