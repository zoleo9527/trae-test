# 游泳馆运营 - 会员请假与续费提醒 (服务层)

面向前端 / 桌面端的 Go Fiber + PostgreSQL 服务层。围绕「会员请假」「续费提醒」两条主线，把馆长 / 教练主管 / 前台客服三类角色的审批、驳回、备注都落到系统里；关键动作的前后值、操作者、时间点都进了审计表，历史备注、状态变化、责任人在演示数据里都能看到。

## 启动

依赖: Go 1.22+、PostgreSQL 14+。

```bash
# 1. 准备数据库 (本地)
createdb swimclub
# 或用 docker-compose:
docker compose up -d

# 2. 安装依赖
go mod tidy

# 3. 运行服务 (首次启动会自动迁移 + 种子)
DATABASE_URL=postgres://postgres:postgres@localhost:5432/swimclub?sslmode=disable \
JWT_SECRET=dev-secret-at-least-32-bytes-ok \
PORT=8080 \
SEED_ON_BOOT=true \
go run ./cmd/server

# 或者只跑一次迁移+种子
go run ./cmd/seed

# 健康检查
curl http://localhost:8080/healthz
```

## 切角色

种子里固定了三账号（密码均为 `123456`）：

| 角色        | username | 身份                       | 主要动作                                                                 |
| ----------- | -------- | -------------------------- | ------------------------------------------------------------------------ |
| owner       | `owner`  | 馆长                       | 用户管理、审批/驳回/取消请假、所有会员/续费/备注的读写                   |
| coach_head  | `coach`  | 教练主管                   | 审批请假、查看审计、改请假的消课数、维护会员课次                         |
| front_desk  | `front`  | 前台客服                   | 登记请假、创建续费提醒、维护会员信息、记录备注                           |

```bash
# 前台登录
curl -X POST http://localhost:8080/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"front","password":"123456"}'

# 带上返回的 token 再请求业务接口
curl -H 'Authorization: Bearer <token>' http://localhost:8080/api/members
```

`/api/me` 会回显当前登录人的 id / role / name，前端可据此切权限。

## 核心接口

### 会员
- `GET    /api/members?q=&status=` — 列表 + 搜索
- `GET    /api/members/:id`
- `POST   /api/members` — 仅 owner/front_desk
- `PATCH  /api/members/:id` — 仅 owner/front_desk

### 请假
- `GET    /api/leaves?member_id=&status=&from=&to=&limit=`
- `POST   /api/leaves` — 三角色均可登记
- `POST   /api/leaves/:id/approve` — owner / coach_head，事务里同时更新 `members.courses_used`
- `POST   /api/leaves/:id/reject`  — owner / coach_head
- `POST   /api/leaves/:id/cancel`  — 三角色均可

### 续费提醒
- `GET    /api/renewals?member_id=&status=&assigned=&channel=`
- `POST   /api/renewals` — owner / front_desk
- `PATCH  /api/renewals/:id` — 三角色均可（切状态 / 指派 / 写备注）

### 备注 & 审计
- `POST /api/notes` `{target: "member|leave_request|renewal", target_id, content}`
- `GET  /api/notes?target=&target_id=`
- `GET  /api/audit?entity_type=&entity_id=&limit=&offset=`

### 异步任务
创建请假 / 续费提醒时会往 `notification_jobs` 插一条 pending 任务。`internal/notifier` 的 worker 每 5 秒扫一次，把内容打印到日志。真实场景把 `handle` 换成短信 / 微信 / 内部通知网关即可；失败会指数退避，`attempts` / `last_error` 都留痕。

## 哪些边界先做轻了

1. **通知通道是占位**：只打印日志，没有真发 SMS/微信。`notification_jobs.kind` 已分 `leave_created / leave_approved / renewal_created`，扩展时替换 `notifier.handle` 的 switch 即可。
2. **没有附件 / 巡场照片**：水质投诉这类原本靠截图的链路，这里只留了备注与审计；要接图片上传时加一个 `attachments` 表和签名 URL 服务。
3. **没做课程表整合**：请假消课是事务更新 `members.courses_used`，课程安排本身不在本服务。如果要消课算错可追溯，建议把"被扣除的是哪几节课"在 `audit_logs.new_value` 里补上字段。
4. **没有软删除**：直接物理删；会员/请假/提醒删了会连审计留着（外键 `ON DELETE CASCADE` 只在业务表上）。
5. **权限粒度是角色白名单**：没有细到"只能改自己负责的会员"。若前端有教练分组，在查询时加 `assigned_to` / 过滤即可，服务层暂不加复杂 RBAC。
6. **密码策略是 demo 级**：种子里统一 `123456`。上线请开 `bcrypt` 强度、设过期、加二次验证。
7. **没有限流 / 熔断**：单机单机用；上生产请在网关层限流，或加 `fiber/middleware/limiter`。
8. **没有 SSE / WebSocket**：提醒状态更新靠前端轮询；如果要即时推，在 `notification_jobs.status='done'` 成功时往一条 Redis stream 推，前端订阅即可。

## 演示数据要点

- 3 个角色账号、4 个会员，会员 2/4 临近到期。
- 3 条请假：已批准（消课 2 节）、待处理、已驳回。
- 3 条续费提醒：`open / noticed / open`，其中 noticed 那条已指派给前台并写了备注。
- 多条备注横跨 `member / leave_request / renewal`，覆盖水质投诉、驳回说明、前台跟进。
- 审计表里保留了创建会员 / 创建请假 / 会员信息变更等历史，可直接 `GET /api/audit?entity_type=leave_request&entity_id=2` 看链路。
