# 留学服务系统 - 后端服务

基于 NestJS + Postgres 构建的留学服务管理系统，核心功能包括：退款协商、顾问交接、材料管理、进度追踪。

## 🚀 快速启动

### 前置要求
- Node.js 18+
- PostgreSQL 14+
- npm 或 yarn

### 1. 安装依赖
```bash
cd backend
npm install
```

### 2. 配置数据库
确保 PostgreSQL 已启动，修改 `.env` 文件中的数据库连接信息：
```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=study_abroad
```

创建数据库（如果不存在）：
```sql
CREATE DATABASE study_abroad;
```

### 3. 填充演示数据
```bash
npm run seed
```

### 4. 启动服务
```bash
# 开发模式
npm run start:dev

# 生产模式
npm run build
npm run start:prod
```

服务将运行在 http://localhost:3001

## 📚 API 文档

启动服务后访问 Swagger 文档：
- http://localhost:3001/api

## 👥 角色说明

| 角色 | 角色编码 | 说明 |
|------|---------|------|
| 顾问主管 | `consultant_director` | 审批退款、分配顾问、全局管理 |
| 顾问 | `consultant` | 对接学生、推进申请进度 |
| 文案老师 | `copywriter` | 负责文书撰写和修改 |
| 签证助理 | `visa_assistant` | 负责签证材料和流程 |

### 演示账号

所有接口通过 `operatorId` 和 `operatorName` 参数识别操作者：

| 姓名 | 角色 | operatorId |
|------|------|------------|
| 张主管 | 顾问主管 | `11111111-1111-1111-1111-111111111111` |
| 李顾问 | 顾问 | `22222222-2222-2222-2222-222222222222` |
| 王顾问 | 顾问 | `33333333-3333-3333-3333-333333333333` |
| 陈文案 | 文案老师 | `44444444-4444-4444-4444-444444444444` |
| 刘签证 | 签证助理 | `55555555-5555-5555-5555-555555555555` |

## 🎯 核心业务场景

### 1. 退款协商流程
```
DRAFT(草稿) → SUBMITTED(已提交) → UNDER_REVIEW(审核中)
     ↓                ↓                ↓
     └─── REJECTED(已驳回) ───┘      ↓
                                      ↓
                                APPROVED(已批准)
                                      ↓
                                PROCESSING(处理中)
                                      ↓
                                COMPLETED(已完成)
```

### 2. 顾问交接流程
```
INITIATED(已发起) → HANDOVER_IN_PROGRESS(交接中)
       ↓                    ↓
       └── REJECTED(已驳回) ─┘
                            ↓
                      PENDING_RECEIPT(待接收)
                            ↓
                      RECEIVED(已接收)
                            ↓
                      COMPLETED(已完成)
```

### 3. 材料审核流程
```
DRAFT(草稿) → SUBMITTED(已提交) → UNDER_REVIEW(审核中)
     ↓                               ↓
     └─────────────────── NEEDS_REVISION(需修改)
                                     ↓
                               APPROVED(已通过)
                                     ↓
                               EXPIRED(已过期)
```

## 📊 数据模型关系

```
学生 (Student)
    ↓ 1:N
工单 (WorkOrder) ←────┐
    ├─→ 退款 (Refund)   │
    ├─→ 交接 (Transfer) │
    ├─→ 材料 (Material) ──→ 材料版本 (MaterialVersion)
    ├─→ 备注 (Comment)
    └─→ 截止日 (Deadline)

顾问 (Consultant)
    ├─ 负责工单
    ├─ 发起/审批退款
    ├─ 交接双方
    └─ 材料责任人
```

## 🔍 核心接口示例

### 1. 获取工单详情（全链路视角）
```http
GET /work-orders/dddddddd-dddd-dddd-dddd-dddddddddddd
```
返回内容包含：
- 学生信息、当前顾问、历史顾问
- 退款协商记录（含审批人、备注）
- 顾问交接记录（含交接双方、交接清单、评论）
- 材料列表（含版本历史、责任人、备注）
- 截止日提醒（含责任人、状态）
- 工单备注
- **全链路审计时间线**（工单+退款+交接+材料+备注+截止日的所有操作记录）

