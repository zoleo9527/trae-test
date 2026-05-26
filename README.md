# 眼镜连锁 - 验光预约与加工跟单服务

基于 Express + SQLite 的后端服务，覆盖验光预约、订单管理、镜片调拨、加工跟单、返修退款全流程，提供任务看板、数据筛选、CSV 导出与审计日志。

## 启动方式

```bash
# 1. 安装依赖
npm install

# 2. 初始化种子数据（可选，会创建测试账号和演示数据）
npm run seed

# 3. 启动服务
npm start
# 服务默认运行在 http://localhost:3000
```

## 测试账号

| 用户名 | 密码 | 角色 | 说明 |
|--------|------|------|------|
| admin | admin123 | 系统管理员 | 全权限 |
| manager1 | manager123 | 门店店长 | 中心旗舰店 |
| manager2 | manager123 | 门店店长 | 东区分店 |
| optician1 | optician123 | 验光师 | 中心旗舰店 |
| optician2 | optician123 | 验光师 | 东区分店 |
| processor1 | processor123 | 加工师 | 中心旗舰店 |
| processor2 | processor123 | 加工师 | 东区分店 |
| service1 | service123 | 客服 | 中心旗舰店 |

## API 概览

### 认证
- `POST /api/auth/login` — 登录，返回 JWT token
- `GET /api/auth/me` — 获取当前用户信息

### 任务看板
- `GET /api/tasks/dashboard` — 首页看板（今日预约、超时、镜片短缺、待处理返修/退款）
- `GET /api/tasks/store-stats` — 各门店统计

### 预约单
- `GET /api/appointments` — 列表（支持 store_id, status, optician_id, priority, date_from, date_to, keyword, limit, offset）
- `GET /api/appointments/:id` — 详情
- `POST /api/appointments` — 创建
- `PUT /api/appointments/:id` — 更新
- `POST /api/appointments/:id/transition` — 状态流转（action: confirm/start/complete/cancel/no_show）
- `GET /api/appointments/my/tasks` — 我的任务

### 订单
- `GET /api/orders` — 列表（支持 status, status_in, priority, has_rework, has_refund, keyword 等）
- `GET /api/orders/stats` — 订单统计
- `GET /api/orders/:id` — 详情（含状态历史、返修、退款、调拨、加工记录）
- `POST /api/orders` — 创建
- `PUT /api/orders/:id` — 更新
- `POST /api/orders/:id/transition` — 状态流转
- `POST /api/orders/:id/allocate-lens` — 镜片分配
- `POST /api/orders/allocations/:id/receive` — 确认镜片收货

### 返修 & 退款
- `GET /api/reworks` — 返修列表
- `GET /api/reworks/:id` — 返修详情
- `POST /api/reworks` — 创建返修
- `POST /api/reworks/:id/approve|reject|complete` — 处理返修
- `GET /api/refunds` — 退款列表
- `GET /api/refunds/:id` — 退款详情
- `POST /api/refunds` — 创建退款
- `POST /api/refunds/:id/approve|reject|complete` — 处理退款

### 导出
- `GET /api/exports/orders` — 导出订单 CSV
- `GET /api/exports/appointments` — 导出预约 CSV
- `GET /api/exports/reworks` — 导出返修 CSV

### 审计
- `GET /api/audit` — 审计日志列表
- `GET /api/audit/:id` — 审计详情
- `GET /api/audit/actions` — 可用操作类型

### 基础数据
- `GET /api/base/stores` — 门店列表
- `GET /api/base/lens-sku` — 镜片 SKU 列表
- `POST /api/base/lens-sku` — 新增镜片 SKU
- `GET /api/base/customers` — 客户列表
- `POST /api/base/customers` — 新增客户
- `GET /api/base/optometry-records/:appointmentId` — 验光记录
- `POST /api/base/optometry-records` — 创建验光记录

## 错误响应格式

```json
{
  "code": "VALIDATION_ERROR",
  "message": "参数校验失败",
  "details": { "customer_id": "客户ID必填" },
  "timestamp": "2026-05-26T08:00:00.000Z"
}
```

### 错误码

| HTTP 状态码 | code | 说明 |
|-------------|------|------|
| 400 | VALIDATION_ERROR | 参数校验失败 |
| 401 | AUTH_ERROR | 认证失败（Token 无效/过期） |
| 403 | PERMISSION_DENIED | 权限不足 |
| 404 | NOT_FOUND | 资源不存在 |
| 409 | STATE_CONFLICT | 状态冲突（当前状态不允许该操作） |
| 422 | LENS_ALLOCATION_ERROR | 镜片调拨异常 |
| 422 | STOCK_ERROR | 库存不足 |

## 状态机

### 预约单状态
`pending → confirmed → in_progress → completed`
可跳转到：`cancelled`, `no_show`, `overdue`

### 订单状态
`pending → lens_allocating → lens_allocated → processing → quality_check → ready → delivered → completed`
异常路径：`lens_shortage`（库存不足）、`returned`（返修）、`refunding/refunded`（退款）、`cancelled`（取消）

### 返修状态
`pending → approved → reprocessing → completed`，可 `rejected`

### 退款状态
`pending → approved → completed`，可 `rejected`

## 演示数据异常场景

种子数据预置了以下可触发异常处理的场景：

1. **镜片缺货订单**（ORD...003）：状态为 `lens_shortage`，豪雅优适1.67 库存为 0，需要从东区分店调拨
2. **待审批返修**（ORD...004）：客户赵丽丽（VIP）反映瞳距不准，返修单待处理
3. **质检不合格**（ORD...005）：周建军的订单质检不合格，已创建返修单并批准
4. **待处理退款**（ORD...007）：孙美玲的订单因镜片缺货发起退款，待审批
5. **超时预约**：周建军 2 天前的预约已标记为 `overdue`
6. **紧急加工单**（ORD...002）：李晓红的加急单正在加工中

## 刻意简化的部分

1. **支付集成**：未对接真实支付网关，支付状态仅做标记
2. **消息通知**：未实现短信/微信推送，状态变更仅做审计记录
3. **前端界面**：本项目仅提供后端 API，无前端页面
4. **文件存储**：验光报告、处方单等文件未实现上传存储
5. **多店库存联动**：镜片调拨支持跨店记录，但库存扣减逻辑做了简化（直接在 SKU 表统一管理）
6. **定时任务**：超时自动标记未做 cron，可通过 `POST /api/appointments/:id/transition` 手动触发或自行添加定时调用
