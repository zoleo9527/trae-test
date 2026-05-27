# 自助洗车 - 套餐核销与退款申诉系统

## 项目概述

基于 **Vue 3 + Vite + NestJS + PostgreSQL** 构建的自助洗车运营管理系统，重点解决：
- 套餐核销与退款申诉的流程接力问题
- 运营主管、巡检员、客服的角色分工协作
- 批量复核的连续处理效率
- 站点异常的及时升级机制

## 技术栈

| 层级 | 技术选型 |
|------|----------|
| 前端 | Vue 3 + TypeScript + Vite + Pinia + Vue Router |
| 后端 | NestJS + TypeScript + Prisma ORM |
| 数据库 | PostgreSQL |

## 快速开始

### 前置要求

- Node.js >= 18
- PostgreSQL >= 14

### 数据库初始化

```bash
# 创建数据库
createdb car_wash_db
```

### 后端启动

```bash
cd backend

# 安装依赖
npm install

# 生成 Prisma Client
npm run prisma:generate

# 执行数据库迁移
npm run prisma:migrate --name init

# 填充种子数据
npm run prisma:seed

# 启动开发服务器
npm run start:dev
```

后端服务运行在: http://localhost:3000

### 前端启动

```bash
cd frontend

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

前端服务运行在: http://localhost:5173

## 核心功能

### 1. 流程接力 - 退款申诉生命周期

```
用户提交申诉 → 客服审核 → [现场核验] → 运营主管终审
     ↓            ↓           ↓             ↓
  SUBMITTED → CS_REVIEWING → INSPECTION → APPROVED/REJECTED
```

**角色分工清晰：**
- **客服**：初步审核，判断是否需要现场核验
- **巡检员**：现场核验，上传设备照片和检查结果
- **运营主管**：最终审批，批量处理

### 2. 批量复核面板

支持一次勾选多条退款记录，批量执行：
- 批量通过
- 批量驳回
- 批量转现场核验
- 统一备注

### 3. 站点异常预警

| 预警等级 | 触发条件 | 响应机制 |
|---------|---------|---------|
| 🔴 高风险 | 多设备故障 + 耗材告急 | 自动升级为紧急任务 |
| 🟡 中风险 | 单设备故障 或 耗材预警 | 任务看板提醒 |
| 🟢 低风险 | 正常运行 | 正常巡检 |

### 4. 任务看板

按状态分栏展示：待分配 → 待处理 → 处理中 → 已完成

**角色视图过滤：**
- 运营主管：全局看板，可分配任务
- 巡检员：只看现场核验、设备检修、耗材补货
- 客服：只看核销争议类任务

## 预置样例数据

运行 `npm run prisma:seed` 后可测试以下场景：

### 正常流程
> **孙丽** - 买错套餐想退款
> - 状态：✅ 已批准
> - 路径：用户提交 → 客服确认未使用 → 主管批准退款

### 问题流程（卡在核验环节）
> **赵强** - 烘干机故障投诉
> - 状态：⏳ 待现场核验
> - 路径：客服审核后转巡检员现场确认，目前等待核验结果
> - 关联任务：西城区金融街站现场核验

### 驳回案例
> **周伟** - 无理由退款
> - 状态：❌ 已驳回
> - 原因：设备运行正常，退款理由不充分

### 站点异常场景
> **西城区金融街站**
> - 状态：🔴 异常（预警等级 5/5）
> - 问题：高压水枪故障 + 烘干机故障 + 洗车液库存告急
> - 已触发：紧急升级任务，巡检员处理中

### 耗材预警场景
> **海淀区中关村站**
> - 状态：🟡 预警（预警等级 3/5）
> - 问题：水蜡库存 12/15（低于警戒线）
> - 待办：耗材补货任务

## 架构设计取舍

### ✅ 已做的取舍

1. **轻量权限而非完整RBAC**
   - 只分3种角色，基于角色过滤数据
   - 省去用户登录、权限矩阵等复杂度
   - 前端可直接切换角色体验不同视图

2. **流程日志而非状态机**
   - 用 `RefundFlowLog` 记录每次状态变更
   - 比复杂状态机库更直观，便于回溯
   - 限制：状态流转校验在Service层硬编码

3. **任务与退款解耦**
   - Task表通用化，relatedId + relatedType关联任意业务
   - 退款申诉、设备检修、耗材补货都走同一任务看板
   - 缺点：关联查询稍复杂

4. **预警等级聚合计算**
   - 每次查询时动态计算warningLevel
   - 不存数据库，避免数据不一致
   - 缺点：无法直接按预警等级排序

### ⚠️ 待增强的边界

1. **并发控制**：批量复核未加锁，高并发下可能重复操作
2. **文件上传**：目前只有photoUrl字段，未实现真实上传
3. **消息通知**：状态变更后无主动推送，靠人工刷新
4. **数据权限**：同角色的用户未做数据隔离

## 后续可扩展点

### 1. 续费投放分析（规划中）

基于核销数据预测：
```typescript
// 预测模型雏形
interface RenewalPrediction {
  packageId: string;
  expireInDays: number;
  renewalProbability: number;  // 0-100
  suggestedOffer: string;      // 推荐优惠
  last30DayUsage: number;      // 近30天使用频次
}
```

### 2. 移动端巡检小程序

- 扫码签到
- 拍照上传
- 离线任务缓存
- 语音转文字填备注

### 3. 智能派单

```
   +-------------------------+
   |     任务智能分配        |
   +-------------------------+
              ↓
   ┌─────────────────────┐
   | 距离优先  +  技能匹配  |
   +---------------------+
              ↓
   自动推送到巡检员APP
