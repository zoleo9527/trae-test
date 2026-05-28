# 游学营地管理系统

《游学营地-营员报名与分房排班》管理系统后端服务

## 技术栈

- **Web框架**: Go Fiber v2
- **数据库**: PostgreSQL
- **ORM**: GORM
- **认证**: JWT + RBAC
- **Excel导出**: excelize

## 项目结构

```
camp-management/
├── internal/
│   ├── api/
│   │   ├── handler/      # API处理层
│   │   ├── middleware/   # 中间件
│   │   └── router.go     # 路由配置
│   ├── async/            # 异步任务队列
│   ├── model/            # 数据模型
│   ├── repository/       # 数据访问层
│   └── service/          # 业务服务层
├── pkg/
│   ├── config/           # 配置管理
│   └── database/         # 数据库连接和初始化
├── .env                  # 环境配置
├── go.mod
├── main.go
└── README.md
```

## 启动方式

### 前置要求

1. Go 1.21+
2. PostgreSQL 12+

### 步骤

1. **配置数据库连接**

   复制 `.env.example` 到 `.env` 并修改数据库配置：

   ```bash
   cp .env.example .env
   ```

   编辑 `.env` 文件：

   ```env
   DB_HOST=localhost
   DB_PORT=5432
   DB_USER=postgres
   DB_PASSWORD=your_password
   DB_NAME=camp_management
   JWT_SECRET=your-secret-key-change-in-production
   SERVER_HOST=0.0.0.0
   SERVER_PORT=8080
   ASYNC_WORKER_COUNT=3
   ```

2. **创建数据库**

   ```sql
   CREATE DATABASE camp_management;
   ```

3. **安装依赖**

   ```bash
   go mod tidy
   ```

4. **编译运行**

   ```bash
   go build -o camp-management .
   ./camp-management
   ```

   或者直接运行：

   ```bash
   go run main.go
   ```

5. **访问服务**

   服务启动后访问 `http://localhost:8080`

## 测试账号

系统启动时会自动创建演示数据，包含以下测试账号：

| 用户名     | 密码       | 角色       | 权限范围                     |
|------------|------------|------------|------------------------------|
| director   | camp123456 | 营地主任   | 全部权限，可查看审计日志     |
| teacher1   | camp123456 | 班务老师   | 营员管理、活动签到、医疗上报 |
| teacher2   | camp123456 | 班务老师   | 营员管理、活动签到、医疗上报 |
| logistics1 | camp123456 | 后勤协调   | 房间管理、物资审批与发放     |

### 登录示例

```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"director","password":"camp123456"}'
```

返回：

```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid",
    "username": "director",
    "name": "营地主任-张明",
    "role": "director"
  }
}
```

后续请求需要在Header中携带：

```
Authorization: Bearer {token}
```

## API接口

### 认证接口

- `POST /api/auth/login` - 登录
- `GET /api/auth/me` - 获取当前用户信息

### 营地管理

- `POST /api/camps` - 创建营地（主任）
- `GET /api/camps` - 营地列表
- `GET /api/camps/:id` - 营地详情
- `PATCH /api/camps/:id/status` - 更新营地状态（主任）

### 营员管理

- `POST /api/campers` - 创建营员
- `POST /api/campers/batch` - 批量创建营员
- `GET /api/campers/search/:campId` - 搜索营员
- `GET /api/campers/:id` - 营员详情
- `PATCH /api/campers/:id/status` - 更新营员状态
- `GET /api/campers/without-room/:campId` - 未分房营员
- `POST /api/campers/assign-room` - 分配房间
- `POST /api/campers/batch-assign-room` - 批量分配房间（异步）
- `DELETE /api/campers/:id/room` - 取消分房

### 房间管理

- `POST /api/rooms` - 创建房间（主任/后勤）
- `POST /api/rooms/batch` - 批量创建房间（主任/后勤）
- `GET /api/rooms/camp/:campId` - 营地房间列表
- `GET /api/rooms/available/:campId` - 可用房间列表
- `GET /api/rooms/stats/:campId` - 房间统计
- `GET /api/rooms/:id` - 房间详情

### 报名管理

- `POST /api/registrations` - 创建报名
- `GET /api/registrations/:id` - 报名详情
- `GET /api/registrations/camp/:campId` - 营地报名列表
- `POST /api/registrations/:id/confirm` - 确认报名
- `POST /api/registrations/:id/paid` - 标记已支付
- `POST /api/registrations/:id/cancel` - 取消报名

### 活动管理

- `POST /api/activities` - 创建活动（主任/老师）
- `POST /api/activities/batch` - 批量创建活动（主任/老师）
- `GET /api/activities/camp/:campId` - 营地活动列表
- `GET /api/activities/:id` - 活动详情
- `POST /api/activities/checkin` - 活动签到
- `POST /api/activities/batch-checkin` - 批量签到
- `GET /api/activities/:id/attendances` - 活动签到记录
- `GET /api/activities/camper/:camperId` - 营员签到记录

### 医疗记录

- `POST /api/medical` - 创建医疗记录
- `GET /api/medical/:id` - 医疗记录详情
- `GET /api/medical/camp/:campId` - 营地医疗记录
- `GET /api/medical/camper/:camperId` - 营员医疗记录
- `POST /api/medical/:id/resolve` - 标记已解决
- `POST /api/medical/:id/notify-parent` - 通知家长

### 物资申请

- `POST /api/supply` - 创建物资申请
- `GET /api/supply/:id` - 物资申请详情
- `GET /api/supply/camp/:campId` - 营地物资申请
- `POST /api/supply/:id/approve` - 审批通过（主任/后勤）
- `POST /api/supply/:id/reject` - 审批拒绝（主任/后勤）
- `POST /api/supply/:id/issue` - 发放物资（后勤）

