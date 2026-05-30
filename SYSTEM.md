# 城市书房-活动报名与签到核销系统

## 系统概览

这是一个基于 **Express + Prisma + TypeScript + SQLite** 构建的活动管理系统，解决城市书房场景下的活动报名、签到核销、异常处理等核心业务问题。

---

## 架构设计

### 技术选型

| 技术 | 选型 | 说明 |
|-----|------|------|
| 运行时 | Node.js + Express | 轻量、成熟、社区支持好 |
| ORM | Prisma | 类型安全、Schema 驱动、迁移友好 |
| 数据库 | SQLite | 开发阶段快速原型，可无缝迁移到 PostgreSQL |
| 语言 | TypeScript | 类型安全，IDE 支持好 |
| 认证 | JWT | 无状态、水平扩展友好 |
| 验证 | Zod | 运行时类型验证，与 TypeScript 无缝配合 |

### 目录结构

```
src/
├── controllers/      # 控制器层 - 业务逻辑
│   ├── authController.ts
│   ├── activityController.ts
│   ├── registrationController.ts
│   ├── checkInController.ts
│   ├── libraryController.ts
│   ├── logController.ts
│   └── exportController.ts
├── middleware/       # 中间件层
│   ├── auth.ts           # 认证 + 权限
│   ├── idempotent.ts     # 幂等控制
│   └── validate.ts       # 参数验证
├── routes/           # 路由层
│   ├── auth.ts
│   ├── activity.ts
│   ├── registration.ts
│   ├── checkin.ts
│   ├── library.ts
│   ├── log.ts
│   ├── export.ts
│   └── index.ts
├── schemas/          # Zod 验证 Schema
│   ├── auth.ts
│   ├── activity.ts
│   ├── registration.ts
│   ├── checkin.ts
│   └── common.ts
├── services/         # 服务层
│   └── auditLog.ts       # 审计日志
├── lib/              # 基础设施
│   └── prisma.ts         # Prisma Client
├── types/            # TypeScript 类型
│   └── index.ts
├── utils/            # 工具函数
│   └── response.ts       # 统一响应格式
└── index.ts          # 应用入口
```

---

## 核心设计决策与取舍

### ✅ 1. RBAC 权限模型

**设计**: 四级角色权限体系

| 角色 | 能力边界 |
|-----|---------|
| 馆长 | 全权限 + 审计日志查看 |
| 活动运营 | 活动管理、报名审核、补录、导出 |
| 志愿者协调 | 人工签到、标记未到 |
| 志愿者 | 报名、查看活动 |

**取舍**:
- ✅ 简单清晰的角色划分，符合真实协作流程
- ❌ 未实现数据级权限控制（如只能看自己书房的数据）
- 🔄 后续可扩展：增加数据权限、自定义角色

### ✅ 2. 审计日志与证据链

**设计**: 所有关键操作记录完整审计日志

```typescript
{
  module: ACTIVITY | REGISTRATION | CHECK_IN,
  action: CREATE | UPDATE | APPROVE | REJECT | CHECK_IN,
  recordId: "关联记录ID",
  beforeState: { /* 变更前状态 */ },
  afterState: { /* 变更后状态 */ },
  remark: "人工签到备注",
  evidenceData: { /* 图片、视频等证据 */ },
  createdBy: { /* 操作人 */ }
}
```

**取舍**:
- ✅ 状态变更前后都保存，可完整回溯
- ✅ 证据链：人工签到需备注，可上传图片
- ❌ 日志存储在同库，量大后可能影响性能
- 🔄 后续可扩展：日志分库、接入 ELK

### ✅ 3. 幂等控制

**设计**: 基于 `x-idempotency-key` 请求头的幂等机制

```
POST /api/registrations
Headers: x-idempotency-key: uuid-xxx
```

**取舍**:
- ✅ 24小时内重复请求返回相同结果
- ✅ 不强制要求，接口可选使用
- ❌ 基于数据库实现，性能一般（但报名场景足够）
- 🔄 后续可扩展：Redis 缓存幂等记录

### ✅ 4. 报名状态机

**设计**: 明确的状态流转

```
PENDING → APPROVED → CHECKED_IN
   ↓         ↓
REJECTED  CANCELLED
   ↓
 NO_SHOW
```

**取舍**:
- ✅ 每个状态转换都有前置校验（如只有 PENDING 才能驳回）
- ✅ 所有状态变更都记录审计日志
- ❌ 状态机硬编码，未抽成独立引擎
- 🔄 后续可扩展：状态机引擎、状态流转触发通知

### ✅ 5. 异常场景设计

**场景覆盖**:

| 异常场景 | 处理方式 |
|---------|---------|
| 报名被驳回 | 记录 rejectReason + 操作人 + 时间 |
| 现场补录 | 标记 isSupplement + supplementReason |
| 人工签到 | 强制要求 manualRemark，可传 evidenceImage |
| 未到场 | 标记 NO_SHOW，记录 remark |
| 重复报名 | 数据库唯一约束 + 业务层校验 |
| 扫码失败 | 降级到人工签到通道 |

### ✅ 6. 报名与签到分离设计

**设计**: Registration 和 CheckInRecord 是两张独立的表

**原因**:
- 允许没有报名的人现场签到（walk-in）
- 一个活动可能多次签到（如上午+下午）
- 签到记录需要独立的证据链（照片、备注）
- 支持签到后再反向关联报名

**取舍**:
- ✅ 灵活度高，覆盖所有真实场景
- ❌ 数据有一定冗余，关联查询稍复杂
- ✅ 数据一致性通过事务保证

---

## 数据库模型说明

### 核心表关系

