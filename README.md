# 船舶代理管理系统 - 靠泊计划与证件报备

> 一个基于 Express + Prisma 的船舶代理业务管理系统，实现靠泊计划与证件报备的链式追踪。

## 🌟 核心特性

### 🔗 统一业务链
- **全链路一体化**: 靠泊计划、证件、任务、换班、补给、费用、沟通共享同一个 `chainId`
- **版本管理**: 每次修改都会创建新版本，保留完整历史轨迹
- **链上溯源**: 通过 `chainId` 可以完整追溯整个业务生命周期
- **链路详情接口**: 一键获取整条业务链的所有相关数据和统计信息

### 👥 多角色权限分离
| 角色 | 权限范围 | 视图 |
|------|----------|------|
| **AGENT_MANAGER (代理经理)** | 审批、管理、导出、审计 | 全局管理视图，含统计和复盘功能 |
| **FIELD_COORDINATOR (现场协调)** | 靠泊计划录入、现场执行 | 一线操作视图，关注任务执行 |
| **DOCUMENT_SPECIALIST (单证专员)** | 证件管理、提交、跟进 | 单证视图，聚焦证件状态和截点 |
| **FINANCE_OFFICER (财务人员)** | 费用管理、结算 | 费用视图，关注款项回收 |

### 📊 厚服务层设计
- **高级筛选**: 多维度组合查询，支持模糊搜索、时间范围
- **CSV导出**: 靠泊计划、证件、费用、审计日志均可导出
- **审计日志**: 所有关键操作都有记录，支持事后追溯
- **任务流引擎**: 自动生成任务链，支持前置任务依赖检查
- **幂等控制**: 创建和状态变更接口支持幂等性，防止重复操作
- **精确权限控制**: 各模块按角色严格划分权限边界

### ⚠️ 异常处理体系
| 错误类型 | HTTP状态码 | 场景 |
|----------|-----------|------|
| `VALIDATION_ERROR` | 400 | 数据校验失败 |
| `AUTHENTICATION_ERROR` | 401 | 登录失效、令牌无效 |
| `AUTHORIZATION_ERROR` | 403 | 角色权限不足 |
| `NOT_FOUND` | 404 | 资源不存在 |
| `CONFLICT_ERROR` | 409 | 状态冲突、前置任务未完成 |
| `RATE_LIMIT_EXCEEDED` | 429 | 请求过于频繁 |
| `IDEMPOTENCY_PROCESSING` | 202 | 幂等请求正在处理中 |

## 🚀 快速开始

### 环境要求
- Node.js >= 18.0.0
- npm >= 9.0.0

### 安装步骤

1. **安装依赖**
```bash
npm install
```

2. **初始化数据库**
```bash
npm run db:init
```

3. **导入演示数据**
```bash
npm run db:seed
```

4. **启动服务**
```bash
npm run dev
```

服务将在 `http://localhost:3000` 启动

### 健康检查
```bash
curl http://localhost:3000/api/health
```

## 🔑 测试账号

| 角色 | 用户名 | 密码 | 说明 |
|------|--------|------|------|
| 代理经理 | `manager` | `password123` | 全局管理员，可审批和导出 |
| 现场协调 | `coordinator` | `password123` | 一线录入和执行 |
| 单证专员 | `specialist` | `password123` | 证件管理和提交 |
| 财务人员 | `finance` | `password123` | 费用管理和结算 |

## 📚 API 接口列表

### 认证
```
POST  /api/auth/login          # 登录获取令牌
GET   /api/auth/me             # 获取当前用户信息
POST  /api/auth/change-password # 修改密码
```

### 靠泊计划
```
GET    /api/berthing           # 获取靠泊计划列表（支持筛选）
GET    /api/berthing/:id       # 获取靠泊计划详情
GET    /api/berthing/chain/:chainId  # 获取版本历史
GET    /api/berthing/dashboard/stats # 获取统计数据
POST   /api/berthing           # 创建靠泊计划（自动生成任务链）
PUT    /api/berthing/:id       # 更新靠泊计划（自动版本化）
POST   /api/berthing/:id/status # 更新状态
```

### 证件管理
```
GET    /api/documents          # 获取证件列表
GET    /api/documents/:id      # 获取证件详情
GET    /api/documents/expiring # 获取即将过期的证件
POST   /api/documents          # 创建证件
PUT    /api/documents/:id      # 更新证件
POST   /api/documents/:id/status # 更新证件状态
```

### 任务管理
```
GET    /api/tasks              # 获取所有任务
GET    /api/tasks/my           # 获取我的任务
GET    /api/tasks/stats/mine   # 获取我的任务统计
GET    /api/tasks/:id          # 获取任务详情
POST   /api/tasks              # 创建任务（幂等）
PUT    /api/tasks/:id          # 更新任务
POST   /api/tasks/:id/status   # 更新任务状态（幂等）
```

### 业务链追踪
```
GET    /api/chain/:chainId           # 获取业务链完整详情
GET    /api/chain/plan/:planId       # 通过靠泊计划ID获取链详情
GET    /api/chain/:chainId/timeline  # 获取业务链时间线
GET    /api/chain/:chainId/stats     # 获取业务链统计
GET    /api/chain/my/list            # 获取我的业务链列表
```