### 审计日志

- `GET /api/audit` - 审计日志（主任）
- `GET /api/audit/resource/:resourceType/:resourceId` - 资源审计记录（主任）
- `GET /api/audit/my` - 我的操作日志（主任）

### 数据导出

- `GET /api/export/campers/:campId` - 导出营员数据（异步）
- `GET /api/export/registrations/:campId` - 导出报名数据（异步）
- `GET /api/export/tasks/my` - 我的导出任务
- `GET /api/export/tasks/:id` - 导出任务详情

### 任务查询

- `GET /api/tasks/my` - 我的任务
- `GET /api/tasks/:id` - 任务详情

## 错误码说明

| HTTP状态码 | 错误码 | 说明 |
|-----------|--------|------|
| 400 | INVALID_REQUEST | 请求参数错误 |
| 400 | INVALID_ID | 无效的ID格式 |
| 401 | INVALID_CREDENTIALS | 用户名或密码错误 |
| 401 | INVALID_TOKEN | Token无效 |
| 403 | FORBIDDEN | 权限不足 |
| 404 | NOT_FOUND | 资源不存在 |
| 409 | ALREADY_ASSIGNED | 已分配房间 |
| 409 | GENDER_MISMATCH | 性别不匹配 |
| 409 | ROOM_FULL | 房间已满 |
| 409 | CAMP_FULL | 营地已满 |
| 409 | INVALID_STATUS | 状态无效 |
| 409 | ALREADY_RESOLVED | 已处理 |
| 409 | ALREADY_NOTIFIED | 已通知 |
| 500 | INTERNAL_ERROR | 服务器内部错误 |

## 演示数据中的异常场景

系统预置了以下可直接触发异常处理的测试场景：

### 1. 分房冲突场景

- **201房间（女生）**：4个床位已全部住满 → 分配时触发 `ROOM_FULL`
- **陈小明、李小华、王小刚**：已入住101房间 → 再次分配触发 `ALREADY_ASSIGNED`
- **刘小美**：未分配房间 → 可正常测试分房流程

### 2. 性别不匹配场景

- **赵小强（男）**：尝试分配到201女生房间 → 触发 `GENDER_MISMATCH`
- **张小红（女）**：尝试分配到101男生房间 → 触发 `GENDER_MISMATCH`

### 3. 医疗记录处理

- **王小刚腹痛记录**：处理中状态，已通知家长 → 重复通知触发 `ALREADY_NOTIFIED`
- **李小华哮喘记录**：已解决 → 重复解决触发 `ALREADY_RESOLVED`

### 4. 物资审批流程

- **抗过敏药物申请**：待审批状态 → 可测试审批流程
- **素食餐盒申请**：已批准 → 可测试发放流程
- **备用哮喘药物**：已发放 → 测试完整流程

### 5. 报名状态流转

- **刘小美报名**：待确认状态 → 可测试确认、支付流程
- **张小红报名**：已确认未付清 → 可测试支付流程

## 刻意简化的部分

为了在有限时间内交付核心功能，以下部分做了简化处理：

### 1. 异步任务队列

- **现状**：使用内存实现的简单任务队列，不支持持久化
- **影响**：服务重启后任务丢失，不支持分布式部署
- **生产建议**：替换为 Redis Queue 或 RabbitMQ

### 2. 文件存储

- **现状**：Excel导出文件存储在内存中，通过Task对象返回
- **影响**：文件大小受限，服务重启后导出文件丢失
- **生产建议**：使用对象存储（OSS/S3）持久化文件

### 3. 密码策略

- **现状**：仅做基础哈希，无密码强度校验、无锁定策略
- **影响**：安全性不足
- **生产建议**：增加密码复杂度校验、登录失败锁定、密码过期策略

### 4. 数据校验

- **现状**：仅做基础的必填项校验，缺少业务规则校验
- **影响**：可能存在脏数据
- **生产建议**：增加完整的参数校验层（如使用 go-playground/validator）

### 5. 分页查询

- **现状**：部分列表接口未实现分页
- **影响**：大数据量时性能问题
- **生产建议**：统一分页参数，所有列表接口支持分页

### 6. 缓存机制

- **现状**：无缓存，所有查询直接访问数据库
- **影响**：高并发下性能瓶颈
- **生产建议**：增加 Redis 缓存热点数据

### 7. 数据库事务

- **现状**：关键操作使用事务，但覆盖范围有限
- **影响**：极端情况下数据不一致
- **生产建议**：所有多表操作使用事务

### 8. 日志系统

- **现状**：使用标准库log，无结构化日志
- **影响**：日志分析困难
- **生产建议**：使用 zap 或 logrus 结构化日志

### 9. 监控告警

- **现状**：无监控、无告警
- **影响**：问题发现不及时
- **生产建议**：接入 Prometheus + Grafana

### 10. 单元测试

- **现状**：无单元测试
- **影响**：代码质量无保障
- **生产建议**：核心业务逻辑增加单元测试覆盖

## 核心业务流程

### 营员报名流程

```
创建营员 → 创建报名 → 确认报名 → 标记支付 → 分配房间 → 办理入住
```

### 分房排班流程

```
批量创建房间 → 查看未分房营员 → 单个/批量分配房间 → 自动更新房间占用
```

### 医疗上报流程

```
创建医疗记录 → (可选)通知家长 → 处理记录 → 标记已解决
```

### 物资申请流程

```
创建申请 → 后勤/主任审批 → 后勤发放 → 完成
```

## 许可证

MIT
