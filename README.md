# 商用清洁管理系统

## 项目概述

这是一个商用清洁服务管理系统，围绕**客户续约与回访记录**为核心，整合了项目排班、打卡、质检、耗材管理等功能。

### 核心功能模块

1. **工作台 (Dashboard)** - 关键指标概览和待办事项提醒
2. **批量复核面板** - 高频处理场景：漏打卡、整改追踪、耗材审批、续约跟进
3. **项目管理** - 项目列表和详细信息查看
4. **续约回访** - 客户回访记录和续约跟进管理

### 角色设计

| 角色 | 账号 | 密码 | 权限范围 |
|------|------|------|---------|
| 系统管理员 | admin | 123456 | 全部权限 |
| 项目主管 | manager1 | 123456 | 项目管理、复核审批 |
| 排班专员 | scheduler1 | 123456 | 排班管理、打卡复核 |
| 质检员 | inspector1 | 123456 | 质检记录、整改追踪 |
| 清洁员 | cleaner1 | 123456 | 查看个人排班和打卡 |

## 技术栈

- **前端**: React 18 + Vite + Ant Design + Zustand
- **后端**: Node.js + Express
- **数据库**: SQLite (轻量级)
- **状态管理**: Zustand
- **路由**: React Router v6

## 快速启动

### 1. 初始化数据库

```bash
cd backend
npm install
npm run init-db
```

这将创建SQLite数据库并生成演示数据，包括：
- 5个项目
- 30天的排班和打卡记录（包含漏打卡场景）
- 质检记录和整改项
- 耗材库存（包含库存预警）
- 续约回访记录
- 完整的状态变更历史和备注交流

### 2. 启动后端服务

```bash
cd backend
npm start
```

后端服务将在 `http://localhost:4000` 启动

### 3. 启动前端服务

```bash
cd frontend
npm install
npm run dev
```

前端服务将在 `http://localhost:3000` 启动

### 4. 登录系统

打开浏览器访问 `http://localhost:3000`，选择角色后点击登录即可。

## 核心业务流程

### 批量复核面板（高频处理场景）

**漏打卡处理**
- 查看近14天内的漏打卡记录
- 批量选择记录进行确认或驳回
- 添加处理备注
- 查看单条记录的详情、历史变更和备注

**整改追踪**
- 查看所有待整改的质检项
- 支持批量标记整改完成
- 记录整改历史和责任人

**耗材审批**
- 查看待审批的耗材领用申请
- 批量通过或驳回申请
- 记录审批意见

**续约跟进**
- 查看待跟进的续约项目
- 点击详情查看回访记录和客户反馈

### 项目详情页（全链路数据留痕）

每个项目详情页整合了：
- 项目基本信息和合同信息
- 打卡记录（最近20条）
- 质检记录和整改状态
- 耗材库存状态
- 续约回访历史
- 项目状态变更历史（时间线）

## 数据留痕机制

系统对所有关键操作进行完整留痕：

### 1. 状态变更历史 (status_history)
- 记录每次状态变更
- 变更前状态、变更后状态
- 变更人、变更时间
- 变更备注说明

### 2. 备注交流 (comments)
- 支持在打卡、质检、续约等记录上添加备注
- 记录创建人和创建时间
- 支持多人交流讨论

### 3. 操作日志
- 所有批量操作记录处理人
- 所有审批操作记录审批人
- 所有状态变更记录责任人

## 当前边界说明（先做轻的部分）

### 已实现
- ✅ 核心数据模型和关系
- ✅ 批量复核面板（4类核心场景）
- ✅ 项目详情全链路数据展示
- ✅ 状态变更历史记录
- ✅ 备注交流功能
- ✅ 角色切换演示
- ✅ 完整的演示数据

### 后续可扩展
- ⏳ 排班创建和编辑
- ⏳ 打卡图片上传和识别
- ⏳ 实时消息推送
- ⏳ 数据导出Excel
- ⏳ 图表统计分析
- ⏳ 移动端适配
- ⏳ 权限细粒度控制
- ⏳ 邮件/短信提醒

## API接口文档

### 用户相关
- `POST /api/users/login` - 用户登录
- `GET /api/users` - 获取用户列表
- `GET /api/users/by-role/:role` - 按角色获取用户

### 项目相关
- `GET /api/projects` - 获取项目列表
- `GET /api/projects/:id` - 获取项目详情
- `POST /api/projects` - 创建项目
- `PUT /api/projects/:id/status` - 更新项目状态

### 打卡相关
- `GET /api/checkins` - 获取打卡记录
- `GET /api/checkins/missed` - 获取漏打卡记录
- `POST /api/checkins/batch-process` - 批量处理打卡
- `GET /api/checkins/:id/comments` - 获取打卡备注
- `POST /api/checkins/:id/comments` - 添加打卡备注

### 质检相关
- `GET /api/inspections` - 获取质检记录
- `GET /api/inspections/pending-rectification` - 获取待整改项
- `POST /api/inspections/batch-rectification` - 批量处理整改
- `GET /api/inspections/:id/comments` - 获取质检备注
- `POST /api/inspections/:id/comments` - 添加质检备注

### 耗材相关
- `GET /api/supplies` - 获取耗材列表
- `GET /api/supplies/low-stock` - 获取低库存耗材
- `GET /api/supplies/requests` - 获取耗材申请
- `POST /api/supplies/requests/batch-process` - 批量审批
- `POST /api/supplies/requests` - 创建耗材申请

### 续约相关
- `GET /api/renewals` - 获取回访记录
- `GET /api/renewals/pending-followup` - 获取待跟进回访
- `POST /api/renewals` - 创建回访记录
- `PUT /api/renewals/:id/status` - 更新回访状态
- `GET /api/renewals/:id/comments` - 获取回访备注
- `POST /api/renewals/:id/comments` - 添加回访备注

### 通知相关
- `GET /api/notifications` - 获取通知列表
- `GET /api/notifications/unread-count` - 获取未读数量
- `PUT /api/notifications/:id/read` - 标记已读
- `GET /api/notifications/overview` - 获取概览数据

### 状态历史
- `GET /api/status-history` - 获取状态变更历史

## 目录结构

```
.
├── backend/                 # 后端服务
│   ├── config/             # 配置文件
│   │   └── db.js           # 数据库连接
│   ├── data/               # 数据库文件目录
│   ├── routes/             # API路由
│   │   ├── users.js
│   │   ├── projects.js
│   │   ├── checkins.js
│   │   ├── inspections.js
│   │   ├── supplies.js
│   │   ├── renewals.js
│   │   ├── notifications.js
│   │   └── statusHistory.js
│   ├── scripts/            # 脚本
│   │   └── init-db.js      # 数据库初始化
│   ├── server.js           # 服务入口
│   └── package.json
├── frontend/               # 前端应用
│   ├── src/
│   │   ├── components/     # 公共组件
│   │   ├── pages/          # 页面组件
│   │   │   ├── Login.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── ReviewPanel.jsx
│   │   │   ├── Projects.jsx
│   │   │   ├── ProjectDetail.jsx
│   │   │   └── Renewals.jsx
│   │   ├── services/       # API服务
│   │   │   └── api.js
│   │   ├── stores/         # 状态管理
│   │   │   └── useAuthStore.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
└── README.md
```
