# 苗木基地-客户回访与补苗协商系统

## 项目概述

针对苗木基地当前地块表、装车单、电话回访记录碎片化处理的痛点，设计实现的多人协作业务处理系统。核心解决起苗、养护、补苗协商数据分散导致的追责难、扯皮多问题。

### 设计理念

- **多人协作处理面**：按基地负责人、养护员、销售跟单三种角色设计流程，而非单人录入页
- **数据统一**：一线处理和管理回看基于同一套数据，避免复盘争吵
- **留痕可追溯**：所有操作自动审计记录，权限和审计从数据里看得见
- **主场景覆盖**：针对病害上报晚、装车数量不准、客户索赔扯不清等日常反复出现的问题

## 技术栈

- **后端框架**：Express 4.18
- **ORM**：Prisma 5.10
- **数据库**：SQLite（可无缝切换为PostgreSQL/MySQL）
- **语言**：TypeScript 5.4
- **认证**：JWT（24小时过期）
- **验证**：Joi
- **日志**：Winston

## 核心特性

### 1. 角色权限体系

| 角色 | 权限范围 | 主要职责 |
|------|----------|----------|
| 基地负责人 (BASE_MANAGER) | 所有权限 | 审核补苗协商、审批起苗任务、查看审计日志 |
| 养护员 (MAINTENANCE_WORKER) | 养护、病害、起苗执行 | 养护记录、病害上报、起苗执行、补苗实施 |
| 销售跟单 (SALES_COORDINATOR) | 回访、协商创建 | 客户回访、创建补苗协商、客户确认 |

### 2. 补苗协商状态机

```
DRAFT(草稿) → SUBMITTED(已提交) → MANAGER_REVIEW(经理审核)
     ↓                ↓                    ↓
REWORK_REQUIRED ←  APPROVED(通过)  →  REJECTED(驳回)
                        ↓
                  IMPLEMENTING(执行中)
                        ↓
                  COMPLETED(已完成)
                        ↓
                  CUSTOMER_CONFIRMED(客户确认)
```

- 状态流转自动记录历史
- 每次流转自动创建对应角色待办事项
- 关键操作使用数据库事务保证一致性

### 3. 审计追踪

- 所有变更自动记录审计日志（创建、更新、删除、状态变更）
- 记录字段：操作人、时间、IP、User-Agent、前后值、变更摘要
- JSON字段自动序列化存储，支持事后追溯
- 基地负责人可查看完整审计日志

### 4. 幂等性机制

- 所有写操作接口要求 `x-idempotency-key` 请求头
- 幂等键24小时有效期
- 相同用户相同幂等键重复请求直接返回缓存响应
- 避免重复提交导致的数据不一致

### 5. 首页仪表盘

登录后首页一眼可见：

- **待处理**：待审核的补苗协商、待执行的起苗任务、待处理病害
- **已驳回**：被驳回的补苗协商（需重新提交）
- **需回查**：未解决病害、需跟进回访、待客户确认
- **统计概览**：地块、批次、起苗、装车、协商数量统计

## 快速开始

### 环境要求

- Node.js >= 18
- npm >= 9

### 一键初始化

```bash
# 1. 安装依赖
npm install

# 2. 一键初始化（迁移 + 生成Client + 种子数据）
npm run init

# 3. 启动开发服务器
npm run dev
```

### 分步启动

```bash
# 安装依赖
npm install

# 生成Prisma客户端
npm run prisma:generate

# 执行数据库迁移
npm run prisma:migrate --name init

# 填充演示数据
npm run prisma:seed

# 启动开发服务器
npm run dev
```

### 本地启动路径

- **服务器地址**：http://localhost:3000
- **API基础路径**：http://localhost:3000/api

## 演示入口

### 演示账号

| 角色 | 用户名 | 密码 |
|------|--------|------|
| 基地负责人 | manager | manager123 |
| 养护员 | worker | worker123 |
| 销售跟单 | sales | sales123 |

### 快速测试

```bash
# 1. 健康检查
curl http://localhost:3000/api/health

# 2. 登录获取Token（基地负责人）
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"manager","password":"manager123"}' | \
  python3 -c "import sys,json; print(json.load(sys.stdin)['data']['token'])")

# 3. 查看仪表盘（首页）
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/dashboard

# 4. 查看待办事项
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/dashboard/todos

# 5. 查看审计日志（仅基地负责人）
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/dashboard/audit-logs
```

### 主场景演示流程

