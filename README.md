# 光伏运维系统 - 备件领用与停机复盘

## 项目概述

针对光伏运维场景中"备件领用与停机复盘"流程分散的问题，实现了一个完整的闭环管理系统。通过统一的工作面板，让站长、巡检工程师、运维内勤等角色能够在同一条工作流中完成从异常上报到复盘验证的全流程处理。

## 技术栈

### 后端
- **框架**: NestJS 10.x
- **数据库**: PostgreSQL
- **ORM**: TypeORM 0.3.x
- **特性**: 状态机、事务、分页筛选、CSV导出

### 前端
- **框架**: React 18 + TypeScript
- **构建工具**: Vite 5.x
- **UI组件**: Ant Design 5.x
- **路由**: React Router 6.x

## 核心业务流程

```
异常上报 → 停机确认 → 备件申请 → 备件审批 → 备件签收 → 维修完成 → 复盘提交 → 复盘验证 → 工单关闭
    │           │           │           │           │           │           │           │
    └─巡检      └─站长       └─巡检       └─运维       └─巡检       └─巡检       └─巡检       └─站长
      工程师                    工程师       内勤         工程师       工程师       工程师
```

## 快速开始

### 环境要求
- Node.js >= 18.x
- PostgreSQL >= 14.x
- npm 或 yarn

### 数据库准备
```sql
CREATE DATABASE pv_operation;
```

### 安装依赖
```bash
# 安装根目录依赖
npm install

# 安装后端依赖
cd backend && npm install

# 安装前端依赖
cd ../frontend && npm install
```

### 配置环境变量
编辑 `backend/.env` 文件：
```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_DATABASE=pv_operation
PORT=3001
```

### 填充种子数据
```bash
cd backend
npm run seed
```

### 启动服务
```bash
# 启动后端 (端口 3001)
cd backend
npm run start:dev

# 启动前端 (端口 3000)
cd ../frontend
npm run dev
```

### 访问地址
- 前端: http://localhost:3000
- 后端API: http://localhost:3001

## API 接口说明

### 工单管理 (Work Orders)
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/work-orders` | 获取工单列表（支持分页、筛选） |
| GET | `/api/work-orders/:id` | 获取工单详情 |
| POST | `/api/work-orders` | 创建工单 |
| PUT | `/api/work-orders/:id` | 更新工单 |
| POST | `/api/work-orders/:id/transition` | 状态流转 |
| PUT | `/api/work-orders/:id/assign-handler` | 分配处理人 |
| GET | `/api/work-orders/statistics` | 获取统计数据 |
| GET | `/api/work-orders/export` | 导出CSV |

### 停机记录 (Downtime)
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/downtime` | 获取停机记录列表 |
| POST | `/api/downtime` | 创建停机记录 |
| POST | `/api/downtime/:id/confirm` | 确认停机 |

### 备件管理 (Spare Parts)
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/spare-parts` | 获取备件列表 |
| POST | `/api/spare-parts` | 新增备件 |
| GET | `/api/part-usages` | 获取领用记录 |
| POST | `/api/part-usages` | 申请领用 |
| POST | `/api/part-usages/:id/approve` | 审批领用 |
| POST | `/api/part-usages/:id/receive` | 签收备件 |

### 复盘记录 (Reviews)
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/reviews` | 获取复盘列表 |
| POST | `/api/reviews` | 创建复盘 |
| POST | `/api/reviews/:id/verify` | 验证复盘 |

## 测试数据说明

### 测试用户

| 用户名 | 姓名 | 角色 | 职责 |
|--------|------|------|------|
| zhangsan | 张三 | 站长 | 停机确认、复盘验证、工单关闭 |
| lisi | 李四 | 巡检工程师 | 异常上报、备件申请、维修完成、复盘提交 |
| wangwu | 王五 | 巡检工程师 | 光伏B站负责 |
| zhaoliu | 赵六 | 运维内勤 | 备件审批 |

### 样例工单（正常流）
**WO202405200001 - 1号逆变器告警停机**
- 状态: 已关闭
- 流程: 完整走完所有8个状态
- 包含: 停机记录、备件领用（逆变器模块 x1）、完整复盘记录

### 样例工单（问题流）
**WO202405230002 - 暴雨天气全站停机**
- 状态: 异常上报
- 说明: 展示待处理状态的工单

## 实现取舍点

