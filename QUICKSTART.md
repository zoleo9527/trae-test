# 展会搭建-供应商对账与付款申请系统

## 快速开始

### 1. 初始化数据库

```bash
# 生成 Prisma Client
npm run prisma:generate

# 执行数据库迁移
npm run prisma:migrate --name init

# 导入演示数据
npm run prisma:seed
```

### 2. 启动服务

```bash
# 开发模式启动
npm run dev

# 生产模式
npm run build && npm start
```

服务运行在: http://localhost:3000

## 测试账号

| 用户名 | 密码 | 角色 | 说明 |
|--------|------|------|------|
| admin | 123456 | 系统管理员 | 全部权限 |
| coordinator | 123456 | 项目统筹 | 项目管理、对账审批 |
| executive | 123456 | 现场执行 | 创建对账、提交 |
| supplier | 123456 | 供应商对接 | 查看对账付款 |
| finance | 123456 | 财务 | 付款审批、付款 |

## 主要API列表

### 认证
- POST /api/auth/login - 登录
- GET /api/auth/me - 获取当前用户

### 项目
- GET /api/projects/dashboard - 仪表盘统计
- GET /api/projects - 项目列表
- POST /api/projects - 创建项目
- GET /api/projects/:id - 项目详情
- PUT /api/projects/:id - 更新项目
- POST /api/projects/:id/suppliers - 添加供应商
- POST /api/projects/:id/comments - 添加备注
- GET /api/projects/suppliers - 供应商列表

### 对账
- GET /api/reconciliations - 对账列表
- POST /api/reconciliations - 创建对账
- GET /api/reconciliations/:id - 对账详情
- PUT /api/reconciliations/:id - 更新对账
- POST /api/reconciliations/:id/submit - 提交对账
- POST /api/reconciliations/:id/approve - 审批通过
- POST /api/reconciliations/:id/reject - 驳回
- POST /api/reconciliations/:id/revise - 退回修改
- POST /api/reconciliations/:id/comments - 添加备注
- GET /api/reconciliations/:id/audit-logs - 审计日志

### 付款
- GET /api/payments - 付款列表
- POST /api/payments - 创建付款
- GET /api/payments/:id - 付款详情
- POST /api/payments/:id/approve - 审批通过
- POST /api/payments/:id/paid - 标记付款
- POST /api/payments/:id/reject - 驳回
- POST /api/payments/:id/comments - 添加备注
- GET /api/payments/:id/audit-logs - 审计日志

## 核心特性

### 对账&付款联动
- 对账审批通过后才能创建付款申请
- 付款完成后自动标记对账为已完成
- 驳回原因、修改说明全程记录

### 审计追踪
- 所有关键操作记录审计日志
- 支持字段级变更追踪
- 记录操作人、时间、IP

### 权限边界
- 不同角色看到不同信息
- 供应商角色过滤敏感审计日志

### 幂等支持
- 请求头 `x-idempotency-key` 保证幂等

### 异常处理
- 统一错误处理
- 操作状态流转校验

## 边界说明（当前版本做轻处理的部分）

1. **审批流程
- 当前为单级审批，后续可扩展多级审批
- 审批人未做细分权限细分，按角色控制

2. **财务模块
- 未对接实际银行信息未对接
- 未接入真实支付网关

3. **通知系统
- 未实现邮件/消息通知
- 仅靠系统内备注沟通

4. **报表导出
- 未实现统计报表
- 未实现Excel导出

5. **附件上传
- 未实现文件上传
- 后续可扩展

6. **工作流引擎
- 当前为硬编码状态流转
- 后续可接入工作流
