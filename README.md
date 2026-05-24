# 家装监理-变更签认与费用追踪系统

基于 Electron + React 构建的家装监理多人协作管理系统，实现变更签认、整改追踪、费用确认的全流程管理。

## 功能特性

### 核心功能
- **首页仪表盘**：一屏展示待处理、已驳回、需回查的数据统计
- **变更签认**：支持监理→管家→业主的三级审批流程，版本追溯
- **整改追踪**：质量/安全问题的全生命周期管理
- **费用确认**：变更费用的确认、支付、收据管理

### 多人协作角色
| 角色 | 职责 |
|------|------|
| 监理负责人 | 创建变更单、发起整改、现场验收 |
| 项目管家 | 审核变更内容、确认费用、跟进进度 |
| 业主客服 | 回查历史、发送收款提醒、处理投诉 |

### Electron 原生功能
- 🖨️ **打印回执**：一键打印变更单回执，含签字区域
- 📱 **扫码录入**：支持相机扫描和图片上传识别
- 🪟 **多窗口处理**：支持新开窗口并行处理多个任务

## 项目结构

```
trae-test-4/
├── electron/
│   └── main.js              # Electron 主进程（打印、多窗口）
├── src/
│   ├── components/
│   │   ├── Layout.jsx       # 布局组件（导航+角色切换）
│   │   └── ScanModal.jsx    # 扫码弹窗组件
│   ├── pages/
│   │   ├── Dashboard.jsx    # 首页仪表盘
│   │   ├── ChangeOrders.jsx # 变更单列表
│   │   ├── ChangeOrderDetail.jsx  # 变更单详情（核心处理页）
│   │   ├── Rectification.jsx      # 整改追踪
│   │   └── FeeTracking.jsx        # 费用确认
│   ├── data/
│   │   └── mockData.js      # 模拟数据
│   ├── utils/
│   │   └── cn.js            # 样式工具
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
└── README.md
```

## 快速开始

### 环境要求
- Node.js >= 16.0.0
- npm >= 8.0.0

### 安装依赖

```bash
npm install
```

### 本地启动

```bash
npm run dev
```

启动后会自动打开 Electron 应用窗口，同时支持浏览器访问 `http://localhost:5173`

### 构建打包

```bash
# 仅构建前端
npm run build

# 构建 Electron 安装包
npm run build:electron
```

## 演示入口

### 角色切换
点击右上角用户头像可切换不同角色，体验各视角的功能差异：

1. **张监理（监理负责人）**
   - 可新建变更单、新建整改单
   - 对驳回的变更单可编辑重提
   - 对整改项目可派工和验收

2. **李管家（项目管家）**
   - 审核变更单（通过/驳回）
   - 确认费用
   - 发送业主确认通知

3. **王客服（业主客服）**
   - 查看所有历史记录
   - 回查变更单完整时间线
   - 发送收款提醒
   - 打印完整记录

### 核心流程演示

1. **变更单处理流程**
   ```
   监理创建 → 监理审核 → 管家审核 → 业主确认 → 生效
   ```
   点击首页「变更签认」→ 选择待处理变更单 → 根据当前角色进行对应操作

2. **费用确认流程**
   - 管家：待确认费用 → 点击「确认」
   - 客服：待支付费用 → 发送收款提醒 → 标记已付

3. **打印功能**
   - 打开任意已完成的变更单详情
   - 点击右上角「打印回执」
   - 系统将弹出打印预览窗口

4. **多窗口功能**
   - 点击左侧菜单栏底部「新开窗口」
   - 可在新窗口中继续操作其他项目

## 数据说明

当前使用模拟数据，包含：
- 4 个变更单（不同状态）
- 3 个整改记录
- 3 条费用记录

各状态说明：
- `pending_approval`：待管家审核
- `pending_owner`：待业主确认
- `rejected`：已驳回（需重新提交）
- `completed`：已完成

## 技术栈

- **前端框架**：React 18 + Vite
- **样式方案**：Tailwind CSS
- **桌面端**：Electron 28
- **路由管理**：React Router 6
- **图标库**：Lucide React

## 关键文件说明

- [electron/main.js](file:///Users/zhangliu/Documents/private/model-test/trae-test-4/electron/main.js) - Electron 主进程，实现打印和多窗口 IPC
- [src/pages/ChangeOrderDetail.jsx](file:///Users/zhangliu/Documents/private/model-test/trae-test-4/src/pages/ChangeOrderDetail.jsx) - 核心变更单处理页，含审批流程和时间线
- [src/data/mockData.js](file:///Users/zhangliu/Documents/private/model-test/trae-test-4/src/data/mockData.js) - 所有模拟数据和配置映射
