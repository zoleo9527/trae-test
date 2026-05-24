# 家装监理系统 - 主材到场与安装验收管理

## 系统概述

本系统专为家装监理场景设计，实现主材从到货到安装验收的全流程闭环管理。

## 技术栈

- **后端框架**: Express + TypeScript
- **数据库**: SQLite (可替换为 PostgreSQL/MySQL)
- **ORM**: Prisma
- **日志**: Winston
- **验证**: Joi
- **导出**: csv-writer

## 核心特性

### 1. 角色权限体系
- **SUPERVISOR (监理负责人)**: 验收、驳回、状态流转
- **PROJECT_MANAGER (项目管家)**: 创建主材、分配处理、跟进进度
- **CUSTOMER_SERVICE (业主客服)**: 查看、备注、沟通
- **OWNER (业主)**: 查看进度和验收结果

### 2. 主材状态流转
```
PENDING_ARRIVAL → ARRIVED → INSPECTION_PENDING → INSPECTION_PASSED
                                                         ↓
                                                  INSTALLATION_PENDING
                                                         ↓
                                                    INSTALLING
                                                         ↓
                                               INSTALLATION_COMPLETED
                                                      ↙     ↘
                                               ACCEPTED     REJECTED
```

### 3. 验收类型
- **MATERIAL_ARRIVAL**: 到场验收
- **INSTALLATION_QUALITY**: 安装质量验收
- **FINAL_ACCEPTANCE**: 最终验收

### 4. 证据链管理
- 照片 (PHOTO)
- 视频 (VIDEO)
- 文档 (DOCUMENT)
- 签名 (SIGNATURE)

### 5. 安全特性
- 请求日志记录
- 幂等性支持 (x-idempotency-key)
- 操作审计日志
- 字段变更历史
- 异常回查机制

## 快速开始

### 1. 安装依赖
```bash
npm install
```

### 2. 初始化数据库
```bash
npm run prisma:generate
npm run prisma:migrate
```

### 3. 生成种子数据
```bash
npm run prisma:seed
```
种子数据包含：
- 4个测试用户（各角色1个）
- 2个家装项目
- 正常流程样例（实木地板，已验收完成）
- 问题流程样例（定制橱柜，安装验收驳回）
- 5个补充主材数据
- 历史变更日志和审计记录

### 4. 启动服务
```bash
npm run dev
```

服务启动后访问: http://localhost:3000

### 5. 运行API测试
```bash
npm test
```

## API 文档

### 认证方式
所有API需在请求头中携带 `x-user-id`，值为用户ID。

示例:
```bash
curl -H "x-user-id: {user-id}" http://localhost:3000/api/materials
```

### 主材管理

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/materials` | 创建主材 |
| GET | `/api/materials` | 获取主材列表（支持分页、筛选） |
| GET | `/api/materials/:id` | 获取主材详情 |
| PATCH | `/api/materials/:id/status` | 更新主材状态 |
| PATCH | `/api/materials/:id/assign` | 分配处理人 |
| GET | `/api/materials/export` | 导出CSV |

### 验收管理

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/inspections` | 创建验收记录 |
| GET | `/api/inspections/material/:materialId` | 获取主材验收记录 |
| POST | `/api/inspections/:id/reject` | 驳回验收 |
| POST | `/api/inspections/:id/supplement` | 补录说明和证据 |
| POST | `/api/inspections/:id/comments` | 添加评论 |

### 公共接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/users` | 获取用户列表 |
| GET | `/api/projects` | 获取项目列表 |
| GET | `/api/projects/:id` | 获取项目详情 |
| GET | `/api/materials/:id/audit-logs` | 获取审计日志 |
| POST | `/api/materials/:id/comments` | 添加主材评论 |
| POST | `/api/materials/:id/evidences` | 上传主材证据 |

### 筛选与分页