```

### 4. 财务对账

- 退款审批通过后自动触发退款接口
- 每日对账报表
- 异常退款预警（同一客户高频退款）

### 5. 数据分析大屏

- 站点实时健康度热力图
- 核销/退款趋势曲线
- 各角色处理时效KPI
- 套餐转化率漏斗

## API 接口速查

| 模块 | 方法 | 路径 | 说明 |
|------|------|------|------|
| 退款 | POST | `/api/workflow/refund/submit` | 提交退款申诉 |
| 退款 | POST | `/api/workflow/refund/cs-review` | 客服审核 |
| 退款 | POST | `/api/workflow/refund/inspection` | 提交巡检结果 |
| 退款 | POST | `/api/workflow/refund/final` | 最终审核 |
| 退款 | POST | `/api/workflow/refund/batch` | 批量复核 |
| 退款 | GET | `/api/workflow/refunds` | 退款列表 |
| 退款 | GET | `/api/workflow/refund/:id/timeline` | 流程时间线 |
| 站点 | GET | `/api/stations` | 站点概览 |
| 站点 | GET | `/api/stations/dashboard` | 仪表盘统计 |
| 站点 | GET | `/api/stations/:id/anomalies` | 异常检测 |
| 站点 | POST | `/api/stations/:id/escalate` | 紧急升级 |
| 任务 | GET | `/api/tasks/board` | 任务看板 |
| 任务 | GET | `/api/tasks/my` | 我的任务 |
| 任务 | POST | `/api/tasks/:id/assign` | 分配任务 |
| 任务 | POST | `/api/tasks/:id/start` | 开始任务 |
| 任务 | POST | `/api/tasks/:id/complete` | 完成任务 |

## 核心文件索引

### 后端

- [workflow.service.ts](file:///Users/liu/Documents/private/model-test/trae-test-5/backend/src/workflow/workflow.service.ts) - 退款流程核心逻辑
- [workflow.controller.ts](file:///Users/liu/Documents/private/model-test/trae-test-5/backend/src/workflow/workflow.controller.ts) - 退款API
- [station.service.ts](file:///Users/liu/Documents/private/model-test/trae-test-5/backend/src/station/station.service.ts) - 站点与预警
- [task.service.ts](file:///Users/liu/Documents/private/model-test/trae-test-5/backend/src/task/task.service.ts) - 任务调度
- [schema.prisma](file:///Users/liu/Documents/private/model-test/trae-test-5/backend/prisma/schema.prisma) - 数据模型
- [seed.ts](file:///Users/liu/Documents/private/model-test/trae-test-5/backend/prisma/seed.ts) - 种子数据

### 前端

- [Workflow.vue](file:///Users/liu/Documents/private/model-test/trae-test-5/frontend/src/views/Workflow.vue) - 退款申诉工作面
- [BatchReview.vue](file:///Users/liu/Documents/private/model-test/trae-test-5/frontend/src/views/BatchReview.vue) - 批量复核面板
- [Tasks.vue](file:///Users/liu/Documents/private/model-test/trae-test-5/frontend/src/views/Tasks.vue) - 任务看板
- [Stations.vue](file:///Users/liu/Documents/private/model-test/trae-test-5/frontend/src/views/Stations.vue) - 站点管理

## 常见问题

**Q: 前端角色切换是模拟的？**  
A: 是的，为了快速体验三种角色的视角差异。生产环境应对接真实登录系统。

**Q: 批量复核失败了怎么办？**  
A: 接口返回每个条目的成功/失败详情，前端可展示失败项让用户重试。

**Q: 为什么没有真实的图片上传？**  
A: 当前用photoUrl字段占位，生产环境可接入OSS或MinIO。

**Q: 预警能自动触发吗？**  
A: 目前是查询时计算，可加定时任务定期扫描并自动创建任务。

---

*注：本项目为MVP版本，聚焦核心流程而非周边配套。*
