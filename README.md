# 珠宝门店 - 报价审批与保养预约系统

基于 Go Fiber + Postgres 构建的珠宝门店业务管理系统，整合报价审批与保养预约流程，实现全链路操作留痕。

## 项目结构

```
trae-test-2/
├── config/          # 配置管理
├── database/        # 数据库连接、迁移、种子数据
├── handlers/        # API 处理器
├── middleware/      # 中间件（鉴权等）
├── models/          # 数据模型
├── routes/          # 路由定义
├── services/        # 业务服务
├── utils/           # 工具函数
├── .env             # 环境变量
├── go.mod
├── main.go
└── README.md
```

## 功能特性

### 1. 报价审批模块
- **定制订单**：客户定制珠宝首饰的报价流程
- **调货申请**：跨店/跨区域调货的报价审批
- **返修报价**：维修返修的费用审批
- **状态流转**：草稿 → 待审批 → 已批准/已驳回/需修改 → 已完成

### 2. 保养预约模块
- **清洗保养**：日常清洗服务
- **抛光翻新**：首饰抛光处理
- **维修服务**：断裂、变形等修复
- **改圈服务**：戒指圈口调整
- **石重镶**：钻石/宝石加固重镶
- **状态流转**：待确认 → 已确认 → 处理中 → 已完成 → 已取货

### 3. 角色权限
- **店长(manager)**：全权限，审批报价，管理产品和客户
- **导购(salesperson)**：创建报价/预约，查看自己的业务
- **售后专员(after_sales)**：处理保养预约，跟进维修进度

### 4. 操作留痕
- 所有关键操作均记录审计日志
- 状态变更历史完整追溯
- 变更前后字段对比
- 记录操作者、时间、IP

## 快速开始

### 前置要求
- Go 1.20+
- PostgreSQL 14+

### 数据库准备

```sql
CREATE DATABASE jewelry_store;
```

### 环境配置

编辑 `.env` 文件：

```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=jewelry_store
JWT_SECRET=jewelry-store-secret-key-2024
JWT_EXPIRE_HOURS=24
SERVER_PORT=8080
```

### 启动服务

```bash
go run .
```

服务将在 `http://localhost:8080` 启动。

## 演示账号

系统启动时会自动创建演示数据：

| 角色 | 用户名 | 密码 | 说明 |
|------|--------|------|------|
| 店长 | manager | 123456 | 全权限 |
| 导购 | sales1 | 123456 | 李导购 |
| 导购 | sales2 | 123456 | 王导购 |
| 售后 | aftersales | 123456 | 赵售后 |

## API 接口

### 认证接口

```bash
# 登录
POST /api/auth/login
Content-Type: application/json

{
  "username": "manager",
  "password": "123456"
}

# 获取当前用户信息
GET /api/auth/me
Authorization: Bearer {token}
```

### 报价审批接口

```bash
# 创建报价单
POST /api/quotations

# 获取报价单列表（支持筛选）
GET /api/quotations?status=pending&type=custom&page=1&page_size=10

# 获取报价单详情（含审批记录和状态历史）
GET /api/quotations/:id

# 更新报价单（仅草稿/需修改状态）
PUT /api/quotations/:id

# 提交审批
POST /api/quotations/:id/submit

# 审批（店长权限）
POST /api/quotations/:id/approve
{
  "action": "approve",  // approve / reject / revise
  "comment": "审批意见"
}

# 标记完成
POST /api/quotations/:id/complete
```

### 保养预约接口

```bash
# 创建保养预约
POST /api/maintenances

# 获取保养列表（支持筛选）
GET /api/maintenances?status=pending&type=cleaning

# 获取保养详情
GET /api/maintenances/:id

# 更新保养信息
PUT /api/maintenances/:id

# 更新状态
POST /api/maintenances/:id/status
{
  "status": "in_progress",
  "comment": "开始处理"
}

# 分配处理人
POST /api/maintenances/:id/assign
```

### 客户管理

```bash
# 新增客户
POST /api/customers

# 客户列表（支持搜索）
GET /api/customers?keyword=陈女士&level=vip

# 客户详情（含历史报价和保养记录）
GET /api/customers/:id
```

### 产品管理

```bash
# 产品列表
GET /api/products?keyword=钻戒&category=ring

# 产品详情
GET /api/products/:id
```

### 审计日志

```bash
# 全量审计日志（店长权限）
GET /api/audit/logs?module=quotation

# 单条记录审计日志
GET /api/audit/logs/:module/:id

# 状态变更历史
GET /api/audit/history/:module/:id
```

## 业务流程示例

### 报价审批流程

1. **导购** 创建报价单（状态：草稿）
2. **导购** 提交审批（状态：待审批，自动指派店长）
3. **店长** 审批：
   - 通过 → 状态：已批准
   - 驳回 → 状态：已驳回
   - 需要修改 → 状态：需修改，返回给导购
4. **导购** 完成订单 → 状态：已完成

### 保养预约流程

1. **导购** 创建保养预约（状态：待确认）
2. **售后专员** 确认接单（状态：已确认）
3. **售后专员** 开始处理（状态：处理中）
4. **售后专员** 完成保养（状态：已完成）
5. **导购** 客户取货（状态：已取货）

## 数据说明

### 演示数据包含

- **用户**：4个（店长1，导购2，售后1）
- **客户**：3个（VIP、普通、黄金会员）
- **产品**：3个（钻戒、珍珠项链、黄金手镯）
- **报价单**：5个（各状态覆盖：已完成、已批准、待审批、需修改、草稿）
- **保养记录**：5个（各状态覆盖）
- **审批记录**：3条
- **状态历史**：8条

## 当前边界说明

### 已实现
- ✅ JWT 鉴权和角色权限控制
- ✅ 报价审批完整流程
- ✅ 保养预约完整流程
- ✅ 操作审计日志
- ✅ 状态变更历史追溯
- ✅ 基础筛选和分页
- ✅ 客户和产品基础管理

### 轻量化处理（可扩展）
- ⚠️ **异步任务**：当前同步执行，可扩展为消息队列
- ⚠️ **消息通知**：当前无推送，可接入微信/短信
- ⚠️ **文件上传**：当前无图片/附件上传
- ⚠️ **报表统计**：当前无复杂报表，可后续扩展
- ⚠️ **库存管理**：产品库存字段已预留，流程待完善
- ⚠️ **支付集成**：定金和费用支付流程待接入
- ⚠️ **多门店**：单门店设计，可扩展为多门店架构

## 常见问题

### 如何切换角色测试？
使用不同账号登录即可，每个账号的权限和可见数据范围不同：
- manager：看到所有数据，可审批
- sales1/sales2：只看到自己创建的报价和预约
- aftersales：看到分配给自己或未分配的保养任务

### 高价值货品交接如何留痕？
所有状态变更都会记录：
- 变更前状态
- 变更后状态
- 操作人
- 操作时间
- 备注说明

可通过 `/api/audit/history/quotation/:id` 查看完整链路。

### 如何扩展异步任务？
可引入 `asynq` 或 `machinery` 等异步任务库，当前审计日志为同步写入，可改为异步提升性能。
