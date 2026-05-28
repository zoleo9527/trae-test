# 文创商店-联名上架与下架复盘协作系统

一个基于 **SvelteKit + Go Fiber** 的联名商品全生命周期协作管理平台，解决补货单、门店群和陈列照片零散状态的问题，实现从商品创建→审批→上架→巡店→异常处理→下架→复盘的完整闭环。

## ✨ 核心特性

### 🎯 解决的痛点
- **数据零散**：补货单、调拨单、会员兑换统一管理，告别分散处理
- **协作低效**：按店长、企划专员、仓管角色设计工作流，明确责任边界
- **上下架不同步**：计划时间与实际时间对比，自动检测时效异常
- **库存偏差大**：盘点留痕，偏差超阈值自动生成异常记录
- **巡店无闭环**：陈列检查+库存核对，异常自动分配处理人
- **追责困难**：全链路操作留痕，变更前后对比清晰可查

### 👥 角色权限设计

| 角色 | 权限范围 | 主要职责 |
|------|----------|----------|
| **店长 (manager)** | 全局权限 | 商品审批、订单审批、异常复核、复盘管理 |
| **企划专员 (planner)** | 商品/订单/复盘 | 商品创建、订单查看、复盘总结 |
| **仓管 (warehouse)** | 库存/巡店/异常 | 库存盘点、巡店检查、异常处理、订单发货/签收 |

### 🔄 完整工作流

```
商品创建 → 提交审批 → 审批通过 → 确认上架 → 巡店检查 → (异常闭环) → 确认下架 → 复盘总结
     ↓          ↓          ↓          ↓          ↓             ↓           ↓
    草稿       驳回       已通过      已上架     陈列/库存    分配→处理→复核  已下架
                                                          ↓
                                                      自动生成异常
```

## 🏗️ 技术架构

### 后端 (Go Fiber)
- **框架**: Go Fiber v2.52.0
- **ORM**: GORM
- **数据库**: SQLite
- **认证**: Bearer Token
- **目录结构**:
  ```
  backend/
  ├── cmd/server/main.go          # 服务入口
  ├── internal/
  │   ├── models/                 # 数据模型
  │   ├── database/               # 数据库连接
  │   ├── middleware/             # 认证中间件
  │   ├── handlers/               # API处理器 (8个模块)
  │   └── seed/                   # 种子数据
  └── go.mod
  ```

### 前端 (SvelteKit)
- **框架**: SvelteKit
- **语言**: TypeScript
- **状态管理**: Svelte Writable Stores
- **目录结构**:
  ```
  frontend/
  ├── src/
  │   ├── routes/                 # 页面路由
  │   │   ├── login/              # 登录页
  │   │   ├── products/           # 联名商品 (列表/详情/新建)
  │   │   ├── orders/             # 订单管理 (列表/详情/新建)
  │   │   ├── inventory/          # 库存管理 (列表/详情)
  │   │   ├── inspections/        # 巡店检查 (列表/详情/新建)
  │   │   ├── exceptions/         # 异常中心 (列表)
  │   │   └── reviews/            # 复盘管理 (列表/新建)
  │   ├── lib/
  │   │   ├── components/         # 组件 (AppLayout/ExceptionDrawer等)
  │   │   ├── api/                # API客户端
  │   │   ├── stores/             # 状态管理
  │   │   ├── types/              # TypeScript类型
  │   │   └── utils.ts            # 工具函数
  │   └── app.css                 # 全局样式
  └── package.json
  ```

## 🚀 快速开始

### 前置要求
- Go >= 1.21
- Node.js >= 18
- npm 或 yarn

### 1. 初始化数据库和种子数据

后端启动时会自动初始化数据库并插入种子数据，包含：

**演示账号**:
| 用户名 | 角色 | 密码 |
|--------|------|------|
| `manager` | 店长 | 任意 |
| `planner` | 企划专员 | 任意 |
| `warehouse` | 仓管 | 任意 |

**预置测试数据**:
- 5家门店
- 5个联名商品（不同状态）
- 库存数据（多门店）
- 补货单/调拨单/兑换单
- 巡店检查记录
- 异常记录（含自动生成的库存偏差、时效异常）

### 2. 启动后端服务

```bash
cd backend

# 安装依赖
go mod download

# 启动服务 (端口: 3001)
go run cmd/server/main.go
```

后端API地址: `http://localhost:3001/api`

### 3. 启动前端服务

```bash
cd frontend

# 安装依赖
npm install

# 启动开发服务 (端口: 5173)
npm run dev
```

