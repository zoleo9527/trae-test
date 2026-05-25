# 美术馆运营系统

一个完整的美术馆运营管理系统，涵盖志愿者排班、观众反馈、展品流转、活动核销等完整业务链。

## 技术栈

- **前端**: React 18 + Vite + React Router + Tailwind CSS
- **后端**: FastAPI + SQLAlchemy + SQLite
- **图标**: Lucide React

## 功能特性

### 1. 仪表盘 (Dashboard)
- 待处理、已驳回、需回查数据概览
- 实时统计卡片展示
- 待处理事项列表

### 2. 志愿者排班管理
- 排班创建与管理
- 排班状态流转（待确认 → 已确认 → 已完成）
- 志愿者信息关联

### 3. 观众反馈处理
- 反馈类型分类（投诉、建议、表扬、咨询）
- 反馈状态流转（待处理 → 处理中 → 已解决/已驳回）
- 处理回复功能
- 回查标记与追踪

### 4. 连续回查面板
- 需回查事项集中展示
- 搜索与筛选功能
- 回查记录追踪

### 5. 展品流转管理
- 展品台账管理
- 展品流转申请
- 流转确认机制
- 展品状态追踪

### 6. 活动核销
- 活动创建与管理
- 门票生成
- 门票核销/驳回

## 快速开始

### 环境要求

- Python 3.8+
- Node.js 16+
- npm 或 yarn

### 后端启动

1. 进入后端目录并安装依赖

```bash
cd backend
pip install -r requirements.txt
```

2. 初始化数据库（可选，会自动创建表）

```bash
python init_data.py
```

> 此步骤会创建示例数据，方便立即体验系统功能。

3. 启动后端服务

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

后端服务将运行在 `http://localhost:8000`

API 文档地址: `http://localhost:8000/docs`

### 前端启动

1. 进入前端目录并安装依赖

```bash
cd frontend
npm install
```

2. 启动开发服务器

```bash
npm run dev
```

前端服务将运行在 `http://localhost:3000`

## 项目结构

```
.
├── backend/                 # 后端代码
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py         # FastAPI 主入口
│   │   ├── models.py       # SQLAlchemy 数据模型
│   │   ├── schemas.py      # Pydantic 数据验证
│   │   ├── crud.py         # 数据库操作
│   │   └── database.py     # 数据库配置
│   ├── init_data.py        # 数据初始化脚本
│   └── requirements.txt    # Python 依赖
├── frontend/               # 前端代码
│   ├── src/
│   │   ├── components/     # 通用组件
│   │   ├── pages/          # 页面组件
│   │   ├── utils/          # 工具函数
│   │   ├── App.jsx         # 应用主组件
│   │   └── main.jsx        # 入口文件
│   ├── package.json        # Node.js 依赖
│   ├── vite.config.js      # Vite 配置
│   └── tailwind.config.js  # Tailwind CSS 配置
└── README.md
```

## 演示入口

| 模块 | 地址 | 说明 |
|------|------|------|
| 系统首页 | http://localhost:3000 | 仪表盘 |
| 志愿者排班 | http://localhost:3000/schedules | 排班管理 |
| 观众反馈 | http://localhost:3000/feedbacks | 反馈列表 |
| 展品流转 | http://localhost:3000/exhibits | 展品管理 |
| 活动核销 | http://localhost:3000/activities | 活动与门票 |
| 回查面板 | http://localhost:3000/review | 需回查事项 |
| API 文档 | http://localhost:8000/docs | Swagger UI |

## 初始化方式说明

### 方式一：使用初始化脚本（推荐）

```bash
cd backend
python init_data.py
```

此脚本会自动创建：
- 4 名志愿者 + 1 名管理员
- 12 条排班记录
- 5 件展品 + 1 条待确认流转
- 3 个活动 + 15 张门票
- 6 条观众反馈（包含待处理、已解决、需回查等状态）

### 方式二：自动创建空数据库

首次启动后端服务时，系统会自动创建空的 SQLite 数据库文件 `art_museum.db`。可以通过 API 接口手动创建数据。

## 业务流程说明

### 志愿者排班流程
1. 创建志愿者账号
2. 为志愿者创建排班
3. 确认排班
4. 签到/完成排班

### 观众反馈处理流程
1. 录入观众反馈
2. 标记为处理中
3. 提交处理回复
4. 标记为已解决/已驳回
5. （可选）标记为需回查

### 展品流转流程
1. 创建展品台账
2. 发起流转申请
3. 确认流转完成
4. 展品状态自动更新

### 活动核销流程
1. 创建活动
2. 生成门票
3. 核销/驳回门票

## 开发说明

- 后端使用热重载模式开发，代码变更自动生效
- 前端使用 Vite 开发服务器，支持 HMR
- 数据库使用 SQLite，无需额外安装数据库服务

## 注意事项

- 本系统使用 SQLite 作为数据库，适合开发和小型部署
- 生产环境建议改用 PostgreSQL 或 MySQL
- 当前版本未实现用户认证功能，生产环境需添加
