# 茶叶经销-订货分仓与发货复核系统

## 项目概述

基于 Go Fiber + PostgreSQL 构建的茶叶经销管理系统，覆盖订货分仓、发货复核全流程，重点解决批次混发、活动价口径乱、损耗追踪等业务痛点。

## 技术栈

- **后端框架**: Go Fiber v2
- **数据库**: PostgreSQL 14+
- **ORM**: GORM
- **认证**: JWT
- **异步任务**: 自研 Worker 池
- **导出**: Excelize

## 目录结构

```
backend/
├── cmd/
│   └── main.go              # 程序入口
├── internal/
│   ├── auth/                # JWT认证中间件
│   ├── config/              # 配置加载
│   ├── controllers/         # API控制器
│   ├── db/                  # 数据库连接
│   ├── models/              # 数据模型与错误定义
│   ├── routes/              # 路由配置
│   ├── seed/                # 演示数据初始化
│   └── services/            # 业务服务层
├── .env                     # 环境变量
├── go.mod
└── README.md
```

## 快速开始

### 前置要求

- Go 1.21+
- PostgreSQL 14+

### 1. 数据库准备

```sql
CREATE DATABASE tea_distribution;
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env` 并修改数据库连接信息。

### 3. 初始化演示数据（首次运行）

```bash
cd backend
go run cmd/main.go -seed
```

### 4. 启动服务

```bash
cd backend
go run cmd/main.go
```

服务默认运行在 `http://localhost:8080`

### 5. 健康检查

```bash
curl http://localhost:8080/api/health
```

## 测试账号

| 用户名     | 密码         | 角色       | 权限说明                     |
|------------|--------------|------------|------------------------------|
| manager    | manager123   | 经销负责人 | 全部权限、审批、导出、审计   |
| sales1     | sales123     | 业务员     | 订货单创建、提交、取消       |
| sales2     | sales123     | 业务员     | 订货单创建、提交、取消       |
| warehouse1 | warehouse123 | 仓管       | 分仓、拣货、发货、复核       |
| warehouse2 | warehouse123 | 仓管       | 分仓、拣货、发货、复核       |

## 核心业务流程

### 1. 订货流程

```
创建订货单(草稿) → 提交 → [价格审批] → 已审批 → 分仓
```

- 折扣超过10%自动进入待审批状态
- 支持批量提交、批量审批

### 2. 分仓流程

```
已审批订单 → 生成分仓单 → 开始拣货 → 确认打包 → 发货
```

- 支持多批次分配，自动标记批次混发
- 库存锁定与消耗自动处理
- 支持异常标记与解决

### 3. 发货复核流程

```
已发货 → 开始复核 → 提交复核结果 → [争议处理] → 完成
```

- 支持按SKU登记损耗与异常
- 价格问题、批次问题可单独标记
- 复核结果影响订单最终状态

## API 概览

### 认证
- `POST /api/auth/login` - 登录获取Token

### 订货单
- `GET    /api/orders` - 列表（支持多条件筛选）
- `POST   /api/orders` - 创建
- `GET    /api/orders/:id` - 详情
- `POST   /api/orders/:id/submit` - 提交
- `POST   /api/orders/:id/approve` - 审批（仅负责人）
- `POST   /api/orders/:id/reject` - 驳回（仅负责人）
- `POST   /api/orders/:id/cancel` - 取消
- `POST   /api/orders/batch/submit` - 批量提交
- `POST   /api/orders/batch/approve` - 批量审批

### 分仓单
- `GET    /api/allocations` - 列表
- `POST   /api/allocations` - 创建（仅仓管/负责人）
- `GET    /api/allocations/:id` - 详情
- `POST   /api/allocations/:id/start-picking` - 开始拣货
- `POST   /api/allocations/:id/confirm-packed` - 确认打包
- `POST   /api/allocations/:id/mark-exception` - 标记异常
- `POST   /api/allocations/:id/resolve-exception` - 解决异常

