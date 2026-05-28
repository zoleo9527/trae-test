# 🏕️ 游学营地管理系统

## 项目简介

专为游学营地设计的**多人协作管理平台**，实现从营员信息登记、活动考勤、医疗上报到家长回访的全流程闭环管理。系统按**营地主任**、**班务老师**、**后勤协调**三个角色的工作节奏设计，通过双栏详情台实现列表、详情、处理动作的无缝衔接。

---

## ✨ 核心特性

### 👥 多人协作角色设计
- **营地主任 (director)**：全局管控，审批考勤、查看所有数据、分配任务
- **班务老师 (teacher)**：日常考勤、医疗上报、家长回访
- **后勤协调 (logistics)**：分房管理、物资补给、医疗处理

### 📊 首页工作看板
一进来就能看见：
- **待处理**：待审批考勤、待处理医疗、待处理物资、待处理回访
- **已驳回**：已驳回的考勤记录
- **需回查**：进行中的医疗记录
- **营员总数**、**活跃营员**、**今日出勤率**等关键指标

### 📋 业务流程闭环
```
营员登记 → 活动签到 → 医疗上报 → 物资申请 → 家长回访
     ↓         ↓          ↓          ↓          ↓
   分房     主任审批   后勤处理    后勤发放    回复完成
```

### 🖥️ 双栏详情台
所有业务页面采用左侧列表 + 右侧详情的双栏布局：
- 点击左侧列表项，右侧即时显示详情
- 操作按钮直接展示在详情页，无需多层跳转
- 时间线完整记录营员所有活动轨迹

---

## 🛠️ 技术栈

### 后端
- **Go 1.21** + **Fiber v2** - 高性能Web框架
- **GORM** + **SQLite** - 数据库ORM与存储
- **JWT** - 身份认证
- **bcrypt** - 密码加密

### 前端
- **SvelteKit 2** + **TypeScript** - 前端框架
- **Tailwind CSS** (CDN) - UI样式
- **Vite** - 构建工具

---

## 🚀 快速开始

### 方式一：一键启动（推荐）

```bash
# 进入项目根目录
cd /path/to/trae-test-1

# 一键启动前后端
./start.sh
```

### 方式二：手动启动

#### 1. 启动后端

```bash
cd backend

# 编译（首次需要）
go build -o camp-server ./cmd/main.go

# 启动服务
./camp-server
```

后端运行在 http://localhost:3001

#### 2. 启动前端

```bash
cd frontend

# 安装依赖（首次需要）
npm install

# 启动开发服务器
npm run dev
```

前端运行在 http://localhost:5173 （或5174端口）

---

## 🔑 演示入口

访问 http://localhost:5173 ，使用以下测试账号登录：

| 用户名      | 密码         | 角色         | 权限范围                     |
|-------------|--------------|--------------|------------------------------|
| `director1` | `password123` | 营地主任     | 全部功能 + 审批权限          |
| `teacher1`  | `password123` | 班务老师     | 考勤、医疗、回访录入         |
| `logistics1`| `password123` | 后勤协调     | 分房、物资、医疗处理         |

---

## 📦 初始化方式

### 自动初始化
系统首次启动时会自动：
1. 创建 SQLite 数据库文件 `backend/camp.db`
2. 执行数据库表结构迁移
3. 插入种子数据（3个用户、6个房间、12个营员、若干业务记录）

### 重置数据库
如需清空数据重新初始化：

```bash
./reset-db.sh
```

这将删除 `backend/camp.db`，下次启动时会自动重新初始化。

### 手动初始化配置

后端环境变量配置文件：`backend/.env`

```env
PORT=3001
JWT_SECRET=camp-secret-key-change-in-production
DB_PATH=./camp.db
```

---

## 📁 项目结构

