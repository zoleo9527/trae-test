# 眼镜连锁 - 售后返修与回访提醒系统

管理验光单、售后返修、镜片调拨、退款记录与回访提醒的全流程系统。

## 技术栈

- **前端**: React 18 + Vite 5 + Ant Design 5 + React Router 6
- **后端**: FastAPI + SQLAlchemy + SQLite
- **数据库**: SQLite（文件存储在 `server/optical_after_sales.db`）

## 项目结构

```
trae-test-5/
├── server/                    # 后端 FastAPI 项目
│   ├── app/
│   │   ├── api/               # API 路由
│   │   │   ├── dashboard.py   # 首页看板
│   │   │   ├── repairs.py     # 售后返修
│   │   │   ├── visits.py      # 回访记录
│   │   │   ├── lens_transfers.py  # 镜片调拨
│   │   │   ├── refunds.py     # 退款记录
│   │   │   └── optometry.py   # 验光单
│   │   ├── database.py        # 数据库配置
│   │   ├── models.py          # 数据模型
│   │   ├── schemas.py         # Pydantic 模式
│   │   ├── crud.py            # 数据库操作
│   │   └── main.py            # FastAPI 入口
│   ├── init_db.py             # 数据库初始化脚本
│   └── requirements.txt       # Python 依赖
├── client/                    # 前端 React 项目
│   ├── src/
│   │   ├── api/               # API 调用
│   │   ├── layouts/           # 布局组件
│   │   ├── pages/             # 页面组件
│   │   ├── styles/            # 样式
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
└── README.md
```

## 快速开始

### 1. 安装依赖

```bash
# 后端
cd server
pip install -r requirements.txt

# 前端
cd ../client
npm install
```

### 2. 初始化数据库

```bash
cd server
python -m init_db
```

首次运行会自动创建数据库表并插入演示数据。

### 3. 启动服务

**后端服务**（默认端口 8000）：

```bash
cd server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

API 文档地址: http://localhost:8000/docs

**前端服务**（默认端口 5173）：

```bash
cd client
npm run dev
```

访问地址: http://localhost:5173

### 4. 演示入口

启动后访问 http://localhost:5173 即可进入系统。

系统演示账号无需登录，可直接操作。

初始化后包含以下演示数据：
- 15 条验光单
- 12 条不同状态的返修单
- 多条镜片调拨、退款、回访记录

## 功能模块

### 首页看板
- 待处理、处理中、已驳回、需回查统计
- 镜片丢失、退款中、待回访计数
- 最近返修单列表
- 待回访提醒列表
- 点击统计卡片可跳转对应模块

### 售后返修
- 返修单列表（支持搜索、状态筛选、日期范围）
- 创建返修单（关联验光单）
- 批量更新状态、处理人
- 返修单详情页：
  - 基本信息展示
  - **状态时间轴**（每次状态变更记录，可回看）
  - 关联镜片调拨记录
  - 关联退款记录
  - 关联回访记录
  - 直接在详情页创建调拨/退款/回访

### 回访提醒
- 回访列表（状态、日期筛选）
- 创建回访计划
- 批量标记已回访/改期
- 回访完成记录（结果、客户反馈、下次回访）

### 镜片调拨
- 调拨记录列表（状态、是否丢失筛选）
- 创建调拨单（关联返修单）
- 更新调拨状态（发货/收货/标记丢失）
- 丢失原因记录

### 退款记录
- 退款列表（状态筛选）
- 新建退款申请
- 审批流程（待审批 → 已审批 → 已退款）
- 驳回功能（带驳回原因）

### 验光单
- 验光单列表（搜索、门店筛选）
- 创建验光单（左右眼度数、瞳距、镜片镜架信息）
- 编辑验光单

## 数据模型

### 核心状态流转

```
待处理 → 处理中 → 待镜片 → 镜片调拨中 → 处理中 → 已完成
                ↘ 镜片丢失 → 需回查
待处理 → 已驳回（带驳回原因）
待处理 → 退款中 → 已退款
```

所有状态变更都会自动记录到 **状态时间轴**，包含：
- 变更前/后状态
- 操作人
- 变更时间
- 变更原因

## 批量操作

- 返修单：批量更新状态、处理人、负责人
- 回访：批量标记已回访、改期

## API 接口

所有接口前缀 `/api`

| 模块 | 方法 | 路径 | 说明 |
|------|------|------|------|
| 看板 | GET | /dashboard/stats | 获取统计数据 |
| 返修 | GET/POST | /repairs | 列表/创建 |
| 返修 | GET/PUT/DELETE | /repairs/{id} | 详情/更新/删除 |
| 返修 | POST | /repairs/{id}/status | 更新状态 |
| 返修 | POST | /repairs/batch-update | 批量更新 |
| 回访 | GET/POST | /visits | 列表/创建 |
| 回访 | POST | /visits/batch-update | 批量更新 |
| 调拨 | GET/POST | /lens-transfers | 列表/创建 |
| 退款 | GET/POST | /refunds | 列表/创建 |
| 验光 | GET/POST | /optometry | 列表/创建 |

详细接口文档访问: http://localhost:8000/docs

## 常见问题

### Q: 如何重置数据库？
删除 `server/optical_after_sales.db` 文件，重新运行 `python -m init_db` 即可。

### Q: 端口被占用怎么办？
修改后端启动参数 `--port` 和前端 `vite.config.js` 中的端口配置。

### Q: 前后端如何联调？
前端已配置代理，`/api` 请求自动转发到 `http://localhost:8000`。
