# 农机合作社 - 补贴申报与资料回收系统

面向合作社理事、调度员、机手的多人协作作业管理平台。一线处理与管理回看基于同一套数据，解决电话预约、作业表、油料本碎片化记录导致的复盘追责难题。

## 技术栈

- **前端**: SvelteKit 2.0 + TypeScript + Vite
- **后端**: Node.js + Express + SQLite (better-sqlite3)
- **设计原则**: 前后端边界清晰，数据与逻辑集中在 API 层

## 项目结构

```
trae-test-5/
├── api/                    # 后端 API
│   ├── server.js          # Express 服务入口
│   ├── db.js              # 数据库连接与迁移
│   ├── seed.js            # 测试数据初始化
│   └── package.json
└── web/                    # 前端 SvelteKit
    ├── src/
    │   ├── routes/        # 页面路由
    │   │   ├── +page.svelte          # 首页仪表盘
    │   │   ├── +layout.svelte        # 全局布局
    │   │   ├── review-board/         # 连续回查面板
    │   │   ├── subsidies/            # 补贴申报列表 + 详情
    │   │   └── fuels/                # 油料记录
    │   └── lib/api.ts    # API 客户端
    └── package.json
```

## 本地启动

### 前置要求

- Node.js >= 18
- npm

### 步骤 1: 启动后端 API

```bash
cd api
npm install
npm start
```

- **服务地址**: http://localhost:4000
- 首次启动会自动创建 `coop.db` 并执行 seed 初始化测试数据

### 步骤 2: 启动前端 Web

新开一个终端：

```bash
cd web
npm install
npm run dev
```

- **访问地址**: http://localhost:5173
- 前端通过 Vite 代理 `/api` 请求到后端 4000 端口

## 演示入口与初始化账号

系统预置了 5 个测试用户，无需密码，可直接通过 Token 访问（前端默认使用调度员账号）：

| 用户名     | 角色   | 姓名   | 默认 Token  |
|------------|--------|--------|-------------|
| director   | 理事   | 王理事 | dir-token   |
| dispatcher | 调度员 | 李调度 | dis-token   |
| op1        | 机手   | 张机手 | op1-token   |
| op2        | 机手   | 刘机手 | op2-token   |
| op3        | 机手   | 赵机手 | op3-token   |

### 快速开始

1. 访问 http://localhost:5173
2. 首页直接看到 **待处理**、**已驳回**、**需回查** 三类核心数据
3. 点击「连续回查面板」集中查看所有申报的进度、材料、问题标记
4. 进入补贴申报详情可：
   - 提交作业进度报告
   - 标记补贴材料已收集
   - 添加/解决回查标记
   - 记录油料消耗

## 数据初始化

### 自动初始化

首次启动 `npm start` 时，如果 `api/coop.db` 不存在，会自动执行 seed 脚本，预置：
- 5 个用户（3 角色）
- 5 条补贴申报（覆盖 submitted/scheduled/in_progress/completed/rejected 全状态）
- 2 条作业进度报告
- 2 条油料记录
- 3 条回查标记（材料缺失、进度延迟、维修提醒）
- 20 条补贴材料记录（每申报 4 类）
- 预置会话 Token

### 手动重置

如需清空并重新初始化数据：

```bash
cd api
rm coop.db coop.db-wal coop.db-shm
npm start   # 启动时自动重建
```

或直接执行：

```bash
cd api
node seed.js
```

## 核心功能说明

### 1. 首页仪表盘 (`/`)

- **统计卡片**: 待处理 / 进行中 / 已驳回 / 需回查 / 已完成
- **待处理列表**: submitted + scheduled 状态的申报
- **已驳回列表**: rejected 状态，显示驳回原因
- **需回查事项**: 所有 open 状态的 review_flags，按严重程度排序

### 2. 连续回查面板 (`/review-board`)

集中式回查工作台，支持展开查看单条申报的完整上下文：
- 作业进度报告
- 油料消耗记录
- 补贴材料收集状态
- 待解决回查标记
- 异常高亮（进度延迟 / 材料不齐 / 有待处理标记）

### 3. 补贴申报 (`/subsidies`)

- 列表展示所有申报，按状态着色
- 新建申报表单
- 详情页支持全链路操作

### 4. 油料记录 (`/fuels`)

- 通用加油记录登记
- 支持关联到具体补贴申报
- 记录车辆、油量、金额、操作人

## 角色权限

| 操作               | 理事 | 调度员 | 机手 |
|--------------------|------|--------|------|
| 查看仪表盘         | ✅   | ✅     | ✅   |
| 新建补贴申报       | ✅   | ✅     | ✅   |
| 排期分配           | ✅   | ✅     | ❌   |
| 驳回申报           | ✅   | ✅     | ❌   |
| 提交进度报告       | ✅   | ✅     | ✅   |
| 标记材料收集       | ✅   | ✅     | ✅   |
| 添加/解决回查标记  | ✅   | ✅     | ✅   |
| 记录油料           | ✅   | ✅     | ✅   |

## API 接口

所有接口需在 Header 携带 `x-session-token`。

| 方法 | 路径 | 说明 |
|------|------|------|
| GET  | /api/me | 当前用户 |
| POST | /api/login | 登录 |
| GET  | /api/dashboard | 仪表盘数据 |
| GET  | /api/review-board | 回查面板数据 |
| GET  | /api/subsidies | 申报列表 |
| GET  | /api/subsidies/:id | 申报详情 |
| POST | /api/subsidies | 新建申报 |
| POST | /api/subsidies/:id/schedule | 排期 |
| POST | /api/subsidies/:id/reject | 驳回 |
| POST | /api/subsidies/:id/resubmit | 重新提交 |
| POST | /api/subsidies/:id/report | 提交进度 |
| POST | /api/materials/:id/collect | 标记材料已收 |
| GET  | /api/fuels | 油料列表 |
| POST | /api/fuels | 新增油料 |
| POST | /api/flags | 新增回查标记 |
| POST | /api/flags/:id/resolve | 解决标记 |