```bash
# === 销售跟单角色 ===
# 1. 销售登录
SALES_TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"sales","password":"sales123"}' | \
  python3 -c "import sys,json; print(json.load(sys.stdin)['data']['token'])")

# 2. 创建客户回访记录
curl -s -X POST http://localhost:3000/api/visits \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SALES_TOKEN" \
  -H "x-idempotency-key: visit-$(date +%s)" \
  -d '{
    "customerName": "演示园林公司",
    "customerPhone": "13800000000",
    "visitDate": "2025-05-20",
    "visitType": "电话回访",
    "result": "DISSATISFIED",
    "feedback": "客户反映部分苗木叶片干枯",
    "hasComplaint": true,
    "complaintDetail": "要求补苗15株"
  }'

# === 基地负责人角色 ===
# 3. 查看仪表盘待处理
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/dashboard

# 4. 审核补苗协商（通过/驳回/要求修改）
curl -s -X PATCH http://localhost:3000/api/negotiations/{协商ID}/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -H "x-idempotency-key: approve-$(date +%s)" \
  -d '{
    "newStatus": "APPROVED",
    "changeReason": "情况属实，同意补苗",
    "managerNote": "请养护组尽快安排"
  }'

# === 养护员角色 ===
# 5. 养护员登录
WORKER_TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"worker","password":"worker123"}' | \
  python3 -c "import sys,json; print(json.load(sys.stdin)['data']['token'])")

# 6. 养护员查看待办
curl -H "Authorization: Bearer $WORKER_TOKEN" http://localhost:3000/api/dashboard/todos
```

## API 接口列表

### 认证接口

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| POST | `/api/auth/login` | 登录获取Token | 公开 |
| GET | `/api/auth/me` | 获取当前用户信息 | 登录用户 |

### 业务接口

| 方法 | 路径 | 说明 | 幂等 | 权限 |
|------|------|------|------|------|
| GET | `/api/dashboard` | 首页仪表盘数据 | - | 所有登录用户 |
| GET | `/api/dashboard/todos` | 我的待办列表 | - | 所有登录用户 |
| GET | `/api/dashboard/todos/stats` | 待办统计 | - | 所有登录用户 |
| PATCH | `/api/dashboard/todos/:id/complete` | 标记待办完成 | - | 所有登录用户 |
| GET | `/api/dashboard/diseases/unresolved` | 未解决病害 | - | 负责人/养护员 |
| GET | `/api/dashboard/visits/followup` | 需跟进回访 | - | 负责人/销售 |
| GET | `/api/dashboard/audit-logs` | 审计日志 | - | 基地负责人 |

| 方法 | 路径 | 说明 | 幂等 | 权限 |
|------|------|------|------|------|
| POST | `/api/harvests` | 创建起苗记录 | 是 | 负责人/养护员 |
| GET | `/api/harvests` | 起苗记录列表 | - | 负责人/养护员 |
| PATCH | `/api/harvests/:id/status` | 更新起苗状态 | 是 | 负责人/养护员 |
| POST | `/api/harvests/:id/loadings` | 创建装车记录 | 是 | 负责人 |

| 方法 | 路径 | 说明 | 幂等 | 权限 |
|------|------|------|------|------|
| POST | `/api/maintenance` | 创建养护记录 | 是 | 养护员 |
| GET | `/api/maintenance` | 养护记录列表 | - | 负责人/养护员 |
| PATCH | `/api/maintenance/:id/review` | 审核养护记录 | 是 | 基地负责人 |
| POST | `/api/maintenance/diseases` | 病害上报 | 是 | 养护员 |
| GET | `/api/maintenance/diseases` | 病害列表 | - | 负责人/养护员 |
| PATCH | `/api/maintenance/diseases/:id/resolve` | 标记病害解决 | 是 | 负责人/养护员 |

| 方法 | 路径 | 说明 | 幂等 | 权限 |
|------|------|------|------|------|
| POST | `/api/visits` | 创建回访记录 | 是 | 销售/负责人 |
| GET | `/api/visits` | 回访记录列表 | - | 销售/负责人 |
| PATCH | `/api/visits/:id/followup` | 标记已跟进 | 是 | 销售/负责人 |

| 方法 | 路径 | 说明 | 幂等 | 权限 |
|------|------|------|------|------|
| POST | `/api/negotiations` | 创建补苗协商 | 是 | 销售/负责人 |
| GET | `/api/negotiations` | 协商列表 | - | 所有登录用户 |
| GET | `/api/negotiations/:id` | 协商详情 | - | 所有登录用户 |
| POST | `/api/negotiations/:id/submit` | 提交审核 | 是 | 创建者 |
| PATCH | `/api/negotiations/:id/status` | 更新协商状态 | 是 | 按角色权限 |

## 项目结构

