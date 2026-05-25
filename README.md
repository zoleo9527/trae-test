# 地方剧院-演职接待与费用结算系统

一个基于 Nuxt 3 + FastAPI 的剧院管理系统，整合演出排期、演职接待、费用结算等业务流程。

## 功能特性

- 🎭 **演出场次管理** - 管理所有演出排期，支持新增、编辑、删除
- 📋 **演职接待管理** - 管理演职人员接待安排（酒店、房间、用餐、交通）
- 💰 **费用结算管理** - 管理演出费用结算，支持审批流程
- 📊 **仪表盘** - 首页展示待处理事项、统计数据、近期变更
- ⏱️ **状态时间轴** - 记录所有状态变更历史，可追溯审查
- ✅ **审批流程** - 接待和结算均有完整的状态流转和审批记录

## 技术栈

### 前端
- Nuxt 3 (Vue 3)
- TypeScript
- Tailwind CSS
- @nuxt/ui

### 后端
- FastAPI
- SQLAlchemy
- SQLite
- Pydantic

## 快速开始

### 环境要求

- Python 3.8+
- Node.js 18+
- npm 或 yarn

### 项目结构

```
trae-test-2/
├── backend/                 # 后端 FastAPI 项目
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py         # 主应用入口
│   │   ├── database.py     # 数据库配置
│   │   ├── models.py       # 数据模型
│   │   ├── schemas.py      # Pydantic 模式
│   │   └── crud.py         # CRUD 操作
│   ├── requirements.txt
│   └── init_db.py
├── frontend/               # 前端 Nuxt 3 项目
│   ├── pages/
│   │   ├── index.vue       # 仪表盘首页
│   │   ├── performances.vue # 演出场次
│   │   ├── receptions.vue  # 演职接待
│   │   ├── settlements.vue # 费用结算
│   │   └── timeline.vue    # 状态时间轴
│   ├── composables/
│   │   └── useApi.ts       # API 调用封装
│   ├── assets/
│   │   └── css/
│   │       └── main.css    # 全局样式
│   ├── app.vue
│   ├── nuxt.config.ts
│   └── package.json
└── README.md
```

### 后端启动

1. 进入后端目录并安装依赖：

```bash
cd backend
pip install -r requirements.txt
```

2. 启动后端服务：

```bash
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

后端服务将运行在: http://localhost:8000

3. 初始化示例数据（可选）：

访问 http://localhost:8000/api/init-sample-data 或使用 curl：

```bash
curl -X POST http://localhost:8000/api/init-sample-data
```

4. API 文档：

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

### 前端启动

1. 进入前端目录并安装依赖：

```bash
cd frontend
npm install
```

2. 启动前端开发服务器：

```bash
npm run dev
```

前端服务将运行在: http://localhost:3000

## 演示入口

| 页面 | 地址 | 说明 |
|------|------|------|
| 仪表盘首页 | http://localhost:3000 | 待处理事项、已驳回、需回查数据概览 |
| 演出场次管理 | http://localhost:3000/performances | 演出排期管理（新建时自动创建接待和结算记录） |
| 演职接待管理 | http://localhost:3000/receptions | 接待安排与状态流转 |
| 费用结算管理 | http://localhost:3000/settlements | 费用结算与审批 |
| 票务团单管理 | http://localhost:3000/tickets | 票务订单及退改审批 |
| 状态时间轴 | http://localhost:3000/timeline | 所有状态变更历史记录（场次、接待、结算、票务） |
| 后端 API 文档 | http://localhost:8000/docs | Swagger API 文档 |

## 初始化方式

### 首次运行

1. 启动后端服务（自动创建数据库）
2. 调用初始化接口生成示例数据：

```bash
curl -X POST http://localhost:8000/api/init-sample-data
```

3. 启动前端服务
4. 访问 http://localhost:3000 开始使用

### 数据库重置

删除 `backend/theater.db` 文件，重启后端服务即可重新创建数据库。

## 业务流程

### 演职接待流程

1. 创建演出场次时自动创建接待记录
2. 编辑接待信息（酒店、房间数等）
3. 提交审核（状态：pending → reviewing）
4. 确认完成（状态：reviewing → completed）

### 费用结算流程

1. 创建结算单，填写各项费用
2. 提交审核（状态：pending → reviewing）
3. 审批通过（状态：reviewing → approved）或驳回（reviewing → rejected）
4. 所有状态变更均记录到时间轴

### 票务退改流程

1. 创建票务订单（状态：confirmed）
2. 申请退票（状态：confirmed → refund_pending）
3. 审批通过（状态：refund_pending → refunded）或驳回（refund_pending → confirmed）
4. 退票通过后自动回退演出已售票数
5. 每步操作均记录到时间轴

### 状态时间轴

- 所有模块的状态变更都会自动写入时间轴
- 包括：演出场次变更、接待状态变更、结算状态变更、票务退改审批
- 可按演出筛选查看完整历史

## 开发说明

### 后端开发

- 数据库模型：`backend/app/models.py`
- API 路由：`backend/app/main.py`
- 业务逻辑：`backend/app/crud.py`

### 前端开发

- 页面文件：`frontend/pages/`
- API 封装：`frontend/composables/useApi.ts`
- 样式文件：`frontend/assets/css/main.css`

## 注意事项

- 本项目使用 SQLite 数据库，适合开发和小型部署
- 生产环境建议使用 PostgreSQL 或 MySQL
- 默认未做用户认证，实际使用时需添加
- API 已配置 CORS 允许跨域访问