### 费用管理
```
GET    /api/fees               # 获取费用列表
GET    /api/fees/overdue       # 获取逾期费用
GET    /api/fees/stats         # 获取费用统计
GET    /api/fees/:id           # 获取费用详情
POST   /api/fees               # 创建费用（幂等）
PUT    /api/fees/:id           # 更新费用
POST   /api/fees/:id/pay       # 标记已支付（幂等）
DELETE /api/fees/:id           # 删除费用
```

### 船员换班
```
GET    /api/crew               # 获取换班列表
GET    /api/crew/:id           # 获取换班详情
POST   /api/crew               # 创建换班（幂等）
PUT    /api/crew/:id           # 更新换班
POST   /api/crew/:id/status    # 更新换班状态（幂等）
DELETE /api/crew/:id           # 删除换班
```

### 补给申请
```
GET    /api/supply             # 获取补给列表
GET    /api/supply/:id         # 获取补给详情
POST   /api/supply             # 创建补给申请（幂等）
PUT    /api/supply/:id         # 更新补给申请
POST   /api/supply/:id/status  # 更新补给状态（幂等）
DELETE /api/supply/:id         # 删除补给申请
```

### 供应商沟通
```
GET    /api/communications              # 获取沟通记录列表
GET    /api/communications/supplier/:id # 获取供应商沟通记录
GET    /api/communications/:id          # 获取沟通详情
POST   /api/communications              # 创建沟通记录（幂等）
DELETE /api/communications/:id          # 删除沟通记录
```

### 导出功能（需经理权限）
```
GET    /api/export/berthing-plans  # 导出口靠泊计划CSV（AGENT_MANAGER）
GET    /api/export/documents       # 导出证件CSV（AGENT_MANAGER / DOCUMENT_SPECIALIST）
GET    /api/export/fees            # 导出费用CSV（AGENT_MANAGER / FINANCE_OFFICER）
GET    /api/export/audit-logs      # 导出审计日志CSV（AGENT_MANAGER专属）
```

### 审计日志（AGENT_MANAGER专属）
```
GET    /api/audit               # 获取审计日志
GET    /api/audit/summary       # 获取审计统计
GET    /api/audit/entity/:type/:id  # 获取单实体历史
```

## ⚠️ 异常场景演示数据

系统预置了以下异常场景，可直接用于测试：

### 1. 证件即将过期
- **场景**: 船舶安全证书3天后过期
- **测试**: `GET /api/documents/expiring`
- **预期**: 返回该证件，触发预警逻辑

### 2. 证件被拒绝
- **场景**: 海关申报单因缺少HS编码被退回
- **测试**: 查看状态为 `REJECTED` 的证件
- **预期**: 可看到拒绝原因，支持修改后重新提交

### 3. 任务阻塞
- **场景**: 货物申报任务因供应商材料未到被阻塞
- **测试**: 尝试将下一任务改为 `IN_PROGRESS`
- **预期**: 系统返回 409 冲突错误，提示前置任务未完成

### 4. 费用逾期
- **场景**: 港口使费85,000元已逾期未付
- **测试**: 查看未支付费用列表
- **预期**: 显示逾期状态和滞纳金备注

### 5. 版本变更
- **场景**: 靠泊计划从码头S2调整到S3，货物数量4000→4500
- **测试**: `GET /api/berthing/chain/{chainId}`
- **预期**: 可看到两个版本的完整对比

### 6. 审批被拒
- **场景**: 危险品作业申请因缺少资质被拒绝
- **测试**: 查看状态为 `REJECTED` 的靠泊计划
- **预期**: 可看到拒绝原因，支持修改后重新提交

## 🔒 幂等控制使用说明

所有创建和状态变更接口支持幂等控制，只需在请求头中添加：

```bash
x-idempotency-key: your-unique-key
```

使用相同的幂等键重复请求时，系统会返回第一次请求的结果，不会重复执行操作。

**支持幂等的接口**:
- 创建靠泊计划
- 更新靠泊计划状态
- 创建证件
- 更新证件状态
- 创建任务
- 更新任务状态
- 创建费用
- 标记费用已支付
- 创建船员换班
- 更新换班状态
- 创建补给申请
- 更新补给状态
- 创建沟通记录

## 🧪 测试场景示例

### 测试权限边界
```bash
# 使用单证专员(specialist)登录，尝试创建靠泊计划
# 预期: 返回 403 AUTHORIZATION_ERROR
curl -X POST http://localhost:3000/api/berthing \
  -H "Authorization: Bearer <specialist_token>" \
  -H "Content-Type: application/json" \
  -d '{"vesselId":"...","portId":"...","eta":"2024-12-31T12:00:00Z"}'
```

### 测试状态冲突
```bash
# 尝试将一个已完成(COMPLETED)的靠泊计划改为其他状态
# 预期: 返回 409 CONFLICT_ERROR
curl -X POST http://localhost:3000/api/berthing/{completed_id}/status \
  -H "Authorization: Bearer <manager_token>" \
  -H "Content-Type: application/json" \
  -d '{"status":"IN_PROGRESS"}'
```