```
Library ───< Activity ───< Registration ───< CheckInRecord
   │              │              │
   │              │              └── OperationLog
   │              └── OperationLog
   └── Manager (User)

User (Role-based)
  ├── DIRECTOR (馆长)
  ├── ACTIVITY_OPERATOR (活动运营)
  ├── VOLUNTEER_COORDINATOR (志愿者协调)
  └── VOLUNTEER (志愿者)
```

### 关键约束

| 约束 | 说明 |
|-----|------|
| `activityId_userId` (唯一) | 同一活动不能重复报名 |
| `idempotencyKey` (唯一) | 幂等请求唯一约束 |
| 事务保护 | 报名+更新名额、签到+更新状态都在事务中 |

---

## 已实现功能清单

### ✅ 活动管理
- [x] 活动 CRUD
- [x] 状态流转（草稿 → 发布 → 报名中 → 进行中 → 完成）
- [x] 活动统计（报名数、通过数、签到数、缺勤率）
- [x] 分页 + 多条件筛选（书房、状态、关键词、时间）

### ✅ 报名管理
- [x] 在线报名
- [x] 报名审核（通过/驳回）
- [x] 驳回原因记录
- [x] 取消报名
- [x] 现场补录（带补录原因）
- [x] 幂等请求支持
- [x] 报名详情（含操作历史）

### ✅ 签到核销
- [x] 扫码签到
- [x] 人工签到（强制备注）
- [x] 签到证据（图片上传）
- [x] 标记未到
- [x] 签到记录查询
- [x] 签到详情（含操作历史）

### ✅ 日志系统
- [x] 全链路操作审计
- [x] 状态变更前后快照
- [x] 证据数据存储
- [x] IP + UserAgent 记录
- [x] 按模块/操作/记录筛选

### ✅ 数据导出
- [x] 报名数据导出 CSV
- [x] 签到数据导出 CSV
- [x] 导出操作计入审计日志

### ✅ 系统特性
- [x] JWT 认证
- [x] 基于角色的权限控制
- [x] 请求参数验证（Zod）
- [x] 统一响应格式
- [x] 全局错误处理
- [x] CORS + Helmet 安全防护
- [x] 请求日志（Morgan）

---

## 后续可扩展方向

### 🔄 短期（1-2周）

1. **通知模块**
   - 报名通过/驳回短信通知
   - 活动开始前提醒
   - 签到成功推送
   - 志愿者反馈通知

2. **志愿者反馈模块**
   - 问题提交
   - 处理流程
   - 满意度评价

3. **报表模块**
   - 活动参与率统计
   - 书房活动热力图
   - 月度/季度报表

### 🔄 中期（1-2月）

4. **设备报修系统接入**
   - 借用借阅后台的用户体系
   - 活动现场设备损坏报修
   - 报修单与活动关联

5. **借阅系统集成**
   - 用户借阅记录作为报名资格参考
   - 活动参与可兑换借阅积分

6. **巡馆记录关联**
   - 活动期间巡馆异常关联
   - 活动场地检查记录

### 🔄 长期（3-6月）

7. **数据权限**
   - 多书房数据隔离
   - 按区域/书房分配权限

8. **工作流引擎**
   - 可配置的审批流程
   - 状态流转自动化
   - 超时自动处理

9. **高可用改造**
   - PostgreSQL 替换 SQLite
   - Redis 缓存 + 幂等
   - 消息队列异步处理
   - 容器化部署

10. **数据安全**
    - 手机号脱敏显示
    - 操作行为分析
    - 异常访问告警

---

## 启动指南

### 安装依赖

```bash
npm install
```

### 初始化数据库

```bash
npx prisma generate
npx prisma migrate dev --name init
npm run prisma:seed
```

### 启动开发服务器

```bash
npm run dev
```

### 默认账号

| 用户名 | 密码 | 角色 |
|-------|------|------|
| director | 123456 | 馆长 |
| operator | 123456 | 活动运营 |
| coordinator | 123456 | 志愿者协调 |
| volunteer1 | 123456 | 志愿者 |
| volunteer2 | 123456 | 志愿者 |
| volunteer3 | 123456 | 志愿者 |

### 健康检查

```bash
curl http://localhost:3000/api/health
```

---

## 测试场景速查

### 正常流 🌞

| # | 场景 | 接口 |
|---|------|------|
| 1 | 活动运营创建活动 | `POST /api/activities` |
| 2 | 活动运营开放报名 | `PATCH /api/activities/:id/status` |
| 3 | 志愿者报名活动 | `POST /api/registrations` |
| 4 | 活动运营审核通过 | `POST /api/registrations/:id/approve` |
| 5 | 活动现场扫码签到 | `POST /api/checkins` |
| 6 | 活动结束导出数据 | `GET /api/export/checkins` |

### 问题流 ⚠️

| # | 场景 | 接口 |
|---|------|------|
| 1 | 报名名额已满被驳回 | `POST /api/registrations/:id/reject` |
| 2 | 现场临时来的人补录 | `POST /api/registrations/supplement` |
| 3 | 扫码失败人工签到 | `POST /api/checkins/manual` |
| 4 | 报名了但没来 | `POST /api/checkins/no-show/:id` |
| 5 | 馆长查操作日志 | `GET /api/logs?module=CHECK_IN` |

---

## 总结

这个系统解决了「借阅、活动、设备报修像三个平行世界」的问题：

1. **统一用户体系** - 所有角色在同一用户表，打通身份
2. **完整证据链** - 驳回原因、补录说明、历史备注都有地方放
3. **真实协作流程** - 馆长做判断、活动运营做执行、志愿者协调做复核
4. **异常优先设计** - 人工签到、补录、标记未到等异常场景是一等公民
5. **可追溯可追责** - 全链路审计日志，出问题能查到谁在什么时候做了什么