```
├── prisma/
│   ├── schema.prisma      # 数据模型（13张表）
│   └── seed.ts            # 演示数据（50+条）
├── src/
│   ├── config/            # 配置管理
│   ├── lib/               # 基础库（Prisma、Logger）
│   ├── types/             # TypeScript类型定义
│   ├── middleware/        # 中间件层
│   │   ├── auth.middleware.ts      # JWT认证、角色权限
│   │   ├── idempotency.middleware.ts # 幂等性检查
│   │   ├── audit.middleware.ts     # 审计日志自动记录
│   │   ├── validation.middleware.ts # 参数验证
│   │   └── error.middleware.ts      # 统一错误处理
│   ├── services/          # 业务服务层
│   │   ├── auth.service.ts
│   │   ├── harvest.service.ts
│   │   ├── maintenance.service.ts
│   │   ├── visit.service.ts
│   │   ├── negotiation.service.ts
│   │   ├── dashboard.service.ts
│   │   └── todo.service.ts
│   ├── validations/       # Joi验证Schema
│   ├── routes/            # 路由层
│   ├── app.ts             # Express应用配置
│   └── server.ts          # 服务器入口
├── package.json
├── tsconfig.json
└── .env                   # 环境变量
```

## 数据模型

### 核心数据表（13张）

1. **users** - 用户表（3种角色）
2. **plots** - 地块表
3. **seedling_batches** - 苗木批次表
4. **harvest_records** - 起苗记录表
5. **loading_records** - 装车记录表（含差异备注）
6. **maintenance_records** - 养护记录表
7. **disease_reports** - 病害上报
8. **customer_visits** - 客户回访
9. **reseed_negotiations** - 补苗协商（核心）
10. **negotiation_status_history** - 协商状态历史
11. **todo_items** - 待办事项（自动生成）
12. **audit_logs** - 审计日志（全量留痕）
13. **idempotency_records** - 幂等记录

### 关键设计

- **装车差异**：`discrepancyNote` 字段专门记录装车数量差异，避免扯皮
- **状态历史**：每次协商状态变更独立记录，包含操作人、时间、原因
- **自动待办**：业务操作触发对应角色待办事项，实现多人协作
- **字段变更追踪**：`trackChanges` 工具自动对比前后值，生成变更摘要

## 权限边界说明

### 数据可见性

- **基地负责人**：所有数据可见，可查看审计日志
- **养护员**：仅可见养护、病害、起苗相关数据
- **销售跟单**：仅可见回访、协商相关数据

### 操作权限

- 补苗协商创建后，只有创建者可提交
- 只有基地负责人可审核协商（通过/驳回/要求修改）
- 驳回的协商可重新修改后再次提交
- 所有写操作强制幂等键，防止重复提交

## 常用命令

```bash
# 开发
npm run dev              # 启动开发服务器（热重载）

# 构建
npm run build            # 编译TypeScript
npm start                # 启动生产服务器

# 数据库
npm run init             # 一键初始化（迁移+生成+种子）
npm run prisma:generate  # 生成Prisma客户端
npm run prisma:migrate   # 执行迁移
npm run prisma:seed      # 填充种子数据

# 代码质量
npm run typecheck        # TypeScript类型检查
npm run lint             # ESLint检查
```

## 主场景覆盖

### 场景1：客户索赔扯不清

**问题**：客户说发了100株只收到95株，装车和起苗记录对不上

**解决**：
- 装车记录含 `discrepancyNote` 差异备注字段
- 装车→起苗→批次→地块完整关联链
- 所有操作有审计日志，谁点的数、什么时候装的一目了然

### 场景2：病害上报晚追责

**问题**：病害发现晚了，追责时说不清谁先发现的

**解决**：
- 病害上报记录 `discoveredDate` 发现时间
- 上报人、审核人、处理措施全程留痕
- 未解决病害自动进入仪表盘"需回查"

### 场景3：补苗协商反复

**问题**：补苗协商改来改去，最后不知道谁同意的

**解决**：
- 9种状态完整流转，每次变更记录历史
- 状态历史包含操作人、时间、变更原因
- 基地负责人审核意见永久记录在 `managerNote`

## 日志说明

- **控制台**：彩色输出，开发环境友好
- **文件日志**：`logs/` 目录，按级别分文件
- **审计日志**：数据库持久化，所有变更可追溯
- **错误日志**：自动记录请求ID、用户、堆栈信息

## 生产部署建议

1. 切换数据库为 PostgreSQL
2. 配置环境变量 `NODE_ENV=production`
3. 使用 PM2 或 systemd 管理进程
4. 配置 Nginx 反向代理
5. 定期备份数据库和日志

## License

MIT
