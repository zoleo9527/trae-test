# 地坪施工-变更报价与签认留痕系统

基于 NestJS + PostgreSQL 构建的完整变更报价、签认留痕、审计追踪解决方案。

## 核心功能

### 1. 变更单管理 (Change Order)
- 完整的状态机工作流：草稿 → 提交 → 审核中 → 批准/驳回 → 执行中 → 完成 → 结算
- 自动版本控制，每次修改都记录历史
- 返工原因、材料去向等关键信息留痕
- 支持关联施工日报、发货回单、签认记录

### 2. 签认留痕 (Sign Off)
- 支持变更单、施工日报、发货回单等多种类型签认
- 签认状态追踪（待签认/已签认/已驳回/已过期）
- 签认人、时间、意见完整记录
- 支持多级签认流程

### 3. 审计追踪 (Audit)
- 所有操作自动记录审计日志
- 支持按实体、用户、时间、操作类型筛选
- 新旧值对比，变更字段自动识别
- 完整的数据回查能力

### 4. 权限控制 (RBAC)
- 7种角色：管理员、项目经理、监理、工头、工人、会计、甲方
- 细粒度权限控制
- 权限可见于数据，不只是注释

### 5. 首页看板
- 待处理事项统计
- 已驳回事项查看
- 需回查事项提醒
- 状态分布统计
- 最近活动追踪
- 个人任务清单

## 技术栈

- **后端框架**: NestJS 10.x
- **数据库**: PostgreSQL 14+
- **ORM**: TypeORM 0.3.x
- **认证**: JWT + Passport
- **API文档**: Swagger/OpenAPI
- **验证**: Class Validator

## 快速开始

### 环境要求

- Node.js 18+
- PostgreSQL 14+
- npm 或 yarn

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制 `.env` 文件并根据实际情况修改：

```bash
cp .env .env.local
```

主要配置项：
```env
NODE_ENV=development
PORT=3000

DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=floor_construction

JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=7d
```

### 3. 创建数据库

在 PostgreSQL 中创建数据库：

```sql
CREATE DATABASE floor_construction;
```

### 4. 初始化数据

```bash
npm run seed
```

初始化后将创建以下演示账号：

| 角色 | 用户名 | 密码 | 说明 |
|------|--------|------|------|
| 管理员 | admin | admin123 | 系统管理员 |
| 项目经理 | pm01 | pm123456 | 项目负责人 |
| 监理 | super01 | super123 | 现场监理 |
| 工头 | foreman01 | foreman123 | 施工队负责人 |
| 工人 | worker01 | worker123 | 施工人员 |
| 会计 | account01 | account123 | 财务人员 |
| 甲方 | client01 | client123 | 甲方代表 |

### 5. 启动服务

开发模式：
```bash
npm run start:dev
```

生产模式：
```bash
npm run build
npm run start:prod
```

### 6. 访问系统

- **服务地址**: http://localhost:3000
- **API文档**: http://localhost:3000/api
- **登录接口**: POST /auth/login

## 核心业务流程

### 变更单工作流

```
草稿 (draft)
  ↓
提交 (submitted)
  ↓
审核中 (under_review)
  ↓    ↘
批准 (approved)  驳回 (rejected)
  ↓                    ↓
执行中 (in_progress)  重新提交
  ↓
完成 (completed)
  ↓
结算 (settled)
```

### 状态转换规则

| 当前状态 | 可转换到 | 角色要求 |
|----------|----------|----------|
| 草稿 | 提交、取消 | 创建人 |
| 提交 | 审核中、驳回 | 项目经理 |
| 审核中 | 批准、驳回、退回 | 项目经理/监理 |
| 批准 | 执行中、取消 | 项目经理 |
| 驳回 | 重新提交、取消 | 创建人 |
| 执行中 | 完成 | 项目经理/监理 |
| 完成 | 结算 | 会计 |

## API 概览

### 认证 (Auth)
- `POST /auth/login` - 用户登录
- `GET /auth/profile` - 获取当前用户信息