```
trae-test-1/
├── backend/                    # Go Fiber 后端
│   ├── cmd/
│   │   └── main.go            # 应用入口
│   ├── internal/
│   │   ├── config/            # 配置加载
│   │   ├── handlers/          # API处理器
│   │   │   ├── auth.go        # 认证接口
│   │   │   ├── camper.go      # 营员管理
│   │   │   ├── attendance.go  # 考勤管理
│   │   │   ├── medical.go     # 医疗管理
│   │   │   ├── room.go        # 分房管理
│   │   │   ├── supply.go      # 物资管理
│   │   │   ├── feedback.go    # 回访管理
│   │   │   └── dashboard.go   # 看板数据
│   │   ├── middleware/        # 中间件（认证、角色权限）
│   │   ├── models/            # 数据模型
│   │   └── seed/              # 种子数据
│   ├── pkg/
│   │   └── database/          # 数据库初始化
│   ├── .env                   # 环境变量
│   ├── go.mod
│   └── camp-server            # 编译后的可执行文件
│
├── frontend/                   # SvelteKit 前端
│   ├── src/
│   │   ├── lib/
│   │   │   ├── api/
│   │   │   │   └── client.ts  # API客户端（所有接口封装）
│   │   │   ├── components/    # 通用组件
│   │   │   │   ├── Sidebar.svelte
│   │   │   │   ├── DualPanel.svelte    # 双栏布局
│   │   │   │   ├── StatusBadge.svelte
│   │   │   │   └── Timeline.svelte     # 时间线
│   │   │   └── stores/
│   │   │       └── auth.ts    # 认证状态管理
│   │   └── routes/             # 页面路由
│   │       ├── +page.svelte   # 登录页
│   │       ├── +layout.svelte # 主布局
│   │       ├── dashboard/     # 首页看板
│   │       ├── campers/       # 营员管理
│   │       ├── attendance/    # 考勤管理
│   │       ├── medical/       # 医疗管理
│   │       ├── rooms/         # 分房管理
│   │       ├── supplies/      # 物资管理
│   │       └── feedback/      # 家长回访
│   ├── package.json
│   ├── svelte.config.js
│   └── vite.config.ts
│
├── start.sh                   # 一键启动脚本
├── reset-db.sh               # 重置数据库脚本
└── README.md
```

---

## 🔌 API 接口规范

### 认证接口
| 方法 | 路径                | 说明       | 权限 |
|------|---------------------|------------|------|
| POST | `/api/auth/login`   | 登录       | 公开 |
| GET  | `/api/auth/me`      | 获取当前用户 | 需要登录 |

### 看板接口
| 方法 | 路径                    | 说明           |
|------|-------------------------|----------------|
| GET  | `/api/dashboard/stats`  | 获取统计数据   |
| GET  | `/api/dashboard/todo`   | 获取待办事项   |

### 业务接口

#### 营员管理
| 方法 | 路径                          | 说明           | 角色           |
|------|-------------------------------|----------------|----------------|
| GET  | `/api/campers`                | 营员列表       | 所有登录用户   |
| GET  | `/api/campers/:id`            | 营员详情       | 所有登录用户   |
| POST | `/api/campers`                | 新增营员       | 营地主任       |
| PUT  | `/api/campers/:id`            | 更新营员       | 主任/老师      |
| DELETE | `/api/campers/:id`          | 删除营员       | 营地主任       |
| GET  | `/api/campers/:id/timeline`   | 营员时间线     | 所有登录用户   |

#### 考勤管理
| 方法 | 路径                          | 说明           | 角色           |
|------|-------------------------------|----------------|----------------|
| GET  | `/api/attendance`             | 考勤列表       | 所有登录用户   |
| GET  | `/api/attendance/:id`         | 考勤详情       | 所有登录用户   |
| POST | `/api/attendance`             | 提交考勤       | 老师/主任      |
| PUT  | `/api/attendance/:id`         | 更新考勤       | 老师/主任      |
| POST | `/api/attendance/:id/approve` | 审批通过       | 营地主任       |
| POST | `/api/attendance/:id/reject`  | 审批驳回       | 营地主任       |

