# 珠宝门店售后返修与会员回访系统

一套专为珠宝门店设计的售后返修工单管理系统，解决高值货品交接留痕、改款口径一致、赔付责任追溯等核心痛点。

## 核心特性

### 🔍 留痕与回查（核心）
- **完整状态流转记录**：每一次状态变更都记录操作人、时间、原因和数据快照
- **审计日志系统**：所有操作自动记录，支持按记录和操作人维度追溯
- **货品交接留痕**：接收、返还全流程记录，支持图片上传
- **修改前后对比**：自动记录字段变更历史

### 🔄 状态机管理
- **工单状态机**：草稿 → 待审核 → 已审核 → 处理中 → 待确认 → 已完成
- **返修状态机**：待处理 → 处理中 → 待报价 → 报价确认 → 完成
- **角色权限控制**：不同角色只能执行对应状态流转

### 👥 角色与权限
- **管理员(admin)**：全功能权限
- **门店经理(manager)**：审批、复核权限
- **销售员(sales)**：创建工单、确认完成
- **工坊师傅(workshop)**：处理返修、更新进度
- **客服专员(cs)**：会员回访

### 📊 数据可视化
- **首页仪表盘**：待审核、处理中、需复核、已驳回一目了然
- **工单管理**：按状态、类型筛选，支持搜索和分页
- **回访管理**：自动关联工单，自动生成回访任务
- **会员管理**：完整会员画像，关联工单和回访历史

## 技术栈

| 层级 | 技术 |
|------|------|
| 后端 | NestJS + TypeScript |
| 前端 | React + TypeScript + Ant Design |
| 数据库 | PostgreSQL + TypeORM |
| 认证 | JWT + Passport |
| 部署 | Docker (可选) |

## 项目结构

```
.
├── backend/                 # 后端服务
│   ├── src/
│   │   ├── database/       # 数据库层
│   │   │   ├── entities/   # 数据模型
│   │   │   └── scripts/  # 初始化脚本
│   │   ├── common/         # 公共模块
│   │   │   ├── state-machine/  # 状态机
│   │   │   ├── audit/      # 审计服务
│   │   │   └── auth/       # 认证授权
│   │   └── modules/        # 业务模块
│   │       ├── auth/
│   │       ├── work-order/
│   │       ├── follow-up/
│   │       └── member/
├── frontend/               # 前端应用
│   └── src/
│       ├── pages/          # 页面组件
│       ├── components/     # 公共组件
│       ├── services/   # API 服务
│       └── contexts/     # 上下文
├── docker-compose.yml      # PostgreSQL 服务
└── README.md
```

## 快速开始

### 前置要求

- Node.js >= 18
- PostgreSQL >= 14 (或使用 Docker)
- npm 或 yarn

### 方式一：使用 Docker 启动数据库

```bash
# 启动 PostgreSQL
docker-compose up -d
```

### 方式二：使用本地 PostgreSQL

创建数据库：
```sql
CREATE DATABASE jewelry_aftersales;
CREATE USER jewelry WITH PASSWORD 'jewelry123';
GRANT ALL PRIVILEGES ON DATABASE jewelry_aftersales TO jewelry;
```

### 安装依赖

```bash
# 安装所有依赖
npm run install:all

# 或分别安装
cd backend && npm install
cd ../frontend && npm install
```

### 初始化数据库

```bash
cd backend

# 初始化数据库表结构
npm run db:init

# 导入种子数据（默认用户和示例会员）
npm run db:seed
```

### 启动服务

```bash
# 启动后端 (端口 3001)
cd backend && npm run start:dev

# 启动前端 (端口 3000)
cd frontend && npm run dev
```

### 访问地址

- **前端演示地址**: http://localhost:3000
- **后端 API 地址**: http://localhost:3001/api

### 默认账号

| 用户名 | 密码 | 角色 | 说明 |
|--------|------|------|------|
| admin | 123456 | 管理员 | 全功能权限 |
| manager | 123456 | 门店经理 | 审批、复核 |
| sales | 123456 | 销售员 | 创建工单、确认完成 |
| workshop | 123456 | 工坊师傅 | 处理返修 |
| cs | 123456 | 客服专员 | 会员回访 |

## 核心数据模型

### 工单 (WorkOrder)
- 支持多种类型：返修、定制、调货、退货、换货、清洗保养
- 优先级：低、普通、高、紧急
- 完整状态流转，自动记录状态历史

### 货品交接 (WorkOrderItem)
- 接收状态：待接收、已接收、已返还、已发货
- 前后状态描述和图片留痕
- 记录接收人、接收时间

### 返修记录 (Repair)
- 返修类型：抛光、焊接、改圈、换石、链条修复等
- 分步记录：每一步骤记录操作人和时间
- 费用明细：配件费、工费分开记录

### 会员回访 (FollowUp)
- 回访类型：售后回访、返修完成、生日祝福、会员关怀
- 回访渠道：电话、微信、短信、上门
- 自动关联工单，支持批量创建

### 审计日志 (AuditLog)
- 记录所有创建、更新、删除、状态变更操作
- 记录旧值和新值对比
- 支持按模块、记录ID、操作人查询

## API 接口

### 认证接口
- `POST /api/auth/login` - 登录
- `GET /api/auth/profile` - 获取当前用户信息

### 工单接口
- `GET /api/work-orders` - 工单列表
- `GET /api/work-orders/dashboard/stats` - 仪表盘统计
- `GET /api/work-orders/:id` - 工单详情
- `POST /api/work-orders` - 创建工单
- `PUT /api/work-orders/:id` - 更新工单
- `PUT /api/work-orders/:id/status` - 变更状态
- `GET /api/work-orders/:id/histories` - 状态历史

### 回访接口
- `GET /api/follow-ups` - 回访列表
- `POST /api/follow-ups` - 创建回访
- `PUT /api/follow-ups/:id/complete` - 完成回访

### 会员接口
- `GET /api/members` - 会员列表
- `GET /api/members/:id` - 会员详情
- `POST /api/members` - 新增会员
- `PUT /api/members/:id` - 更新会员

## 核心流程示例

### 售后返修流程

1. **销售员** 创建返修工单，录入货品信息和问题描述
2. **门店经理** 审核工单
3. **工坊师傅** 接收货品，开始处理
4. 处理完成后提交确认
5. **销售员** 联系客户确认取货
6. 系统**自动创建**回访任务
7. **客服** 完成回访记录

### 留痕说明

每一步操作都会：
- 记录操作人、操作时间
- 记录变更前后的数据对比
- 生成状态历史记录
- 写入审计日志

## 常见问题

### 如何查看操作历史？
在工单详情页底部有完整的状态变更时间线，显示每一次状态变更的操作人、时间和原因。

### 如何追溯货品交接？
工单明细中记录了货品的接收和返还状态，包括操作人和时间。

### 赔付责任如何界定？
通过审计日志和状态历史，可以准确追溯每一次修改的责任人。

## 开发说明

### 数据库表结构会自动创建吗？
是的，TypeORM 配置了 `synchronize: true`，启动时会自动创建表结构。生产环境建议关闭此选项。

### 如何添加新的状态流转？
修改 `backend/src/common/state-machine/` 目录下对应的状态机配置文件。

### 如何扩展角色权限？
修改 `backend/src/common/auth/roles.guard.ts` 和状态机中的 `allowedRoles` 配置。

## License

MIT