### 发货单
- `GET    /api/shipments` - 列表
- `GET    /api/shipments/abnormal` - 异常发货单列表
- `POST   /api/shipments` - 创建发货单
- `GET    /api/shipments/:id` - 详情
- `POST   /api/shipments/:id/start-review` - 开始复核
- `POST   /api/shipments/:id/review` - 提交复核
- `POST   /api/shipments/:id/resolve-dispute` - 解决争议

### 审计日志
- `GET /api/audit-logs` - 审计日志（仅负责人）

### 导出
- `POST   /api/exports/orders` - 导出订单（异步）
- `POST   /api/exports/shipments` - 导出发货单（异步）
- `GET    /api/exports/tasks` - 导出任务列表
- `GET    /api/exports/tasks/:id` - 任务状态
- `GET    /api/exports/tasks/:id/download` - 下载文件

## 演示数据说明

系统预置了覆盖各种场景的演示数据：

### 1. 草稿订单 (ORD202405200001)
- 杭州旗舰店常规补货
- 状态：草稿
- 可测试：提交流程

### 2. 待审批订单 (ORD202405200002)
- 上海南京路店618活动备货
- 状态：待审批
- 折扣20%，触发价格审批
- 可测试：审批/驳回流程

### 3. 批次混发场景 (ORD202405200003)
- 北京王府井店补货
- 状态：分仓拣货中
- 包含批次混发：西湖龙井使用了两个批次（202401新茶 + 202306临期）
- 可测试：批次混发标记、拣货完成

### 4. 损耗异常场景 (ORD202405200004)
- 成都春熙路店补货
- 状态：发货复核中
- 包含运输破损：正山小种少1罐
- 包含价格异常：祁门红茶单价高于标准价
- 可测试：复核流程、异常登记

### 5. 库存异常场景 (ORD202405200005)
- 广州天河城店补货
- 状态：分仓异常
- 大红袍库存不足，已标记异常
- 可测试：异常解决流程

## 错误码说明

| 错误码               | HTTP状态 | 说明                     |
|----------------------|----------|--------------------------|
| VALIDATION_FAILED    | 400      | 参数校验失败             |
| NOT_FOUND            | 404      | 资源不存在               |
| PERMISSION_DENIED    | 403      | 权限不足                 |
| STATUS_CONFLICT      | 409      | 状态冲突，操作不允许     |
| INSUFFICIENT_STOCK   | 400      | 库存不足                 |
| PRICE_CONFLICT       | 400      | 价格冲突                 |
| BATCH_MIXED          | 400      | 批次混发警告             |
| INTERNAL_ERROR       | 500      | 系统内部错误             |

## 刻意简化的部分

1. **支付与结算**: 未实现应收应付、发票、对账单等财务模块
2. **多仓库调货**: 库存不足时需要手动处理，未实现自动调货逻辑
3. **消息通知**: 仅留痕审计日志，未实现短信/邮件/站内信推送
4. **复杂报表**: 仅提供基础导出，未实现销售分析、库存预警等BI报表
5. **权限粒度**: 简化为3种角色，未实现更细粒度的按钮级权限
6. **物流跟踪**: 仅记录物流单号，未对接实际物流API
7. **移动端**: 纯RESTful API，未开发H5或小程序界面
8. **批量分仓**: 目前是单订单分仓，未实现按波次批量分仓

## 项目亮点

1. **厚服务层设计**: 核心业务逻辑全部封装在Service层，Controller只做参数解析和响应
2. **全链路审计**: 所有状态变更都有审计日志，支持按实体追溯
3. **明确的错误分层**: 校验失败、权限不足、状态冲突返回不同HTTP状态码和错误码
4. **异步化导出**: 大数据量导出异步处理，避免阻塞请求
5. **库存乐观锁**: 库存操作使用数据库行级锁，避免超卖
6. **真实业务场景**: 演示数据覆盖实际业务中最头疼的异常场景