### 2. 创建退款申请
```http
POST /refunds
Content-Type: application/json

{
  "workOrderId": "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee",
  "requestedAmount": 15000,
  "reason": "学生决定放弃留学",
  "operatorId": "33333333-3333-3333-3333-333333333333",
  "operatorName": "王顾问"
}
```

### 3. 审批退款
```http
PUT /refunds/10101010-1010-1010-1010-101010101010/status
Content-Type: application/json

{
  "status": "approved",
  "approvedAmount": 12000,
  "reviewerId": "11111111-1111-1111-1111-111111111111",
  "operatorId": "11111111-1111-1111-1111-111111111111",
  "operatorName": "张主管"
}
```

### 4. 创建顾问交接
```http
POST /transfers
Content-Type: application/json

{
  "workOrderId": "ffffffff-ffff-ffff-ffff-ffffffffffff",
  "fromConsultantId": "33333333-3333-3333-3333-333333333333",
  "toConsultantId": "22222222-2222-2222-2222-222222222222",
  "handoverContent": "详细交接内容...",
  "keyNotes": "注意事项...",
  "operatorId": "11111111-1111-1111-1111-111111111111",
  "operatorName": "张主管"
}
```

### 5. 上传材料新版本
```http
POST /materials/30303030-3030-3030-3030-303030303030/versions
Content-Type: application/json

{
  "fileUrl": "/files/ps-v3.pdf",
  "changeLog": "修改了职业规划部分",
  "operatorId": "44444444-4444-4444-4444-444444444444",
  "operatorName": "陈文案"
}
```

### 6. 查看审计日志
```http
# 按实体查看
GET /audit-logs/entity/WorkOrder/:workOrderId

# 按操作者查看
GET /audit-logs/operator/:operatorId
```

## ⚠️ 当前边界（轻量实现）

### 已实现
- ✅ 核心数据模型和关系
- ✅ 状态机流转校验
- ✅ 审计日志（前后值、变更字段、操作者、时间）
- ✅ 材料版本管理
- ✅ 截止日追踪
- ✅ 多维度备注
- ✅ 演示数据

### 待增强
- ❌ 用户认证和权限控制（当前通过 operatorId 模拟）
- ❌ 文件上传（当前用 fileUrl 字符串）
- ❌ 邮件/消息通知
- ❌ 复杂报表统计
- ❌ 批量操作
- ❌ 数据导出

### 设计权衡
1. **审计日志**：使用 jsonb 存储前后值，查询灵活但存储空间较大
2. **状态机**：纯内存实现简单高效，复杂场景可换用成熟库
3. **备注系统**：单表多态关联（workOrderId/refundId/transferId/materialId），减少表数量
4. **材料版本**：独立表存储历史版本，支持完整追溯

## 🛠️ 开发命令

```bash
# 开发模式
npm run start:dev

# 构建
npm run build

# 代码格式化
npm run format

# 代码检查
npm run lint

# 填充演示数据
npm run seed
```

## 📁 目录结构

```
backend/
├── src/
│   ├── common/
│   │   ├── enums/           # 枚举定义
│   │   ├── errors/          # 错误处理
│   │   ├── filters/         # 过滤器
│   │   ├── state-machines/  # 状态机
│   │   └── dto/             # 通用DTO
│   ├── modules/
│   │   ├── student/         # 学生模块
│   │   ├── consultant/      # 顾问模块
│   │   ├── work-order/      # 工单模块
│   │   ├── refund/          # 退款模块
│   │   ├── transfer/        # 交接模块
│   │   ├── material/        # 材料模块
│   │   ├── comment/         # 备注模块
│   │   ├── deadline/        # 截止日模块
│   │   └── audit/           # 审计模块
│   ├── database/
│   │   └── seeder.ts        # 演示数据
│   ├── app.module.ts
│   └── main.ts
├── package.json
├── tsconfig.json
└── .env
```