### 变更单 (Change Orders)
- `GET /change-orders` - 获取变更单列表
- `GET /change-orders/:id` - 获取变更单详情
- `POST /change-orders` - 创建变更单
- `PATCH /change-orders/:id` - 更新变更单
- `POST /change-orders/:id/transition` - 状态流转
- `GET /change-orders/:id/versions` - 获取版本历史
- `GET /change-orders/pending` - 待处理变更单
- `GET /change-orders/rejected` - 已驳回变更单
- `GET /change-orders/needs-review` - 需回查变更单

### 签认 (Sign Offs)
- `GET /sign-offs` - 获取签认列表
- `POST /sign-offs` - 创建签认请求
- `POST /sign-offs/:id/sign` - 签认通过
- `POST /sign-offs/:id/reject` - 签认驳回
- `GET /sign-offs/pending` - 我待签认
- `GET /sign-offs/my-signed` - 我已签认
- `GET /sign-offs/my-requested` - 我发起的

### 施工日报 (Daily Reports)
- `GET /daily-reports` - 获取日报列表
- `POST /daily-reports` - 创建日报
- `GET /daily-reports/:id` - 获取日报详情
- `PATCH /daily-reports/:id` - 更新日报

### 发货回单 (Deliveries)
- `GET /deliveries` - 获取发货列表
- `POST /deliveries` - 创建发货单
- `POST /deliveries/:id/receive` - 确认收货

### 审计日志 (Audit)
- `GET /audit` - 获取审计日志
- `GET /audit/entity/:type/:id` - 指定实体审计日志
- `GET /audit/entity/:type/:id/history` - 实体变更历史

### 首页看板 (Dashboard)
- `GET /dashboard/overview` - 概览数据
- `GET /dashboard/pending` - 待处理事项
- `GET /dashboard/rejected` - 已驳回事项
- `GET /dashboard/needs-review` - 需回查事项
- `GET /dashboard/statistics` - 状态统计
- `GET /dashboard/recent-activity` - 最近活动
- `GET /dashboard/my-tasks` - 我的任务

## 关键设计要点

### 留痕与回查

1. **版本控制**: 每次变更单修改都会创建一个新版本，包含完整快照和变更对比
2. **审计日志**: 所有创建、更新、删除、状态变更、签认操作自动记录
3. **字段级追踪**: 自动识别变更字段，记录新旧值
4. **关联查询**: 变更单可关联查看所有施工日报、发货回单、签认记录

### 权限设计

权限不是写在注释里，而是体现在：
- 接口级别的角色守卫
- 数据级别的创建人校验
- 审计日志中记录操作人角色

### 错误处理

- 状态转换验证：非法转换直接抛出错误
- 权限验证：无权限接口返回 403
- 参数验证：使用 Class Validator 自动验证
- 统一响应格式：错误信息清晰可追溯

## 项目结构

```
src/
├── app.module.ts          # 主模块
├── main.ts               # 入口文件
├── seed.ts               # 数据初始化脚本
├── auth/                 # 认证模块
├── user/                 # 用户模块
├── change-order/         # 变更单模块
│   ├── entities/
│   │   ├── change-order.entity.ts
│   │   └── change-order-version.entity.ts
│   ├── change-order.service.ts
│   └── change-order.controller.ts
├── daily-report/         # 施工日报模块
├── delivery/             # 发货回单模块
├── sign-off/             # 签认模块
├── audit/                # 审计模块
├── dashboard/            # 首页看板模块
└── common/
    ├── decorators/       # 装饰器
    ├── enums/           # 枚举定义
    ├── entities/        # 基础实体
    └── guards/          # 守卫
```

## 常见问题

### 如何重置数据库？

```sql
DROP DATABASE floor_construction;
CREATE DATABASE floor_construction;
```

然后重新运行：
```bash
npm run seed
```

### 如何查看数据库中的审计日志？

```sql
SELECT * FROM audit_logs 
ORDER BY created_at DESC 
LIMIT 100;
```

### 如何添加新角色？

在 `src/common/enums/role.enum.ts` 中添加新角色和对应权限。

## License

MIT