**列表接口支持以下参数**:
- `page`: 页码，默认1
- `pageSize`: 每页数量，默认20
- `projectId`: 按项目筛选
- `status`: 按状态筛选
- `category`: 按分类筛选
- `keyword`: 关键词搜索（名称、品牌、型号）

示例:
```
GET /api/materials?status=INSPECTION_PENDING&category=地板&page=1&pageSize=10
```

## 测试样例说明

### 正常流程（实木地板）
1. 项目管家创建主材记录
2. 主材到货，状态变更为已到货
3. 监理负责人进行到场验收 → 通过
4. 进入安装阶段
5. 安装完成，进行安装质量验收 → 通过
6. 最终验收 → 通过，流程闭环

### 问题流程（定制橱柜）
1. 项目管家创建主材记录
2. 主材到货验收 → 不通过（门板有划痕）
3. 厂家更换后重新验收 → 通过
4. 安装完成
5. 最终验收 → 驳回（台面拼接缝隙过大）
6. 补录整改说明和证据
7. （待重新验收）

## 当前实现取舍

### 已实现
- ✅ 完整的状态流转和校验
- ✅ 角色权限控制
- ✅ 幂等性支持
- ✅ 操作审计日志
- ✅ 字段变更历史
- ✅ 驳回、补录、评论功能
- ✅ 证据链管理
- ✅ 分页、筛选、导出
- ✅ 请求日志
- ✅ 统一异常处理
- ✅ 参数验证

### 简化处理
1. **认证方式**: 使用简单的 x-user-id 头，生产环境应替换为 JWT/OAuth
2. **文件存储**: 证据仅存储URL，需集成实际对象存储
3. **数据库**: 使用SQLite便于测试，生产环境建议PostgreSQL
4. **实时通知**: 未实现WebSocket推送，仅支持被动查询
5. **签名功能**: 签名仅为枚举类型，未实现数字签名
6. **费用管理**: 价格字段预留，费用确认流程未完整实现

## 后续扩展方向

1. **工作流引擎**: 接入正式工作流引擎（如Camunda），支持更复杂的审批流程
2. **消息通知**: 接入短信/邮件/企业微信推送，状态变更实时通知
3. **图片上传**: 集成文件上传，支持本地/云存储
4. **电子签**: 集成第三方电子签服务，实现合法有效的签认
5. **报表统计**: 增加统计分析面板，延期率、驳回率等KPI
6. **移动端**: 开发H5/小程序，支持现场拍照上传
7. **费用模块**: 完整的费用变更和签认流程
8. **版本对比**: 验收版本前后差异可视化对比
9. **SLA管理**: 各环节处理时效监控和预警
10. **多租户**: 支持多公司/多门店独立数据隔离

## 目录结构

```
.
├── prisma/
│   ├── schema.prisma    # 数据模型
│   └── seed.ts          # 种子数据
├── src/
│   ├── middleware/      # 中间件
│   │   ├── auth.ts          # 认证
│   │   ├── errorHandler.ts  # 异常处理
│   │   ├── idempotency.ts   # 幂等处理
│   │   ├── logger.ts        # 请求日志
│   │   └── validation.ts    # 参数验证
│   ├── routes/          # 路由
│   │   ├── material.routes.ts
│   │   ├── inspection.routes.ts
│   │   └── common.routes.ts
│   ├── services/        # 业务服务
│   │   ├── material.service.ts
│   │   ├── inspection.service.ts
│   │   └── audit.service.ts
│   ├── utils/           # 工具
│   │   ├── logger.ts
│   │   └── prisma.ts
│   └── server.ts        # 服务入口
├── scripts/
│   └── test-api.ts      # API测试脚本
└── logs/                # 日志文件
```

## 日志说明

系统日志分为两类文件：
- `logs/error.log`: 错误日志
- `logs/combined.log`: 完整请求日志

每条日志包含：
- 请求ID
- 方法和路径
- 状态码
- 响应时间
- IP地址
- User-Agent
