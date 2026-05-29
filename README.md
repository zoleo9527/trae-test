# 汽配商行管理系统 - 维修工单与出库对账

## 项目简介

这是一套专为汽配商行设计的管理系统，整合了维修工单管理和出库对账功能，解决了传统依靠询价表、仓库便签和结算台账拼接工作的痛点。

## 核心功能

### 首页仪表盘
- 一目了然展示待处理、已驳回、需回查工单和待对账出库单数量
- 快速查看最近待处理工单和待对账出库单
- 一键跳转处理，减少页面切换

### 维修工单管理
- 工单列表：支持搜索、状态筛选
- 工单详情：完整展示客户信息、车型、配件明细
- 处理动作：通过、驳回（需填写原因）、需回查标记
- 多窗口对照：可在新窗口打开工单，方便对照处理

### 出库对账管理
- 出库单列表：关联工单一键跳转
- 出库详情：自动关联显示对应工单信息
- 对账处理：完成对账、登记退货
- 退货记录：完整追踪退货原因和明细

### 本地特色功能
- **多窗口处理**：支持同时打开多个窗口对照查看
- **打印功能**：一键打印工单、出库单
- **扫码功能**：预留扫码接口，支持快速查找

## 技术栈

- **前端**: Electron + React 18 + Vite + Ant Design
- **后端**: Python Flask
- **数据存储**: JSON文件（可扩展为SQLite/MySQL）

## 项目结构

```
trae-test-2/
├── frontend/              # 前端项目
│   ├── electron/         # Electron主进程
│   │   └── main.js       # 主进程代码（多窗口、打印）
│   ├── src/
│   │   ├── pages/        # 页面组件
│   │   │   ├── Dashboard.jsx      # 首页仪表盘
│   │   │   ├── WorkOrder/         # 维修工单模块
│   │   │   └── Outbound/          # 出库对账模块
│   │   ├── utils/        # 工具函数
│   │   └── mock/         # 模拟数据
│   ├── package.json
│   └── vite.config.js
├── backend/               # 后端项目
│   ├── main.py           # Flask服务入口
│   ├── requirements.txt
│   └── data.json         # 数据存储文件（自动生成）
└── README.md
```

## 快速开始

### 环境要求

- Node.js >= 16
- Python >= 3.8

### 1. 安装依赖

**前端依赖:**
```bash
cd frontend
npm install
```

**后端依赖:**
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 2. 启动服务

**方式一：分别启动（推荐开发时使用）**

启动后端服务（终端1）:
```bash
cd backend
python main.py
```
后端服务运行在: `http://localhost:8081`

启动前端开发服务（终端2）:
```bash
cd frontend
npm run dev
```
前端服务运行在: `http://localhost:5173`

**方式二：Electron模式运行**
```bash
cd frontend
npm run electron
```

### 3. 初始化数据

首次运行后端服务时，会自动初始化演示数据，包括：
- 3条维修工单（待处理、已驳回、需回查各1条）
- 1条出库对账记录

## 演示入口

### 首页仪表盘
- 路径: `/`
- 功能: 查看统计卡片、待处理工单列表、待对账出库单

### 维修工单
- 列表路径: `/workorder`
- 详情路径: `/workorder/:id`
- 演示数据: `WO202401001` (待处理)

### 出库对账
- 列表路径: `/outbound`
- 详情路径: `/outbound/:id`
- 演示数据: `OB202401001` (已对账)

## 功能操作说明

### 多窗口对照
1. 在任意列表页点击"多窗口"按钮
2. 或在详情页点击"新窗口"按钮
3. 即可打开独立窗口进行对照查看

### 打印单据
1. 进入工单或出库单详情页
2. 点击右上角"打印"按钮
3. 系统会生成格式化的打印内容

### 工单处理流程
1. 待处理工单 → 通过 → 生成出库单
2. 待处理工单 → 驳回（填写原因） → 返回修改
3. 异常情况 → 标记需回查 → 后续跟进

### 出库对账流程
1. 工单通过后生成出库单
2. 仓库实际出库 → 确认实出数量
3. 客户退货 → 登记退货记录
4. 核对无误 → 完成对账

## API接口

### 维修工单
- `GET /api/workorder` - 获取工单列表
- `GET /api/workorder/:id` - 获取工单详情
- `POST /api/workorder` - 创建工单
- `POST /api/workorder/:id/approve` - 通过工单
- `POST /api/workorder/:id/reject` - 驳回工单
- `POST /api/workorder/:id/review` - 标记需回查

### 出库对账
- `GET /api/outbound` - 获取出库单列表
- `GET /api/outbound/:id` - 获取出库单详情
- `POST /api/outbound` - 创建出库单
- `POST /api/outbound/:id/reconcile` - 完成对账
- `POST /api/outbound/:id/return` - 登记退货

### 统计数据
- `GET /api/stats/dashboard` - 获取仪表盘统计

## 打包发布

### 打包Electron应用
```bash
cd frontend
npm run electron:build
```
打包后的应用在 `frontend/release` 目录

## 注意事项

1. 数据文件 `backend/data.json` 会自动创建，请勿手动删除
2. Electron模式下需要同时启动后端服务，或配置打包后内置后端
3. 扫码功能需要配合硬件扫码枪使用，当前为预留接口

## 后续扩展建议

- 接入数据库（SQLite/MySQL）替代JSON文件
- 添加用户权限管理
- 接入扫码枪硬件驱动
- 添加账期客户回款管理
- 添加库存预警功能
