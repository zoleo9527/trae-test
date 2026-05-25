# 图书发行 · 退货申请与库存调拨控制台

多人协作的处理面：把**新书铺货 / 渠道反馈 / 退货申请 / 库存调拨 / 财务对账**从零散表格里救出来，沉淀在一个工作台里。

常用动作（提交、审核、驳回、发货、签收、补回执、重新核对）都沉在页面里；留痕和回查不做轻，每一步动作都带角色、时间、意见。

## 技术栈

- Vue 3 + `<script setup>` + TypeScript
- Vite 5
- Pinia（状态组织）
- Vue Router 4（Hash 路由）
- Element Plus + `@element-plus/icons-vue`
- 本地 Mock 数据（`src/utils/seed.ts`），无后端依赖

## 启动方式

```bash
# 1. 安装依赖（建议 pnpm，npm / yarn 均可）
pnpm install

# 2. 本地启动
pnpm dev
# 默认地址：http://127.0.0.1:5173
```

构建与预览：

```bash
pnpm build
pnpm preview
# 预览地址：http://127.0.0.1:5174
```

类型检查：

```bash
pnpm typecheck
```

## 演示入口

默认入口 `http://127.0.0.1:5173/`，进入后自动跳转至 **工作台**。

- 工作台 `/dashboard`：待处理 / 已驳回 / 需回查 / 调拨在途 / 样书回执丢失 / 退货口径不一 的六宫格概览，一进来就能看。
- 退货申请 `/returns`：渠道经理视角可新建和提交；发行专员视角可通过 / 驳回 / 进入异常抽屉。
- 库存调拨 `/transfers`：发行专员安排发货；渠道经理签收；风险标签与留痕一起看。
- 对账留痕 `/finance`：样书回执跟踪 + 退货口径一致性，支持重新核对。

## 角色切换

顶栏右侧的 `RadioGroup` 可在 **渠道经理 / 发行专员 / 财务对接** 之间切换。
不同角色看到的可用动作不同（例如“通过”按钮只对发行专员显示），但数据视图一致，方便多人协作追责。

## 初始化方式

首次进入时：

1. `src/main.ts` 中创建 Pinia Store；
2. `src/stores/console.ts` 在 `state()` 里调用 `seedReturns / seedTransfers / seedReceipts / seedReconciliation` 生成演示数据；
3. 路由 `/` 重定向至 `/dashboard`，仪表盘 KPI、列表、抽屉全部就绪。

如需接入真实后端，将 `stores/console.ts` 中的 seed 替换为 `api/` 下的请求即可，模型（`src/types/domain.ts`）已把形状定好。

## 关键设计

- **状态集中在 Pinia**：`returns / transfers / receipts / reconciliations / drawer` 均为单一数据源。
- **异常处理用抽屉而非页面跳转**：避免打断协作节奏；异常意见会写入 `history`，月底可回查。
- **留痕结构化**：`HistoryEntry { role, operator, action, from, to, comment, timestamp }`，每个实体都带 `history[]`。
- **空态 / 错误态**：全局复用 `components/common/EmptyBlock.vue`，抽屉详情、列表空结果、未找到均走同组件。
- **无首页真空**：工作台 KPI + 待处理列表 + 需回查 + 样书回执四联块，信息密度够。

## 目录结构

```
src/
├─ main.ts
├─ App.vue
├─ router/index.ts
├─ stores/console.ts
├─ types/domain.ts
├─ utils/seed.ts
├─ styles/global.scss
├─ components/common/
│  ├─ EmptyBlock.vue
│  ├─ ExceptionDrawer.vue
│  ├─ HistoryPanel.vue
│  └─ RoleBanner.vue
└─ views/
   ├─ DashboardView.vue
   ├─ ReturnsView.vue
   ├─ TransfersView.vue
   └─ FinanceView.vue
```

## 后续可扩展

- 把 `seed.ts` 替换为真实 Bitable / 内部 API；
- 增加权限（按角色锁定 `canTransitionTo` 规则，已预埋）；
- 接入飞书机器人，把“样书回执丢失”“退货口径不一”推送到责任人。