前端地址: `http://localhost:5173`

### 4. 演示入口

打开浏览器访问 `http://localhost:5173/login`

使用演示账号登录体验不同角色的功能：

| 账号 | 推荐体验流程 |
|------|-------------|
| **manager** | 1. 首页查看待处理/已驳回/需回查<br>2. 审批商品/订单<br>3. 异常复核<br>4. 复盘管理 |
| **planner** | 1. 创建联名商品<br>2. 查看商品详情<br>3. 查看订单/复盘 |
| **warehouse** | 1. 库存盘点<br>2. 巡店检查<br>3. 处理异常<br>4. 订单发货/签收 |

## 📱 页面功能详解

### 🏠 首页 (/)
- **统计卡片**: 待审批、待处理异常、需复核、已驳回、待巡店、在售联名品
- **待处理事项**: 商品审批、订单审批、巡店任务等
- **已驳回列表**: 被驳回的商品和订单
- **需回查列表**: 已解决但需复核的异常
- **异常预警**: 实时异常列表，一键打开异常抽屉处理

### 🎁 联名商品 (/products)
- **商品卡片**: SKU、品牌、分类、状态、价格、计划时间、覆盖门店
- **商品详情**:
  - 基本信息 + 时间线 + 销售数据
  - 订单记录（补货/调拨/兑换快捷入口）
  - 库存情况（盘点入口）
  - 巡店记录（新增巡店入口）
  - 异常记录（一键处理）
  - 操作留痕（完整时间线）
- **操作按钮**: 提交审批、通过/驳回、确认上架、确认下架、开始复盘

### 📋 订单管理 (/orders)
- **三种订单类型**: 补货单、调拨单、会员兑换
- **订单状态**: 草稿→待审批→已批准→已发货→已签收→已完成
- **快捷操作**: 顶部三个类型的快捷创建按钮
- **订单详情**: 基本信息、流转记录、会员信息（兑换单）、操作留痕

### 📦 库存管理 (/inventory)
- **库存列表**: 商品、门店、总库存、预留、可用、上次盘点、偏差
- **盘点操作**: 输入实际数量，自动计算偏差，偏差≠0时高亮提示
- **库存调整**: 店长专属权限，支持增减库存并记录原因

### 🔍 巡店检查 (/inspections)
- **检查项**: 陈列是否正确、陈列位置、预期库存、实际库存、偏差
- **异常自动生成**: 陈列不正确或库存偏差≠0时，系统自动生成异常记录
- **跟进机制**: 可分配跟进人，记录跟进笔记

### ⚠️ 异常中心 (/exceptions)
- **异常类型**: 库存异常、陈列异常、时效异常、订单异常、其他异常
- **严重程度**: 高/中/低
- **状态流转**: 待处理 → 处理中 → 已解决 → 已复核
- **异常抽屉**:
  - 详情页：完整异常信息、关联商品/门店/订单
  - 操作留痕：处理过程完整记录
  - 按角色显示操作按钮（分配/处理/复核/重开）

### 📊 复盘管理 (/reviews)
- **评分维度**: 陈列得分、时效得分、销售得分、综合得分
- **复盘内容**: 问题总结、经验教训、改进建议
- **数据统计**: 总销量、总销售额、剩余库存

## 🎯 常用动作沉淀

页面内置常用操作按钮，无需记忆步骤：

| 页面 | 常用动作 | 位置 |
|------|----------|------|
| 商品详情 | 提交审批、通过、驳回、上架、下架、复盘 | 顶部操作栏 |
| 商品详情-订单 | 创建补货单、发起调拨、会员兑换 | 订单Tab快捷按钮 |
| 商品详情-巡店 | 新增巡店 | 巡店Tab快捷按钮 |
| 订单列表 | 补货单、调拨单、会员兑换 | 顶部快捷按钮 |
| 库存列表 | 盘点 | 每行操作按钮 |
| 巡店列表 | 新增巡店 | 顶部按钮 |
| 异常列表 | 处理 | 每行操作按钮 → 打开抽屉 |

## 🔒 操作留痕与回查

所有关键操作均生成 `OperationLog` 记录，包含：
- 操作类型 (创建/更新/审批/驳回/上架/下架等)
- 操作人及角色
- 操作时间
- 变更前后值对比 (oldValue → newValue)
- 备注说明

在商品详情、订单详情、库存详情等页面均可查看完整操作留痕时间线。

## 🤖 自动异常生成

