# 🥐 手作烘焙坊 - 会员储值与退款复核系统

基于 **SvelteKit + Go Fiber** 构建的多人协作烘焙门店管理系统。

---

## 📋 功能特性

### 👥 角色协作
- **门店主理人**: 全功能权限，审核退款、查看全局数据
- **后厨负责人**: 订单处理、产能管理、原料损耗记录
- **客服**: 会员管理、订单咨询、退款申请

### 🔄 核心流程
1. **会员储值**: 支持多支付方式、赠送金额、储值历史追踪
2. **订单管理**: 批量状态更新、取货时间管理、订单项明细
3. **退款复核**: 三级审核流程、关联订单查看、驳回原因记录
4. **状态时间轴**: 每次状态变更全程可追溯

### 📊 数据看板
- 待处理订单 / 制作中订单 实时统计
- 待退款复核 / 已驳回退款 提醒
- 今日订单 / 今日营收 / 会员总数 / 储值余额
- 最近操作记录时间线

---

## 🚀 本地启动

### 前置要求
- Go 1.20+
- Node.js 18+

### 1. 启动后端 (Go Fiber)

```bash
cd backend
go mod download
go run main.go
```

后端服务将运行在 **http://localhost:3001**

### 2. 启动前端 (SvelteKit)

```bash
cd frontend
npm install
npm run dev
```

前端服务将运行在 **http://localhost:5173**

---

## 🎯 演示入口

| 页面 | 路径 | 说明 |
|------|------|------|
| 工作台(首页) | `/` | 数据看板 + 最近活动 |
| 会员管理 | `/members` | 会员列表 + 储值操作 |
| 订单管理 | `/orders` | 批量处理 + 原料损耗 |
| 退款复核 | `/refunds` | 审核流程 + 状态时间轴 |
| 产品管理 | `/products` | 产品信息维护 |

**体验提示**: 点击右上角的「角色切换」按钮，可模拟不同角色的操作权限。

---

## 🔧 初始化说明

### 数据库
- 首次启动自动创建 SQLite 数据库 (`backend/bakery.db`)
- 自动初始化演示数据:
  - 8款产品 (面包/蛋糕/饮品)
  - 3位会员
  - 5笔测试订单

### API 接口

```
# Dashboard
GET /api/dashboard/stats       # 统计数据
GET /api/dashboard/activities  # 最近活动

# 会员管理
GET    /api/members              # 会员列表
POST   /api/members              # 新增会员
PUT    /api/members/:id          # 更新会员
POST   /api/members/:id/recharge # 储值操作

# 订单管理
GET    /api/orders               # 订单列表
GET    /api/orders/:id           # 订单详情
POST   /api/orders               # 新建订单
POST   /api/orders/batch/status  # 批量更新状态
POST   /api/orders/:id/loss      # 记录原料损耗

# 退款复核
GET    /api/refunds              # 退款列表
POST   /api/refunds              # 申请退款
POST   /api/refunds/:id/approve  # 通过退款
POST   /api/refunds/:id/reject   # 驳回退款
POST   /api/refunds/batch/review # 批量审核
```

---

## 📂 项目结构

```
bakery-system/
├── backend/
│   ├── main.go                 # 入口文件
│   ├── models/
│   │   └── models.go           # 数据模型
│   ├── database/
│   │   └── database.go         # 数据库初始化
│   ├── handlers/
│   │   ├── member.go           # 会员接口
│   │   ├── order.go            # 订单接口
│   │   ├── refund.go           # 退款接口
│   │   ├── product.go          # 产品接口
│   │   └── dashboard.go        # 看板接口
│   ├── go.mod
│   └── bakery.db               # SQLite数据库(自动生成)
│
└── frontend/
    ├── src/
    │   ├── routes/
    │   │   ├── +layout.svelte  # 主布局(角色切换)
    │   │   ├── +page.svelte    # 首页看板
    │   │   ├── members/        # 会员管理
    │   │   ├── orders/         # 订单管理
    │   │   ├── refunds/        # 退款复核
    │   │   └── products/       # 产品管理
    │   ├── lib/
    │   │   └── api.js          # API调用封装
    │   └── app.css             # 全局样式
    ├── svelte.config.js
    ├── vite.config.js
    └── package.json
```

---

## 🎯 设计要点

### 前后端边界清晰
- **前端**: 页面交互、状态展示、表单验证
- **后端**: 业务逻辑、数据持久化、事务处理、状态流转

### 批量操作优化
- 订单可勾选批量更新状态
- 退款可批量通过/驳回
- 减少高峰期重复操作

### 状态可追溯
- 每次状态变更记录操作人、时间、备注
- 订单详情页展示完整时间轴
- 退款审核记录全程可查

### 角色视图隔离
- 不同角色显示不同菜单
- 后厨专注于制作流程
- 客服专注于会员服务
- 主理人掌控全局数据