### 1. 状态机设计
**选择**: 采用硬编码状态流转矩阵（WorkOrderStatusFlow）
- ✅ 优点: 性能好、逻辑清晰、容易理解
- ❌ 缺点: 动态调整需要改代码
- **取舍理由**: 运维流程相对固定，不需要频繁调整状态流

### 2. 用户认证
**选择**: 当前版本简化实现，未集成完整的RBAC权限体系
- ✅ 优点: 快速交付、降低复杂度
- ❌ 缺点: 需要手动传入用户ID
- **取舍理由**: 先保证业务流程完整性，认证可以后续模块化接入

### 3. 数据库设计
**选择**: 单表继承 vs 多表关联
- ✅ 优点: 查询灵活、便于统计分析
- ❌ 缺点: 关联查询较多
- **取舍理由**: 复盘需要聚合停机时长、备件成本等多维度数据

### 4. 前端架构
**选择**: Ant Design 组件库 + 轻量状态管理
- ✅ 优点: 开发效率高、UI一致性好
- ❌ 缺点: 包体积稍大
- **取舍理由**: 内部管理系统对开发效率要求高于加载速度

## 后续可扩展位置

### 🔴 高优先级
1. **用户认证与权限控制**
   - 集成 JWT/OAuth2 认证
   - 基于角色的按钮级权限控制
   - 数据权限隔离（按电站、按角色）

2. **WebSocket 实时通知**
   - 状态变更推送
   - 待办事项提醒
   - 站内消息中心

3. **报表与看板**
   - 停机时长趋势分析
   - 备件消耗统计
   - 故障率按设备/电站排行
   - MTTR（平均修复时间）统计

### 🟡 中优先级
4. **附件管理**
   - 告警截图上传
   - 维修现场照片
   - Excel批量导入

5. **工作流引擎**
   - 可视化流程设计
   - 条件分支支持
   - 会签/或签

6. **移动端适配**
   - 小程序/APP
   - 扫码领料
   - 离线提交

### 🟢 低优先级
7. **第三方系统集成**
   - 接入SCADA实时数据
   - ERP备件库存同步
   - 财务系统对接

8. **AI辅助功能**
   - 故障根因推荐
   - 备件需求预测
   - 智能巡检路线规划

## 项目结构

```
.
├── backend/                    # NestJS 后端
│   ├── src/
│   │   ├── common/            # 公共模块
│   │   │   ├── enums/         # 枚举定义
│   │   │   ├── dto/           # 数据传输对象
│   │   │   └── filters/       # 异常过滤器
│   │   ├── entities/          # TypeORM 实体
│   │   ├── modules/           # 业务模块
│   │   │   ├── work-order/    # 工单模块
│   │   │   ├── downtime/      # 停机记录
│   │   │   ├── spare-part/    # 备件管理
│   │   │   ├── review/        # 复盘记录
│   │   │   └── user/          # 用户管理
│   │   ├── database/          # 数据库相关
│   │   ├── app.module.ts
│   │   └── main.ts
│   ├── package.json
│   └── .env
├── frontend/                  # React 前端
│   ├── src/
│   │   ├── pages/            # 页面组件
│   │   ├── services/         # API 服务
│   │   ├── types/            # TypeScript 类型
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   └── vite.config.ts
└── package.json              # 根目录 workspaces 配置
```

## 核心文件索引

- 状态机定义: [work-order.enum.ts](backend/src/common/enums/work-order.enum.ts#L23-L32)
- 工单状态流转: [work-order.service.ts](backend/src/modules/work-order/work-order.service.ts#L139-L176)
- 备件审批逻辑: [spare-part.service.ts](backend/src/modules/spare-part/spare-part.service.ts#L112-L150)
- 复盘验证闭环: [review.service.ts](backend/src/modules/review/review.service.ts#L105-L131)
- 种子数据: [seed.ts](backend/src/database/seed.ts)
- 工单详情页: [WorkOrderDetail.tsx](frontend/src/pages/WorkOrderDetail.tsx)

## 常见问题

**Q: 如何查看API文档？**
A: 可以访问 http://localhost:3001/api 查看 Swagger 文档（需安装 @nestjs/swagger）

**Q: 数据库同步失败怎么办？**
A: 删除数据库后重新创建，或者关闭 synchronize 改用 migration

**Q: 如何修改状态流转规则？**
A: 修改 `backend/src/common/enums/work-order.enum.ts` 中的 WorkOrderStatusFlow 配置
