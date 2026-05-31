# 钟表售后管理系统 - 报价审批与客户确认

一套完整可用的钟表售后服务管理系统，解决寄修登记表、配件库存和客户回执分散、信息核对困难、流程追溯难的问题。

## 功能特性

### 核心业务流程
- **寄修登记** → **检测** → **配件锁定** → **报价** → **审批** → **客户确认** → **维修** → **进度更新** → **取件** → **满意度回访**
- 完整的状态机管理，支持 19 种操作类型
- 时间线自动记录所有操作，完整追溯每条工单的处理历史

### 多人协作处理
- **售后经理**：审批报价、查看全局数据、满意度回访
- **接件顾问**：登记寄修、跟进客户、发送确认、通知取件
- **维修技师**：检测故障、锁定配件、提交报价、更新维修进度

### 双栏详情台
- 左侧：工单列表 + 搜索 + 状态筛选 + 优先级筛选
- 右侧：工单详情 + 操作按钮 + 时间线 + 配件/进度/回执信息
- 无需多层页面跳转，列表、详情和处理动作连贯

### 首页仪表盘
- 待处理、已驳回、需回查、需回访数据一目了然
- 快捷操作区，直达各类型任务
- 本周效率统计和状态分布图

### 配件管理
- 配件锁定/释放机制，防止库存超卖
- 实时库存状态展示
- 锁定记录与工单关联

### 客户回执与满意度
- 客户确认/驳回流程
- 取件确认登记
- 5星满意度回访系统

### 完善的交互体验
- 空态、错误态、加载态完整处理
- 角色切换功能，便于测试演示
- 本地存储记住用户角色偏好
- Toast 操作反馈

## 技术栈

- **框架**: Nuxt 3 (Vue 3 + TypeScript)
- **状态管理**: Pinia
- **样式方案**: Tailwind CSS 3
- **图标库**: Iconify (Vue)
- **后端接口**: Nuxt Server API (内置 Mock 数据)

## 快速开始

### 环境要求
- Node.js >= 18.0.0
- npm 或 pnpm

### 本地启动

```bash
# 1. 进入项目目录
cd watch-service-system

# 2. 安装依赖
npm install
# 或使用 pnpm
pnpm install

# 3. 启动开发服务器
npm run dev
# 或
pnpm dev

# 4. 访问应用
# 浏览器打开: http://localhost:3000
```

### 构建生产版本

```bash
# 构建
npm run build

# 预览生产版本
npm run preview
```

## 演示入口

启动开发服务器后，访问以下地址：

| 页面 | 地址 | 说明 |
|------|------|------|
| **首页仪表盘** | http://localhost:3000 | 数据概览、快捷操作、任务分类 |
| **工单管理** | http://localhost:3000/workorders | 双栏详情台、工单列表、详情处理 |

## 角色切换与演示说明

系统内置三种角色，点击右上角用户头像即可切换：

### 1. 售后经理 (张经理)
- 查看所有工单和统计数据
- 审批报价、驳回报价
- 执行满意度回访
- 看到的待办：待审批工单、需回访工单

### 2. 接件顾问 (李顾问)
- 发送客户确认
- 处理客户确认/驳回
- 通知取件、确认取件
- 看到的待办：待检测、待客户确认、已完成待取件

### 3. 维修技师 (王技师)
- 开始检测、录入检测结果
- 锁定/释放配件
- 提交报价
- 开始维修、更新进度、完成维修
- 看到的待办：报价中、维修中

## 初始化方式

系统启动时自动初始化：

1. **Mock 数据自动加载**：内置 18 条覆盖各种状态的工单数据
2. **配件库存初始化**：8 种常用钟表配件库存数据
3. **角色默认值**：首次进入默认使用「售后经理」角色
4. **本地存储**：角色选择会自动保存到 localStorage

### 数据初始化说明

所有 Mock 数据位于 `server/data/mockData.ts`，包含：

- 18 条工单，覆盖 9 种状态
- 8 种配件库存（表蒙、表冠、表带、机芯、电池等）
- 每条工单包含完整的时间线、配件、报价、进度、回执数据

如需重置数据，重启开发服务器即可。

## 目录结构