#### 医疗管理
| 方法 | 路径                          | 说明           | 角色           |
|------|-------------------------------|----------------|----------------|
| GET  | `/api/medical`                | 医疗记录列表   | 所有登录用户   |
| GET  | `/api/medical/:id`            | 医疗记录详情   | 所有登录用户   |
| POST | `/api/medical`                | 上报医疗记录   | 所有登录用户   |
| PUT  | `/api/medical/:id`            | 更新医疗记录   | 所有登录用户   |
| POST | `/api/medical/:id/resolve`    | 标记已解决     | 后勤/主任      |
| POST | `/api/medical/:id/followup`   | 添加随访记录   | 老师/主任      |

#### 分房管理
| 方法 | 路径                  | 说明       | 角色           |
|------|-----------------------|------------|----------------|
| GET  | `/api/rooms`          | 房间列表   | 所有登录用户   |
| GET  | `/api/rooms/:id`      | 房间详情   | 所有登录用户   |
| POST | `/api/rooms`          | 新增房间   | 后勤/主任      |
| PUT  | `/api/rooms/:id`      | 更新房间   | 后勤/主任      |
| POST | `/api/rooms/assign`   | 分配房间   | 后勤/主任      |
| POST | `/api/rooms/unassign` | 取消分配   | 后勤/主任      |

#### 物资管理
| 方法 | 路径                        | 说明       | 角色           |
|------|-----------------------------|------------|----------------|
| GET  | `/api/supplies`             | 物资列表   | 所有登录用户   |
| GET  | `/api/supplies/:id`         | 物资详情   | 所有登录用户   |
| POST | `/api/supplies`             | 申请物资   | 后勤/主任      |
| PUT  | `/api/supplies/:id`         | 更新申请   | 后勤/主任      |
| POST | `/api/supplies/:id/fulfill` | 完成发放   | 后勤/主任      |

#### 家长回访
| 方法 | 路径                          | 说明       | 角色           |
|------|-------------------------------|------------|----------------|
| GET  | `/api/feedback`               | 回访列表   | 所有登录用户   |
| GET  | `/api/feedback/:id`           | 回访详情   | 所有登录用户   |
| POST | `/api/feedback`               | 新增回访   | 老师/主任      |
| PUT  | `/api/feedback/:id`           | 更新回访   | 老师/主任      |
| POST | `/api/feedback/:id/complete`  | 完成回访   | 老师/主任      |

---

## 🎯 设计要点

### 前后端边界清晰
- **后端**：纯API服务，所有业务逻辑、数据校验、权限控制都在后端完成
- **前端**：仅负责UI展示和用户交互，通过统一的API客户端调用后端接口
- 所有API调用都封装在 `frontend/src/lib/api/client.ts` 中

### 双栏详情台设计
- 左侧列表支持搜索、筛选、分组
- 右侧详情包含：基本信息、操作按钮、关联数据、时间线
- 操作结果即时刷新列表，无需页面跳转

### 角色权限控制
- 后端中间件校验角色权限
- 前端根据角色隐藏无权限的菜单和按钮
- 关键操作（如审批）需要特定角色

---

## 🐛 常见问题

### Q: 端口被占用怎么办？
```bash
# 杀掉占用端口的进程
lsof -ti:3001 | xargs kill -9   # 后端
lsof -ti:5173 | xargs kill -9   # 前端
```

### Q: 如何查看后端日志？
后端启动后会在终端输出访问日志，包含请求路径、状态码等信息。

### Q: 数据存在哪里？
所有数据存储在 `backend/camp.db` SQLite 数据库文件中，可以直接备份该文件。

---

## 📝 开发说明

### 后端开发
```bash
cd backend
go run ./cmd/main.go    # 开发模式运行
go build -o camp-server ./cmd/main.go  # 编译
```

### 前端开发
```bash
cd frontend
npm run dev             # 开发模式
npm run check           # 类型检查
npm run build           # 生产构建
```

---

## 📄 License

MIT
