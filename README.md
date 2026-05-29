# 展会搭建验收与撤场复盘系统

基于 Go Fiber + PostgreSQL 的展会搭建验收与撤场复盘管理系统。解决进场证件漏办、物料版本混乱、供应商对账靠事后拼接等问题，实现从搭建验收到撤场复盘的全流程数据留痕和角色流转。

## 功能特性

### 核心业务
- **项目管理**: 项目排期、阶段流转（规划→搭建→验收→布展→撤场→复盘→完成）
- **证件管理**: 进场证、用电证、消防证等多类型证件管理，支持批量审批
- **物料管理**: 物料清单、版本控制、供应商关联、状态追踪
- **搭建验收**: 安全、结构、用电、消防等多维度验收项管理
- **撤场复盘**: 撤场记录、问题追踪、经验沉淀、改进措施

### 系统特性
- **JWT 鉴权**: 基于角色的权限控制（管理员→经理→主管→施工→供应商）
- **操作留痕**: 所有关键操作完整审计日志，支持历史回溯
- **数据筛选**: 多维度筛选查询，支持分页
- **批量操作**: 证件批量审批，高峰期快速处理
- **首页仪表盘**: 一进来就能看见待处理、已驳回和需回查的数据

## 技术栈

- **后端框架**: Go Fiber v2
- **数据库**: PostgreSQL 15+
- **ORM**: GORM
- **鉴权**: JWT
- **容器化**: Docker & Docker Compose

## 快速开始

### 方式一：Docker Compose（推荐）

```bash
# 克隆项目后直接启动
docker-compose up -d

# 查看日志
docker-compose logs -f app
```

服务启动后访问: http://localhost:3000

### 方式二：本地开发

#### 前置依赖
- Go 1.21+
- PostgreSQL 15+

#### 步骤

```bash
# 1. 复制环境变量配置
cp .env.example .env
# 编辑 .env 配置数据库连接信息

# 2. 安装依赖
go mod download

# 3. 启动服务
go run cmd/server/main.go
```

## 初始化数据

系统启动时会自动创建以下演示账号：

| 用户名 | 密码 | 角色 | 权限说明 |
|--------|------|------|----------|
| admin | admin123 | 系统管理员 | 全部权限 |
| manager | manager123 | 项目经理 | 项目管理、审计查看 |
| supervisor | super123 | 现场主管 | 审批权限 |
| worker | worker123 | 施工人员 | 提交、查看 |
| supplier | supply123 | 供应商 | 物料相关 |

## API 文档

### 基础地址
```
http://localhost:3000/api
```

### 健康检查
```bash
GET /api/health
```

### 认证接口

#### 登录
```bash
POST /api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123"
}
```

#### 获取当前用户
```bash
GET /api/auth/me
Authorization: Bearer <token>
```

### 首页仪表盘

```bash
# 获取统计数据
GET /api/dashboard/stats
Authorization: Bearer <token>

# 获取待处理事项
GET /api/dashboard/pending
Authorization: Bearer <token>

# 获取最近活动
GET /api/dashboard/activity
Authorization: Bearer <token>
```

### 项目管理

```bash
# 项目列表（支持筛选）
GET /api/projects?phase=setup&status=pending&search=keyword

# 创建项目
POST /api/projects
{
  "name": "2024上海展会",
  "code": "SH2024001",
  "description": "展位A12搭建项目",
  "location": "上海新国际博览中心",
  "booth_number": "A12",
  "priority": 1
}

# 获取项目详情（含关联数据）
GET /api/projects/:id

# 更新项目阶段
PATCH /api/projects/:id/phase
{
  "phase": "inspection"
}
```

### 证件管理

```bash
# 证件列表
GET /api/certificates?project_id=1&status=pending

# 创建证件
POST /api/certificates
{
  "project_id": 1,
  "name": "进场人员证",
  "type": "entry",
  "owner_id": 5,
  "issuer": "展馆管理处"
}

# 批量审批（主管及以上）
POST /api/certificates/batch-approve
{
  "ids": [1, 2, 3]
}

# 单个审批
POST /api/certificates/:id/approve

# 驳回
POST /api/certificates/:id/reject
{
  "reason": "材料不全"
}
```

### 物料管理