```
watch-service-system/
├── assets/
│   └── css/
│       └── main.css              # 全局样式 + Tailwind 配置
├── components/
│   ├── common/                   # 通用组件
│   │   ├── BaseModal.vue         # 基础模态框
│   │   ├── ConfirmModal.vue      # 确认弹窗
│   │   ├── EmptyState.vue        # 空态
│   │   ├── ErrorState.vue        # 错误态
│   │   ├── LoadingState.vue      # 加载态
│   │   ├── PriorityBadge.vue     # 优先级标签
│   │   ├── RoleSwitcher.vue      # 角色切换器
│   │   └── StatusBadge.vue       # 状态标签
│   ├── dashboard/                # 仪表盘组件
│   │   ├── StatCard.vue          # 统计卡片
│   │   └── TaskList.vue          # 任务列表
│   ├── layout/
│   │   └── AppHeader.vue         # 顶部导航
│   └── workorder/                # 工单组件
│       ├── PartLockModal.vue     # 配件锁定弹窗
│       ├── ProgressModal.vue     # 进度更新弹窗
│       ├── QuoteModal.vue        # 报价弹窗
│       ├── SatisfactionModal.vue # 满意度回访弹窗
│       ├── Timeline.vue          # 操作时间线
│       ├── WorkOrderDetail.vue   # 工单详情
│       ├── WorkOrderFilter.vue   # 筛选器
│       └── WorkOrderList.vue     # 工单列表
├── composables/
│   ├── useRole.ts                # 角色相关逻辑
│   └── useWorkOrder.ts           # 工单相关逻辑
├── pages/
│   ├── index.vue                 # 首页仪表盘
│   └── workorders/
│       └── index.vue             # 工单管理页
├── server/
│   ├── api/                      # Server API
│   │   ├── parts.get.ts          # 配件库存查询
│   │   ├── stats.get.ts          # 统计数据
│   │   ├── workorders.get.ts     # 工单列表
│   │   ├── workorders/
│   │   │   ├── [id].get.ts       # 工单详情
│   │   │   ├── [id].patch.ts     # 更新工单
│   │   │   └── [id]/action.post.ts # 工单操作
│   └── data/
│       └── mockData.ts           # Mock 数据
├── stores/
│   ├── user.ts                   # 用户/角色状态
│   └── workorder.ts              # 工单状态
├── types/
│   └── workorder.ts              # TypeScript 类型定义
├── utils/
│   ├── constants.ts              # 常量配置
│   └── format.ts                 # 格式化工具
├── app.vue                       # 应用入口
├── nuxt.config.ts                # Nuxt 配置
├── tailwind.config.js            # Tailwind 配置
└── package.json
```

## 业务流程详解

### 完整流程步骤

1. **寄修登记** (顾问) → 状态：待检测
2. **开始检测** (技师) → 录入检测结果
3. **锁定配件** (技师) → 从库存锁定所需配件
4. **提交报价** (技师) → 填写零件费、人工费
5. **审批报价** (经理) → 通过 或 驳回（需填写原因）
6. **发送确认** (顾问) → 发送给客户确认
7. **客户确认** (顾问) → 客户确认接受报价
   - 或 **客户驳回** (顾问) → 客户拒绝，可重新报价
8. **开始维修** (技师) → 进入维修状态
9. **更新进度** (技师) → 检测中 → 配件准备 → 维修中 → 测试中 → 完成
10. **完成维修** (技师) → 维修完成
11. **通知取件** (顾问) → 通知客户取件
12. **确认取件** (顾问) → 客户取走，登记取件信息
13. **满意度回访** (经理) → 5星评分 + 评价

### 状态流转图

```
待检测 → 报价中 → 待审批 → 待客户确认 → 维修中 → 已完成 → 已取件
                ↓        ↓
              已驳回  客户驳回
                ↓        ↓
              (可重新报价)
```

## 操作 API 说明

所有操作通过统一的 `/api/workorders/[id]/action` 接口处理，支持 19 种操作类型：

| 操作类型 | 说明 | 角色 |
|----------|------|------|
| `register` | 登记工单 | 顾问 |
| `start_inspect` | 开始检测 | 技师 |
| `lock_parts` | 锁定配件 | 技师 |
| `release_parts` | 释放配件 | 技师 |
| `submit_quote` | 提交报价 | 技师 |
| `approve_quote` | 审批通过 | 经理 |
| `reject_quote` | 驳回报价 | 经理 |
| `send_confirmation` | 发送确认 | 顾问 |
| `customer_confirm` | 客户确认 | 顾问 |
| `customer_reject` | 客户驳回 | 顾问 |
| `start_repair` | 开始维修 | 技师 |
| `update_progress` | 更新进度 | 技师 |
| `complete_repair` | 完成维修 | 技师 |
| `notify_pickup` | 通知取件 | 顾问 |
| `confirm_pickup` | 确认取件 | 顾问 |
| `satisfaction_survey` | 满意度回访 | 经理 |
| `reopen` | 重新打开 | 经理 |
| `close` | 关闭工单 | 经理 |

## 常见问题

### Q: 如何重置演示数据？
A: 重启开发服务器即可，数据会在服务启动时重新生成。

### Q: 角色切换有什么用？
A: 用于演示不同角色看到的界面和可执行的操作。真实部署时应对接实际的用户权限系统。

### Q: 数据保存在哪里？
A: 演示版本使用内存存储，重启后重置。如需持久化，可将 `server/data/mockData.ts` 替换为真实数据库调用。

### Q: 如何接入真实后端？
A: 替换 `server/api/` 目录下的接口实现，或将 `$fetch` 调用指向你的后端 API 地址。

## License

MIT
