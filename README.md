# 船舶代理-船员换班与截点提醒系统

船舶代理业务管理系统，整合靠泊计划、船员换班、截点提醒、垫付款项、供应商沟通记录一体化管理。

## 功能特性

- 🚢 **靠泊计划管理** - 船舶靠泊、离港计划，状态跟踪
- 👥 **船员换班管理** - 船员上下船、证件管理、酒店接送
- ⏰ **截点提醒** - 证件审核、费用确认等关键节点提醒，防止超时
- 💰 **垫付款项管理** - 垫付申请、报销跟踪、逾期提醒
- 📧 **沟通记录** - 邮件、电话等沟通记录统一管理
- 📊 **首页看板** - 待处理、已驳回、需回查数据一目了然
- 📝 **审计留痕** - 所有操作完整记录，支持追溯
- 🔒 **权限控制** - 基于角色的权限管理（RBAC）
- 🔄 **版本控制** - 乐观锁防止并发冲突

## 技术栈

- **后端框架**: FastAPI 0.109.0
- **数据库**: SQLite（可切换PostgreSQL）
- **ORM**: SQLAlchemy 2.0
- **认证**: JWT + OAuth2
- **数据校验**: Pydantic 2.0

## 快速开始

### 环境要求

- Python 3.10+

### 本地启动

1. **进入后端目录**
```bash
cd backend
```

2. **创建虚拟环境**
```bash
python3 -m venv venv
source venv/bin/activate  # macOS/Linux
# 或
venv\Scripts\activate  # Windows
```

3. **安装依赖**
```bash
pip install -r requirements.txt
```

4. **初始化数据库**
```bash
python init_db.py
```

5. **启动服务**
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### 演示入口

| 项目 | 地址 |
|------|------|
| API文档（Swagger） | http://localhost:8000/docs |
| API文档（ReDoc） | http://localhost:8000/redoc |
| 健康检查 | http://localhost:8000/health |

### 默认账号

| 用户名 | 密码 | 角色 | 说明 |
|--------|------|------|------|
| admin | admin123 | 系统管理员 | 全权限 |
| manager | test123 | 代理经理 | 业务管理 |
| site | test123 | 现场协调 | 现场操作 |
| document | test123 | 单证专员 | 证件处理 |
| finance | test123 | 财务 | 费用处理 |

## API接口概览

### 认证
- `POST /api/token` - 登录获取Token
- `GET /api/users/me` - 获取当前用户信息
- `POST /api/users` - 创建用户
- `GET /api/users` - 用户列表

### 靠泊计划
- `GET /api/berths` - 靠泊计划列表
- `GET /api/berths/{id}` - 靠泊详情
- `POST /api/berths` - 创建靠泊计划
- `PUT /api/berths/{id}` - 更新靠泊计划（带版本校验）

### 船员换班
- `GET /api/crew` - 换班列表
- `GET /api/crew/{id}` - 换班详情
- `POST /api/crew` - 创建换班
- `PUT /api/crew/{id}` - 更新换班

### 截点提醒
- `GET /api/checkpoints` - 截点列表（支持筛选待办/已办/超时）
- `GET /api/checkpoints/{id}` - 截点详情
- `POST /api/checkpoints` - 创建截点
- `PUT /api/checkpoints/{id}` - 更新截点

### 垫付款项
- `GET /api/payments` - 款项列表
- `GET /api/payments/{id}` - 款项详情
- `POST /api/payments` - 创建垫付
- `PUT /api/payments/{id}` - 更新垫付状态

### 沟通记录
- `GET /api/communications` - 沟通记录列表
- `POST /api/communications` - 新增沟通记录

### 审计日志
- `GET /api/audit` - 审计日志（仅管理员/经理可见）

### 首页数据
- `GET /api/dashboard` - 获取首页统计和待办列表

## 核心设计

### 数据模型关系

```
靠泊计划 (BerthPlan)
    ├── 船员换班 (CrewChange)
    │   └── 截点提醒 (CheckpointReminder)
    ├── 截点提醒 (CheckpointReminder)
    ├── 垫付款项 (AdvancePayment)
    │   └── 沟通记录 (Communication)
    └── 沟通记录 (Communication)
```

### 状态冲突处理

所有业务实体（靠泊、换班、截点、垫付）都实现了**乐观锁**机制：

1. 每条记录带有 `version` 字段
2. 更新时必须传入当前 `version`
3. 版本不匹配返回 409 冲突错误
4. 成功更新后 `version` 自动 +1

**示例请求:**
```json
PUT /api/berths/1
{
  "status": "in_progress",
  "version": 1
}
```

**冲突响应:**
```json
{
  "detail": "Version conflict for berth_plan 1: current version is 2, but 1 was provided"
}
```

### 审计留痕

所有创建、更新操作自动记录审计日志，包含：
- 操作人
- 操作类型（create/update/delete/status_change）
- 资源类型和ID
- 变更前后值对比
- IP地址和User-Agent

### 角色权限

| 接口模块 | 操作 | 管理员 | 代理经理 | 现场协调 | 单证专员 | 财务 |
|---------|------|--------|---------|---------|---------|-----|
| **用户管理** | 创建用户 | ✅ | ❌ | ❌ | ❌ | ❌ |
| | 用户列表 | ✅ | ✅ | ❌ | ❌ | ❌ |
| **靠泊计划** | 查询 | ✅ | ✅ | ✅ | ✅ | ✅ |
| | 创建/编辑 | ✅ | ✅ | ✅ | ❌ | ❌ |
| **船员换班** | 查询 | ✅ | ✅ | ✅ | ✅ | ❌ |
| | 创建/编辑 | ✅ | ✅ | ✅ | ✅ | ❌ |
| **截点提醒** | 查询 | ✅ | ✅ | ✅ | ✅ | ✅ |
| | 创建/编辑 | ✅ | ✅ | ✅ | ✅ | ✅ |
| **垫付款项** | 查询 | ✅ | ✅ | ❌ | ❌ | ✅ |
| | 创建/编辑 | ✅ | ✅ | ❌ | ❌ | ✅ |
| **沟通记录** | 查询/创建 | ✅ | ✅ | ✅ | ✅ | ✅ |
| **审计日志** | 查询 | ✅ | ✅ | ❌ | ❌ | ❌ |
| **首页看板** | 查询 | ✅ | ✅ | ✅ | ✅ | ✅ |

## 项目结构

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # 应用入口
│   ├── config.py            # 配置管理
│   ├── database.py          # 数据库连接
│   ├── models.py            # 数据模型
│   ├── schemas.py           # Pydantic Schema
│   ├── auth.py              # 认证授权
│   ├── crud.py              # 数据操作
│   ├── audit.py             # 审计日志
│   └── routers/             # API路由
│       ├── __init__.py
│       ├── auth.py
│       ├── berths.py
│       ├── crew.py
│       ├── checkpoints.py
│       ├── payments.py
│       ├── communications.py
│       ├── audit.py
│       └── dashboard.py
├── init_db.py               # 初始化脚本
├── requirements.txt
└── .env.example
```

## 常见问题

**Q: 如何切换到PostgreSQL？**

修改 `.env` 文件：
```
DATABASE_URL=postgresql://user:password@localhost/dbname
```

**Q: 如何修改JWT过期时间？**

修改 `.env` 文件的 `ACCESS_TOKEN_EXPIRE_MINUTES` 配置。

**Q: 如何添加新的业务类型？**

1. 在 `models.py` 添加新模型
2. 在 `schemas.py` 添加请求/响应Schema
3. 在 `crud.py` 添加数据操作
4. 创建新的路由文件

## License

MIT