### 测试前置任务依赖
```bash
# 尝试开始链上第4个任务，而第3个任务处于BLOCKED状态
# 预期: 返回 409 CONFLICT_ERROR，提示前置任务未完成
curl -X POST http://localhost:3000/api/tasks/{task_4_id}/status \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"status":"IN_PROGRESS"}'
```

### 测试幂等控制
```bash
# 使用相同的幂等键重复创建靠泊计划
# 预期: 第二次请求返回第一次创建的结果，不重复创建
curl -X POST http://localhost:3000/api/berthing \
  -H "Authorization: Bearer <manager_token>" \
  -H "x-idempotency-key: key-12345" \
  -H "Content-Type: application/json" \
  -d '{"vesselId":"...","portId":"...","eta":"2024-12-31T12:00:00Z"}'
```

### 测试业务链详情
```bash
# 获取整条业务链的完整信息
# 预期: 返回靠泊计划、证件、任务、费用、补给、换班、沟通的完整数据
curl -H "Authorization: Bearer <token>" \
  http://localhost:3000/api/chain/{chainId}
```

### 测试费用支付状态冲突
```bash
# 对已支付的费用再次标记支付
# 预期: 返回 409 CONFLICT_ERROR
curl -X POST http://localhost:3000/api/fees/{paid_fee_id}/pay \
  -H "Authorization: Bearer <finance_token>" \
  -H "Content-Type: application/json" \
  -d '{"paymentRef":"PAY-123"}'
```

## 📁 项目结构

```
src/
├── config/
│   └── prisma.js           # Prisma 客户端配置
├── middleware/
│   ├── auth.js             # 认证和权限中间件
│   ├── errorHandler.js     # 全局错误处理
│   └── idempotency.js      # 幂等控制中间件
├── routes/
│   ├── auth.js             # 认证接口
│   ├── berthing.js         # 靠泊计划接口
│   ├── documents.js        # 证件管理接口
│   ├── tasks.js            # 任务管理接口
│   ├── audit.js            # 审计日志接口
│   ├── export.js           # 导出功能接口
│   ├── chain.js            # 业务链接口
│   ├── fees.js             # 费用管理接口
│   ├── crew.js             # 船员换班接口
│   ├── supply.js           # 补给申请接口
│   └── communications.js   # 供应商沟通接口
├── services/
│   ├── authService.js      # 认证服务
│   ├── berthingService.js  # 靠泊计划服务
│   ├── documentService.js  # 证件服务
│   ├── taskService.js      # 任务流服务
│   ├── auditService.js     # 审计服务
│   ├── exportService.js    # 导出服务
│   ├── chainService.js     # 业务链服务
│   ├── feeService.js       # 费用服务
│   ├── crewService.js      # 船员换班服务
│   ├── supplyService.js    # 补给申请服务
│   └── communicationService.js # 沟通记录服务
├── utils/
│   └── errors.js           # 错误类定义
└── index.js                # 应用入口

prisma/
├── schema.prisma           # 数据模型定义
└── seed.js                 # 演示数据生成
```

## 🔧 关键设计决策

### 1. 链式数据模型
- 所有业务实体都有 `chainId` 和 `chainVersion`
- 修改操作采用"不可变"模式，新版本追加而非覆盖
- 便于完整追溯和回滚

### 2. 厚服务层
- 业务逻辑全部在 Service 层实现
- Controller 只负责参数解析和响应格式化
- 便于单元测试和复用

### 3. 审计日志
- 所有关键操作(CREATE/UPDATE/STATUS_CHANGE/APPROVE/EXPORT)都有记录
- 记录新旧值对比、操作人、IP地址
- 支持按实体、按用户、按时间维度查询

### 4. 任务流引擎
- 创建靠泊计划时自动生成7个标准任务
- 支持阻塞任务，前置任务未完成则后续无法开始
- 每个任务可独立分配负责人

## ⚠️ 简化说明 (Trade-offs)

本演示版本为了聚焦核心业务，做了以下简化：

1. **文件上传**: 证件的实际文件上传功能未实现，仅保存 `fileUrl` 引用
2. **邮件通知**: 状态变更邮件通知未实现，仅记录到审计日志
3. **实时通知**: WebSocket 实时推送未实现，需前端轮询
4. **工作流引擎**: 使用简单的状态机，未引入复杂的 BPMN 引擎
5. **报表功能**: 仅提供 CSV 导出，未实现复杂报表和图表
6. **多租户**: 单租户设计，不支持多船公司隔离
7. **支付集成**: 费用支付仅记录状态，未对接实际支付网关
8. **消息队列**: 所有操作同步执行，未引入异步队列

## 📝 开发命令

```bash
npm run dev        # 开发模式
npm run start      # 生产模式
npm run db:init    # 初始化数据库
npm run db:seed    # 导入演示数据
npm run db:reset   # 重置数据库
```

## 📄 许可证

MIT License