```bash
# 物料列表
GET /api/materials?project_id=1&status=pending

# 创建物料
POST /api/materials
{
  "project_id": 1,
  "supplier_id": 1,
  "name": "LED显示屏",
  "sku": "LED-P3-55",
  "category": "电子设备",
  "quantity": 4,
  "unit": "块",
  "unit_price": 2500
}

# 创建新版本
POST /api/materials/:id/version

# 查看版本历史
GET /api/materials/:id/versions

# 更新状态
PATCH /api/materials/:id/status
{
  "status": "approved"
}
```

### 搭建验收

```bash
# 验收列表
GET /api/inspections?project_id=1&status=reviewing

# 创建验收
POST /api/inspections
{
  "project_id": 1,
  "type": "safety",
  "title": "安全设施验收",
  "inspector_id": 4,
  "items": [
    {"name": "消防器材", "standard": "ABC干粉灭火器x4"},
    {"name": "应急通道", "standard": "宽度≥1.2米"}
  ]
}

# 提交验收
POST /api/inspections/:id/submit
{
  "overall_passed": true,
  "remarks": "全部合格"
}

# 审批通过
POST /api/inspections/:id/approve

# 驳回
POST /api/inspections/:id/reject
{
  "reason": "消防器材数量不足"
}
```

### 撤场复盘

```bash
# 撤场记录列表
GET /api/teardowns?project_id=1

# 创建撤场复盘
POST /api/teardowns
{
  "project_id": 1,
  "title": "撤场复盘报告",
  "operator_id": 4,
  "issues": [
    {
      "title": "地面划痕",
      "description": "北通道发现3处划痕",
      "severity": "minor",
      "responsible_id": 2
    }
  ],
  "summary": "整体顺利，延时2小时完成",
  "lessons_learned": "提前规划运输路线",
  "improvements": "增加地面保护措施"
}

# 提交审核
POST /api/teardowns/:id/submit

# 审批
POST /api/teardowns/:id/approve

# 更新问题状态
PATCH /api/teardowns/:id/issues/:issueId/status
{
  "status": "done",
  "resolution": "已修复"
}
```

### 审计日志（经理及以上）

```bash
# 审计日志列表
GET /api/audit?resource_type=project&project_id=1

# 查看详情
GET /api/audit/:id
```

## 数据流转说明

```
项目规划 → 搭建阶段 → 搭建验收 → 布展阶段 → 撤场阶段 → 撤场复盘 → 项目完成
     ↓          ↓          ↓          ↓          ↓           ↓
   证件       物料       验收单                  问题追踪   经验沉淀
   办理       版本       审批                    责任到人   改进措施
```

## 权限矩阵

| 操作 | 供应商 | 施工 | 主管 | 经理 | 管理员 |
|------|--------|------|------|------|--------|
| 查看项目 | ✓ | ✓ | ✓ | ✓ | ✓ |
| 创建项目 | - | - | - | ✓ | ✓ |
| 提交验收/撤场 | - | ✓ | ✓ | ✓ | ✓ |
| 审批 | - | - | ✓ | ✓ | ✓ |
| 批量审批 | - | - | ✓ | ✓ | ✓ |
| 查看审计日志 | - | - | - | ✓ | ✓ |
| 用户管理 | - | - | - | - | ✓ |

## 项目结构

```
.
├── cmd/
│   └── server/
│       └── main.go          # 应用入口
├── internal/
│   ├── models/              # 数据模型
│   │   ├── base.go
│   │   ├── user.go
│   │   ├── project.go
│   │   ├── certificate.go
│   │   ├── material.go
│   │   ├── inspection.go
│   │   ├── teardown.go
│   │   ├── supplier.go
│   │   └── audit.go
│   ├── handlers/            # HTTP 处理器
│   ├── middleware/          # 中间件
│   ├── services/            # 业务服务
│   ├── config/              # 配置
│   └── database/            # 数据库连接
├── pkg/
│   └── logger/
├── Dockerfile
├── docker-compose.yml
├── go.mod
├── .env.example
└── README.md
```

## 演示入口

服务启动后，可以通过以下方式验证：

1. **健康检查**: http://localhost:3000/api/health
2. **登录获取Token**: 调用 `POST /api/auth/login`
3. **查看仪表盘**: `GET /api/dashboard/stats`
4. **查看待办事项**: `GET /api/dashboard/pending`

## 常见问题

### 数据库连接失败
- 确认 PostgreSQL 服务已启动
- 检查 `.env` 中数据库配置
- Docker 方式下确认 `postgres` 容器健康状态

### 登录失败
- 确认用户名密码正确（参考演示账号列表）
- 确认用户状态为激活

### 没有权限操作
- 检查用户角色权限
- 确认 API 需要的角色等级
