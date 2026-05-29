# 跑腿平台 - 商家结算与异常补贴管理系统

基于 Nuxt 3 + FastAPI 的全栈应用，用于管理跑腿平台的商家结算、异常申诉和补贴发放。

## 功能特性

- 🏠 **首页看板**：实时展示待处理、已驳回、需回查的申诉数据，以及异常订单、待结算、累计补贴统计
- 📋 **异常申诉**：申诉列表管理、状态筛选、搜索功能
- 🎯 **异常处理抽屉**：一站式处理申诉，包含申诉详情、截图查看、处理记录、操作留痕
- 💰 **补贴管理**：补贴记录查询、结算状态筛选、金额统计
- 📊 **商家结算**：周期结算单查看、结算明细展示
- 📦 **订单查询**：订单列表、异常状态筛选、搜索功能
- 📝 **操作留痕**：所有处理操作自动记录，支持回查追溯

## 技术栈

### 前端
- Nuxt 3
- Vue 3 (Composition API)
- TypeScript
- Tailwind CSS
- @nuxt/ui

### 后端
- FastAPI
- Python 3.8+
- Pydantic
- Uvicorn

## 项目结构

```
trae-test-3/
├── frontend/                 # Nuxt 3 前端
│   ├── pages/               # 页面文件
│   │   ├── index.vue        # 首页看板
│   │   ├── appeals.vue      # 异常申诉页
│   │   ├── subsidies.vue    # 补贴管理页
│   │   ├── settlements.vue  # 商家结算页
│   │   └── orders.vue       # 订单查询页
│   ├── components/          # 组件
│   │   └── AppealDrawer.vue # 异常处理抽屉组件
│   ├── composables/         # 组合式函数
│   │   └── useApi.ts        # API 封装
│   ├── types/               # 类型定义
│   │   └── index.ts
│   ├── assets/              # 静态资源
│   │   └── css/
│   │       └── main.css     # 全局样式
│   ├── layouts/             # 布局
│   │   └── default.vue      # 默认布局
│   ├── app.vue
│   ├── nuxt.config.ts
│   ├── package.json
│   └── tsconfig.json
├── backend/                  # FastAPI 后端
│   ├── main.py              # 主应用文件（包含数据模型、API、模拟数据）
│   └── requirements.txt     # Python 依赖
└── README.md
```

## 快速开始

### 环境要求

- Node.js 18+
- Python 3.8+
- npm 或 pnpm

### 1. 安装依赖

#### 后端依赖

```bash
cd backend
pip install -r requirements.txt
```

#### 前端依赖

```bash
cd frontend
pnpm install
# 或使用 npm
# npm install
```

### 2. 启动服务

#### 启动后端服务

```bash
cd backend
python main.py
```

后端服务将在 `http://localhost:8000` 启动

API 文档地址：`http://localhost:8000/docs`

#### 启动前端服务（新开一个终端）

```bash
cd frontend
pnpm dev
# 或使用 npm
# npm run dev
```

前端服务将在 `http://localhost:3000` 启动

### 3. 访问应用

打开浏览器访问：`http://localhost:3000`

## 演示入口

### 首页看板
- 地址：`http://localhost:3000`
- 功能：查看待处理申诉、已驳回申诉、需回查申诉、异常订单、待结算、累计补贴等核心指标
- 点击卡片或列表项可直接进入处理流程

### 异常申诉处理
1. 访问：`http://localhost:3000/appeals`
2. 点击任意申诉记录打开处理抽屉
3. 可查看申诉详情、截图、处理记录、操作留痕
4. 支持三种处理结果：通过、驳回、需回查
5. 通过时可设置补贴金额，系统自动生成补贴记录

### 补贴管理
- 地址：`http://localhost:3000/subsidies`
- 查看所有补贴记录、累计补贴金额、已结算/待结算统计

### 商家结算
- 地址：`http://localhost:3000/settlements`
- 查看商家周期结算单、明细组成

### 订单查询
- 地址：`http://localhost:3000/orders`
- 支持按异常状态、订单状态筛选和搜索

## 初始化说明

### 模拟数据

系统启动时会自动生成以下模拟数据：
- 5 个商家
- 50 个订单（包含正常和异常订单）
- 15 条申诉记录（待处理、已通过、已驳回、需回查）
- 多条补贴记录
- 多笔结算单

### 数据说明

所有数据存储在内存中，重启后端服务后数据会重置。如需持久化存储，可接入数据库（如 SQLite、PostgreSQL）。

## API 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/dashboard/stats` | 获取看板统计数据 |
| GET | `/api/orders` | 获取订单列表 |
| GET | `/api/orders/{id}` | 获取订单详情 |
| GET | `/api/appeals` | 获取申诉列表 |
| GET | `/api/appeals/{id}` | 获取申诉详情 |
| POST | `/api/appeals/{id}/process` | 处理申诉 |
| GET | `/api/subsidies` | 获取补贴列表 |
| GET | `/api/settlements` | 获取结算列表 |
| GET | `/api/merchants` | 获取商家列表 |
| GET | `/api/operation-logs` | 获取操作日志 |

## 核心交互设计

### 异常处理抽屉

异常处理抽屉是系统的核心交互组件，设计特点：

1. **一站式处理**：申诉详情、截图、历史处理、操作留痕、处理表单在同一界面完成
2. **流畅动画**：抽屉滑入滑出带动画效果，提升用户体验
3. **操作留痕**：每次处理自动记录操作人、时间、状态变更，支持回查
4. **补贴联动**：审批通过时自动生成补贴记录，无需手动创建

### 留痕与回查

所有申诉处理操作都会记录操作日志，包含：
- 操作人及角色
- 操作时间
- 操作描述
- 状态变更前后值
- 关联订单和申诉

## 注意事项

1. 本项目使用内存存储数据，仅供演示使用
2. 生产环境需接入真实数据库
3. 建议添加用户认证和权限管理
4. 截图上传功能需要接入文件存储服务

## 开发说明

### 后端开发

后端使用 FastAPI，支持热重载：
```bash
cd backend
python main.py
```

修改代码后服务会自动重启。

### 前端开发

前端使用 Nuxt 3，支持热模块替换：
```bash
cd frontend
pnpm dev
```

修改代码后页面会自动刷新。