系统会在以下场景自动创建异常记录：
1. **库存偏差**: 盘点时实际数量与系统数量偏差超过阈值
2. **时效异常**: 实际上架/下架时间晚于计划时间
3. **陈列异常**: 巡店时陈列不正确
4. **巡店异常**: 巡店时库存有偏差

异常记录自动关联相关商品、门店、订单或巡店记录。

## 📡 API 接口

所有接口前缀 `/api`，需在 Header 中携带 `Authorization: Bearer <token>`

| 模块 | 接口 | 权限 |
|------|------|------|
| 认证 | `POST /login` | 公开 |
| | `GET /user` | 登录用户 |
| | `GET /users` | 登录用户 |
| 仪表盘 | `GET /dashboard` | 登录用户 |
| 商品 | `GET/POST /products` | 对应角色 |
| | `GET/PUT /products/:id` | 对应角色 |
| | `POST /products/:id/submit` | planner/manager |
| | `POST /products/:id/approve` | manager |
| | `POST /products/:id/reject` | manager |
| | `POST /products/:id/on-shelf` | warehouse/manager |
| | `POST /products/:id/off-shelf` | warehouse/manager |
| | `POST /products/:id/complete-review` | planner/manager |
| 订单 | `GET/POST /orders` | 对应角色 |
| | `GET /orders/:id` | 对应角色 |
| | `POST /orders/:id/approve` | manager |
| | `POST /orders/:id/reject` | manager |
| | `POST /orders/:id/ship` | warehouse/manager |
| | `POST /orders/:id/receive` | warehouse/manager |
| | `POST /orders/:id/complete` | manager |
| 库存 | `GET /inventory` | warehouse/manager |
| | `GET /inventory/:id` | warehouse/manager |
| | `POST /inventory/:id/stock-count` | warehouse/manager |
| | `POST /inventory/:id/adjust` | manager |
| 巡店 | `GET/POST /inspections` | warehouse/manager |
| | `GET /inspections/:id` | warehouse/manager |
| | `POST /inspections/:id/follow-up` | manager |
| | `POST /inspections/:id/close` | manager |
| 异常 | `GET/POST /exceptions` | 对应角色 |
| | `GET /exceptions/:id` | 对应角色 |
| | `POST /exceptions/:id/assign` | manager |
| | `POST /exceptions/:id/resolve` | warehouse/manager |
| | `POST /exceptions/:id/review` | manager |
| | `POST /exceptions/:id/reopen` | manager |
| | `DELETE /exceptions/:id` | manager |
| 复盘 | `GET/POST /reviews` | planner/manager |
| | `GET /reviews/:id` | planner/manager |

## 🛠️ 开发说明

### 前后端边界
- **后端**: 业务逻辑、数据持久化、权限控制、异常生成
- **前端**: 页面渲染、交互逻辑、状态管理、路由控制
- 所有数据操作通过API完成，前端不直接访问数据库

### 环境变量

后端 `.env` (可选):
```
PORT=3001
DB_PATH=./data.db
```

前端 `vite.config.ts` 已配置代理:
```
/api → http://localhost:3001/api
```

## 📝 注意事项

1. **首次启动**: 后端会自动创建数据库和种子数据，无需手动初始化
2. **数据库文件**: `backend/data.db`，删除即可重置所有数据
3. **Token有效期**: 简单演示模式，token无过期，生产环境需完善
4. **密码登录**: 演示模式无需密码，输入用户名即可登录
5. **异常抽屉**: 在任何页面点击异常的"处理"按钮都会从右侧滑出

## 🔧 常见问题

**Q: 前端启动后无法访问后端API?**
A: 检查后端服务是否启动在3001端口，Vite代理配置是否正确

**Q: 不同角色看到的菜单不一样?**
A: 是的，系统根据角色权限动态显示侧边栏菜单

**Q: 异常记录是怎么产生的?**
A: 大部分异常是系统自动生成的（库存偏差、时效延迟等），也可以手动上报

**Q: 如何重置演示数据?**
A: 删除 `backend/data.db` 文件，重启后端服务即可

---

**项目亮点**:
- ✅ 前后端边界清晰，职责明确
- ✅ 完整的角色权限体系，多人协作流程
- ✅ 异常抽屉交互顺畅，处理体验好
- ✅ 全链路操作留痕，变更可追溯
- ✅ 首页数据聚合，一眼看清待办事项
- ✅ 常用动作按钮化，无需记忆操作步骤
- ✅ 自动异常检测，问题闭环处理
