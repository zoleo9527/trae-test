# 跑腿平台 - 订单派发与超时申诉系统

基于 SvelteKit + Go Fiber 的全栈应用，实现订单派发、超时申诉和补贴管理的完整追踪链路。

## 技术栈

**前端**
- SvelteKit 2.0
- TypeScript
- Tailwind CSS (CDN)

**后端**
- Go 1.20+
- Fiber v2
- GORM + SQLite
- Bcrypt 密码加密

## 启动方式

### 1. 启动后端服务

```bash
cd backend
go mod download
go run main.go
```

后端服务运行在 `http://localhost:3001`

### 2. 启动前端服务

```bash
cd frontend
npm install
npm run dev
```

前端服务运行在 `http://localhost:5173`

## 测试账号

所有账号密码均为：`123456`

| 用户名 | 角色 | 权限说明 |
|--------|------|----------|
| `admin` | 运营经理 | 全权限，可审核申诉、查看补贴 |
| `dispatch_zhang` | 调度专员 | 管理订单、分配骑手 |
| `cs_li` | 客服 | 提交申诉、查看订单 |
| `runner_wang` | 骑手 | 查看配送订单、提交申诉 |
| `runner_chen` | 骑手 | 查看配送订单、提交申诉 |

## 系统功能

### 核心特性

1. **双栏详情台设计** - 左侧列表 + 右侧详情，无需跳转页面
2. **多角色权限隔离** - 不同角色看到不同的操作按钮和视图
3. **完整追踪链路** - 订单 → 申诉 → 补贴，全程时间线可追溯
4. **智能补贴计算** - 根据申诉类型自动计算补贴金额

### 功能模块

#### 订单管理
- 新建订单（运营/调度）
- 分配骑手（调度）
- 取餐/送达（骑手）
- 状态筛选
- 实时时间线

#### 申诉处理
- 提交申诉（骑手/客服）
- 申诉审核（运营经理）
- 关联订单详情
- 证据查看

#### 补贴管理
- 补贴列表
- 智能计算
- 状态跟踪
- 申诉关联

## 演示数据说明

系统预置了5条订单，包含多种异常场景：

| 订单号 | 状态 | 场景 |
|--------|------|------|
| DD202405290001 | 已送达 | 正常完成订单 |
| DD202405290002 | 已超时 | 超时待申诉订单（王骑手）|
| DD202405290003 | 配送中 | 正在配送订单 |
| DD202405290004 | 待分配 | 可分配给骑手 |
| DD202405290005 | 申诉中 | 商家出错申诉已通过，有补贴 |

**可直接触发的异常处理流程：**
1. 使用 `dispatch_zhang` 分配订单 DD202405290004 给骑手
2. 使用 `runner_wang` 对超时订单 DD202405290002 提交申诉
3. 使用 `admin` 审核待处理的申诉，设置补贴金额
4. 在补贴页面查看已发放的补贴记录

## 刻意简化的部分

为了快速演示核心流程，以下部分做了简化：

### 认证安全
- 当前使用简单 token 格式（用户ID|角色），生产环境应使用 JWT
- 没有 token 过期机制
- 没有 refresh token 机制

### 数据库
- 使用 SQLite 单文件数据库，生产环境建议 PostgreSQL
- 没有数据库迁移工具（GORM AutoMigrate 仅用于开发）
- 没有数据库连接池优化

### 文件上传
- 申诉证据仅支持 URL 输入，没有实现文件上传功能
- 生产环境建议对接 OSS/COS 等对象存储

### 实时通知
- 没有 WebSocket 推送，状态变更需要手动刷新
- 没有消息通知系统

### 数据校验
- 前端输入校验较简单
- 后端参数校验可以进一步加强（建议使用 validator）

### 分页
- 列表没有实现分页，数据量大时会有性能问题

### 审计日志
- 只有订单时间线，没有完整的操作审计日志
- 没有敏感操作记录

## API 接口

### 认证
- `POST /api/login` - 登录

### 订单
- `GET /api/orders` - 获取订单列表
- `GET /api/orders/:id` - 获取订单详情
- `POST /api/orders` - 创建订单
- `PUT /api/orders/:id/assign` - 分配骑手
- `PUT /api/orders/:id/pickup` - 取餐
- `PUT /api/orders/:id/deliver` - 送达
- `GET /api/timeline/:orderId` - 订单时间线

### 申诉
- `GET /api/appeals` - 获取申诉列表
- `GET /api/appeals/:id` - 获取申诉详情
- `POST /api/appeals` - 提交申诉
- `PUT /api/appeals/:id/review` - 审核申诉

### 补贴
- `GET /api/subsidies` - 获取补贴列表
- `POST /api/subsidies/calculate` - 智能计算补贴

### 其他
- `GET /api/runners` - 获取骑手列表
- `GET /api/auth/me` - 获取当前用户

## 项目结构

```
runner-platform/
├── backend/                 # Go Fiber 后端
│   ├── main.go             # 入口文件
│   ├── database/           # 数据库初始化
│   ├── models/             # 数据模型
│   ├── handlers/           # 请求处理器
│   ├── middleware/         # 中间件
│   └── go.mod
├── frontend/               # SvelteKit 前端
│   ├── src/
│   │   ├── routes/         # 页面路由
│   │   ├── lib/            # 工具库
│   │   │   ├── api.ts      # API 封装
│   │   │   └── stores/     # 状态管理
│   │   └── app.html
│   └── package.json
└── README.md
```

## 核心链路追踪

每个订单都有完整的时间线，记录关键节点：

```
订单创建 → 分配骑手 → 取餐 → 配送中 → [超时] → 提交申诉 → 审核申诉 → [补贴发放]
```

点击任意订单可在右侧详情面板底部查看完整时间线。
