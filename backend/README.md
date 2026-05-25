# 美术馆运营系统 - 票务核销与会员活动

## 项目概述

基于 Go Fiber + PostgreSQL 的美术馆运营管理系统，实现票务核销、会员活动管理、展品台账等核心功能。

## 技术栈

- **框架**: Go Fiber v2
- **数据库**: PostgreSQL + GORM
- **认证**: JWT Token
- **架构**: 分层架构 (models, handlers, middleware, routes)

## 快速开始

### 环境要求

- Go 1.21+
- PostgreSQL 13+

### 数据库配置

创建数据库用户和数据库：

```sql
CREATE USER gallery WITH PASSWORD 'gallery123';
CREATE DATABASE gallery_db OWNER gallery;
```

### 启动服务

```bash
cd backend
go mod tidy
go run main.go
```

服务将在 `http://localhost:8080` 启动

## 默认账户

| 用户名     | 密码   | 角色       | 说明           |
|------------|--------|------------|----------------|
| manager    | 123456 | 馆务经理   | 全权限         |
| ticketing  | 123456 | 票务专员   | 票务相关操作   |
| activities | 123456 | 活动执行   | 活动相关操作   |

## 角色权限设计

### 馆务经理 (manager)
- 用户管理
- 展品台账管理（含流转审批）
- 查看所有数据
- 审计日志查询
- 系统配置

### 票务专员 (ticketing)
- 票务创建、查询
- 票务核销
- 票务状态更新
- 票务统计

### 活动执行 (activities)
- 活动创建、编辑
- 活动报名管理
- 报名确认、签到
- 活动状态更新

## API 接口概览

### 认证接口
```
POST /api/v1/auth/login          # 登录
GET  /api/v1/auth/profile        # 获取当前用户信息
PUT  /api/v1/auth/password       # 修改密码
```

### 票务接口
```
POST   /api/v1/tickets                 # 创建票务
GET    /api/v1/tickets                 # 票务列表（支持筛选）
GET    /api/v1/tickets/:id             # 票务详情
PUT    /api/v1/tickets/:id/status      # 更新状态
POST   /api/v1/tickets/verify          # 核销票务
GET    /api/v1/tickets/statistics      # 票务统计
GET    /api/v1/tickets/verify-logs/all # 核销日志
```

### 活动接口
```
POST   /api/v1/activities                      # 创建活动
GET    /api/v1/activities                      # 活动列表
GET    /api/v1/activities/:id                  # 活动详情
PUT    /api/v1/activities/:id/status           # 更新活动状态
PUT    /api/v1/activities/:id/checkin-status   # 更新签到状态
POST   /api/v1/activities/:id/register         # 活动报名
GET    /api/v1/activities/:id/registrations    # 报名列表
POST   /api/v1/activities/registrations/:id/confirm  # 确认报名
POST   /api/v1/activities/registrations/:id/checkin  # 签到
GET    /api/v1/activities/:id/audit-logs       # 活动审计日志
```

### 展品接口
```
POST   /api/v1/exhibits                 # 创建展品
GET    /api/v1/exhibits                 # 展品列表
GET    /api/v1/exhibits/:id             # 展品详情
POST   /api/v1/exhibits/transfers       # 创建流转申请
GET    /api/v1/exhibits/transfers/all   # 流转列表
POST   /api/v1/exhibits/transfers/:id/confirm  # 确认流转
```

### 审计接口
```
GET    /api/v1/audit/logs        # 审计日志（支持筛选）
GET    /api/v1/audit/logs/:id    # 日志详情
GET    /api/v1/audit/trace       # 资源追踪
GET    /api/v1/audit/system-logs # 系统日志
```

### 异步任务接口
```
POST   /api/v1/tasks/export      # 创建导出任务
GET    /api/v1/tasks             # 任务列表
GET    /api/v1/tasks/:id         # 任务详情
```

## 核心业务流程

### 1. 票务核销流程

