# 钟表售后 - 寄修登记与进度回传系统

## 项目概述

解决钟表售后寄修登记、报价确认、维修进度回传分散在多套表单/系统导致效率低、追责难的问题。将寄修登记、进度流转、配件锁定、满意度回传统一到一条链路，支持批量操作和全量审计。

## 技术栈

- **后端**: Go Fiber + GORM + PostgreSQL + JWT
- **前端**: Next.js 14 (App Router) + Tailwind CSS + Zustand + Lucide Icons

## 启动方式

### 前置条件

- Go 1.21+
- Node.js 18+ / pnpm
- PostgreSQL 14+

### 1. 准备数据库

```bash
createdb watch_after_sales
```

### 2. 启动后端

```bash
cd backend
cp .env.example .env   # 按需修改数据库连接信息
go run main.go
```

后端启动后会自动：
- 迁移数据库表（8 张表）
- 填充种子数据（如数据库为空）
- 启动定时任务（回访逾期检测/库存告警/维修超时检测）

后端默认监听 `http://localhost:8080`

### 3. 启动前端

```bash
cd frontend
pnpm install
pnpm dev
```

前端默认监听 `http://localhost:3000`，浏览器打开即可使用。

## 测试账号

| 角色 | 用户名 | 密码 | 权限说明 |
|------|--------|------|----------|
| 售后经理 | manager | admin123 | 全部权限，含审计日志查看 |
| 接件顾问 | consultant | cons123 | 登记工单、发送报价、确认报价、确认取件 |
| 维修技师 | technician | tech123 | 开始诊断、开始维修、标记完工 |

## 状态流转

```
registered → diagnosing → quoted → confirmed → repairing → completed → picked_up
                              │
                              └→ registered（客户拒绝报价）
```

- 技师操作：→ diagnosing / → repairing / → completed
- 顾问/经理操作：→ quoted / → confirmed / → picked_up
- 客户拒绝：quoted → registered（顾问/经理操作）
- 完工自动触发：3天后满意度回访排程

## API 概览

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/auth/login | 登录获取 JWT |
| POST | /api/repairs | 创建寄修工单 |
| GET | /api/repairs | 工单列表（支持筛选/分页） |
| GET | /api/repairs/:id | 工单详情 |
| PATCH | /api/repairs/:id | 更新工单信息 |
| POST | /api/repairs/:id/status | 状态流转 |
| POST | /api/repairs/batch-status | 批量状态变更 |
| GET/POST/PATCH | /api/parts/* | 配件管理 |
| POST/DELETE | /api/repairs/:id/lock-part | 配件锁定/释放 |
| GET | /api/audit-logs | 审计日志 |
| POST/GET/PATCH | /api/callbacks/* | 回访管理 |
| GET | /api/exports/repairs/csv | 导出工单 CSV |

## 异常处理

接口返回统一错误格式：`{code, message, type}`

| type | HTTP 状态码 | 触发场景 |
|------|-------------|----------|
| validation | 400 | 参数缺失/格式错误 |
| unauthorized | 401 | 未登录或 token 过期 |
| unauthorized | 403 | 角色权限不足 |
| conflict | 409 | 状态流转非法（如从 completed → diagnosing） |
| not_found | 404 | 资源不存在 |
| internal | 500 | 服务端异常 |

## 种子数据中的异常用例

种子数据刻意包含以下可触发异常的场景：

1. **配件锁定超额**：机芯(MVMT-001) locked_quantity=15 > quantity=10，游丝(HSPR-001) locked_quantity=10 > quantity=8 → 再次锁定时会触发 conflict 错误
2. **非法状态转换审计**：审计日志中有一条 completed → diagnosing 的失败尝试记录（operator: 王技师）
3. **逾期回访**：工单 WX-...（宝珀指针脱落）有一条 scheduled_at 在 72 小时前且未完成的满意度回访
4. **库存耗尽配件**：齿轮组(GEAR-001) quantity=5, locked_quantity=5, min_quantity=2 → 可用数为 0，触发低库存告警

## 刻意简化掉的部分

- **多租户/门店隔离**：当前为单门店模型，未做组织层级
- **文件/图片上传**：寄修照片、维修前后对比图未实现，仅存文本描述
- **消息推送**：状态变更通知暂无 WebSocket/短信/邮件通道，仅后台定时检测
- **客户自助门户**：客户无法自行查询进度，需顾问电话/微信告知
- **财务对账**：报价与实收脱节，未做支付/开票集成
- **数据备份策略**：未实现自动备份，需依赖 PostgreSQL 运维方案

## 项目结构

```
watch-after-sales/
├── backend/
│   ├── main.go              # 入口，组装路由和依赖
│   ├── config/              # 配置加载（.env）
│   ├── database/            # 数据库连接和迁移
│   ├── model/               # GORM 模型（8 个实体）
│   ├── dto/                 # 请求/响应 DTO
│   ├── errors/              # 统一错误类型
│   ├── middleware/           # JWT 鉴权 + RBAC
│   ├── service/             # 业务服务层
│   ├── handler/             # HTTP 处理器
│   ├── seed/                # 种子数据
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── app/             # Next.js 页面路由
│   │   ├── components/      # 共享组件
│   │   ├── lib/             # API 客户端 + 工具函数
│   │   └── store/           # Zustand 状态管理
│   └── ...
└── README.md
```
