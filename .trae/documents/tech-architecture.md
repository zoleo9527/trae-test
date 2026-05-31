## 1. 架构设计

```mermaid
flowchart TD
    subgraph 前端
        A["Vue 3 + Vite + TypeScript"]
        B["Pinia 状态管理"]
        C["Vue Router"]
        D["Tailwind CSS"]
    end
    subgraph 状态层
        E["订单 Store"]
        F["排产 Store"]
        G["补做 Store"]
        H["退款 Store"]
        I["复核 Store"]
    end
    subgraph 数据层
        J["Mock 数据模块"]
        K["样例场景集"]
    end
    A --> B
    A --> C
    A --> D
    B --> E
    B --> F
    B --> G
    B --> H
    B --> I
    E --> J
    F --> J
    G --> J
    H --> J
    I --> J
    J --> K
```

## 2. 技术说明

- 前端：Vue 3 + Vite + TypeScript + Tailwind CSS
- 初始化工具：vite-init（vue-ts 模板）
- 状态管理：Pinia（Vue 3 官方推荐）
- 路由：Vue Router 4
- 后端：无（纯前端 + Mock 数据）
- 数据库：无（内存数据 + localStorage 持久化）

## 3. 路由定义

| 路由 | 用途 |
|-------|---------|
| / | 工作面主页，角色自适应工作台 |
| /orders | 预订单管理 + 改单追踪 |
| /schedule | 产能排期表 |
| /pickup | 到店自提核销 |
| /remake | 异常补做工单 |
| /refund | 退款追溯 + 损耗复盘 |

## 4. 数据模型

### 4.1 数据模型定义

```mermaid
erDiagram
    ORDER ||--o{ ORDER_CHANGE : has
    ORDER ||--o{ SCHEDULE_ITEM : scheduled_as
    ORDER ||--o{ PICKUP : picked_up_as
    ORDER ||--o{ REMAKE_TICKET : remake_from
    ORDER ||--o| REFUND : refund_as
    ORDER_CHANGE ||--o{ SCHEDULE_ITEM : affects
    REMAKE_TICKET ||--o{ MATERIAL_LOSS : records
    REMAKE_TICKET ||--o{ SCHEDULE_ITEM : rescheduled_as
    REFUND ||--o{ REFUND_TRACE : traces

    ORDER {
        string id PK
        string customerName
        string phone
        string[] items
        number totalPrice
        string status
        string pickupDate
        string pickupTime
        string createdAt
        string role
    }
    ORDER_CHANGE {
        string id PK
        string orderId FK
        string changeType
        string oldValue
        string newValue
        string reason
        boolean pushedToSchedule
        string createdAt
    }
    SCHEDULE_ITEM {
        string id PK
        string orderId FK
        string date
        string timeSlot
        string station
        string status
        boolean isChanged
        boolean isRemake
        string remakeTicketId FK
    }
    PICKUP {
        string id PK
        string orderId FK
        string status
        string verifiedAt
        string verifiedBy
    }
    REMAKE_TICKET {
        string id PK
        string orderId FK
        string reason
        string category
        string status
        string createdAt
        string completedAt
    }
    MATERIAL_LOSS {
        string id PK
        string remakeTicketId FK
        string materialName
        number quantity
        string unit
        number cost
        string recordedBy
        string recordedAt
    }
    REFUND {
        string id PK
        string orderId FK
        number amount
        string reason
        string status
        string approvedBy
        string createdAt
        string completedAt
    }
    REFUND_TRACE {
        string id PK
        string refundId FK
        string traceType
        string traceTargetId
        string summary
    }
```

### 4.2 状态流转定义

**订单状态**：pending → confirmed → scheduled → producing → completed | exception
**自提状态**：waiting → notified → verified → completed
**补做工单状态**：open → scheduled → producing → completed → closed
**退款状态**：requested → tracing → approved → completed | rejected

## 5. 项目目录结构

```
src/
├── stores/           # Pinia stores
│   ├── order.ts
│   ├── schedule.ts
│   ├── remake.ts
│   ├── refund.ts
│   └── review.ts
├── composables/      # 可复用组合式函数
│   ├── useRole.ts
│   └── useFlowLink.ts
├── components/       # 通用组件
│   ├── BatchReviewPanel.vue
│   ├── FlowTimeline.vue
│   ├── RoleHeader.vue
│   ├── StatusBadge.vue
│   └── TraceCard.vue
├── pages/            # 页面组件
│   ├── Workspace.vue
│   ├── Orders.vue
│   ├── ScheduleBoard.vue
│   ├── Pickup.vue
│   ├── Remake.vue
│   └── Refund.vue
├── data/             # Mock 数据与样例
│   ├── mockOrders.ts
│   ├── mockSchedules.ts
│   ├── mockRemakes.ts
│   ├── mockRefunds.ts
│   └── scenarios.ts
├── types/            # TypeScript 类型定义
│   └── index.ts
├── router/
│   └── index.ts
├── App.vue
└── main.ts
```