**正常流程**:
1. 票务专员创建票务 → 状态: issued
2. 观众到场，扫描二维码
3. 系统校验票的有效性（状态、有效期）
4. 核销成功 → 状态: verified
5. 记录核销日志

**异常场景处理**:
- 已核销过 → 返回 warning 状态
- 已过期 → 返回 error 状态
- 已退款 → 返回 error 状态
- 不存在 → 返回 error 状态

### 2. 活动报名流程

1. 活动执行创建活动（草稿状态）
2. 馆务经理审批发布 → 状态: published
3. 用户报名 → 状态: pending
4. 活动执行确认报名 → 状态: confirmed
5. 活动当天签到 → 记录签到时间
6. 活动结束 → 状态: ended

### 3. 展品流转流程

1. 馆务经理创建流转申请
2. 展品状态变更（需二次确认）
3. 更新展品位置和状态
4. 记录完整的流转历史

## 筛选与分页

所有列表接口支持以下参数：

| 参数       | 说明           | 示例                  |
|------------|----------------|-----------------------|
| page       | 页码           | page=1                |
| page_size  | 每页数量       | page_size=20          |
| status     | 状态筛选       | status=verified       |
| start_date | 开始日期       | start_date=2024-01-01 |
| end_date   | 结束日期       | end_date=2024-12-31   |

## 审计追踪

系统支持完整的操作审计：
- 所有关键操作自动记录日志
- 支持按资源编号追踪完整操作历史
- 记录操作人、时间、IP、变更前后数据
- 异常操作可回溯追溯

## 测试脚本

运行 API 测试：

```bash
chmod +x test_api.sh
./test_api.sh
```

## 实现取舍与后续扩展

### 当前实现取舍

1. **数据库选择**: PostgreSQL vs MySQL
   - 选择: PostgreSQL
   - 理由: JSON字段支持更好、事务处理更可靠、复杂查询性能优
   - 取舍: 部署相对复杂，资源占用略高

2. **认证方式**: JWT vs Session
   - 选择: JWT
   - 理由: 无状态、便于水平扩展、适合前后端分离
   - 取舍: 无法主动吊销，需依赖刷新机制

3. **任务调度**: 简单goroutine vs 消息队列
   - 选择: 简单goroutine异步
   - 理由: 当前业务量不大，实现简单
   - 取舍: 重启可能丢失任务，无重试机制

4. **权限控制**: 简单角色 vs RBAC
   - 选择: 三角色固定权限
   - 理由: 当前业务角色清晰，实现简单
   - 取舍: 灵活性不足，新增角色需改代码

### 后续扩展点

1. **消息队列集成** (Medium Priority)
   - 接入 RabbitMQ / Redis Stream
   - 支持任务持久化、重试、死信队列
   - 与通知系统、第三方系统对接

2. **缓存层** (Medium Priority)
   - 接入 Redis 缓存热点数据
   - 票务核销前置校验缓存
   - 统计数据预计算

3. **RBAC 权限系统** (Low Priority)
   - 支持动态角色创建
   - 细粒度权限控制
   - 数据权限隔离

4. **WebSocket 实时推送** (Low Priority)
   - 核销结果实时同步
   - 活动签到实时统计
   - 任务进度实时通知

5. **报表系统** (Medium Priority)
   - 多维度统计分析
   - 可视化图表
   - 定时报表邮件推送

6. **多端适配** (Low Priority)
   - 小程序核销端
   - 移动端管理后台
   - 自助取票机对接

7. **第三方集成** (Medium Priority)
   - 微信/支付宝支付
   - 短信/邮件通知
   - 人脸识别核销

## 项目结构

```
backend/
├── config/          # 配置管理
├── database/        # 数据库连接
├── models/          # 数据模型
├── handlers/        # 业务处理
├── middleware/      # 中间件
├── routes/          # 路由定义
├── utils/           # 工具函数
├── async/           # 异步任务
├── seeders/         # 种子数据
├── main.go          # 入口文件
└── test_api.sh      # API测试脚本
```
