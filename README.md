# 废品回收站 - 客户赊账与回款提醒系统

基于 Django REST Framework 构建的废品回收站管理系统，专注于客户赊账与回款提醒的核心业务流程。

## 系统特性

- **客户管理**：客户档案维护、信用等级评估、赊账额度控制
- **磅单管理**：过磅记录、废品分类、价格计算、状态流转
- **赊账回款**：赊账记录、回款跟踪、到期提醒、异常处理
- **价格调整**：废品价格变更历史与依据留存
- **审计留痕**：全操作日志记录，支持数据溯源
- **权限控制**：基于用户角色的访问权限管理
- **首页概览**：待处理、已驳回、需回查数据一目了然

## 技术栈

- **框架**：Django 4.2 + Django REST Framework 3.14
- **数据库**：SQLite3（可切换至 PostgreSQL/MySQL）
- **认证**：JWT Token + Session
- **过滤**：Django Filter
- **时间处理**：Asia/Shanghai 时区

## 快速开始

### 环境准备

```bash
# 1. 克隆项目后进入目录
cd trae-test-3

# 2. 创建虚拟环境
python3 -m venv .venv
source .venv/bin/activate  # macOS/Linux
# 或 Windows: .venv\Scripts\activate

# 3. 安装依赖
pip install -r requirements.txt
```

### 初始化数据库

```bash
# 1. 生成数据库迁移
python manage.py makemigrations

# 2. 执行迁移
python manage.py migrate

# 3. 初始化演示数据（创建用户、客户、废品类型、示例数据等）
python scripts/init_data.py
```

### 启动服务

```bash
# 启动开发服务器
python manage.py runserver 0.0.0.0:8000
```

## 访问入口

| 入口 | 地址 | 说明 |
|------|------|------|
| **管理后台** | http://localhost:8000/admin/ | Django Admin 管理界面 |
| **API 首页** | http://localhost:8000/api/ | DRF 可浏览 API 页面 |
| **首页概览** | http://localhost:8000/api/dashboard/ | 待处理/已驳回/需回查统计 |
| **Token 获取** | http://localhost:8000/api/token/ | JWT 登录接口 |

## 默认账号

初始化脚本会创建以下测试账号：

| 用户名 | 密码 | 角色 | 说明 |
|--------|------|------|------|
| **admin** | admin123456 | 超级管理员 | 拥有所有权限 |
| **manager** | manager123456 | 站点管理员 | 可进入后台管理 |
| **operator** | operator123456 | 过磅员 | 磅单操作权限 |
| **finance** | finance123456 | 财务 | 赊账回款操作权限 |

## API 接口清单

### 认证接口

```
POST /api/token/           # 获取 Token
POST /api/token/refresh/   # 刷新 Token
```

### 首页概览

```
GET  /api/dashboard/       # 首页统计数据
```

### 客户管理

```
GET    /api/customers/customers/          # 客户列表
POST   /api/customers/customers/          # 创建客户
GET    /api/customers/customers/{id}/     # 客户详情
PUT    /api/customers/customers/{id}/     # 更新客户
DELETE /api/customers/customers/{id}/     # 删除客户
GET    /api/customers/customers/{id}/credit_info/  # 客户额度信息

GET    /api/customers/waste-types/        # 废品类型列表
POST   /api/customers/waste-types/        # 创建废品类型
```

### 磅单管理

```
GET    /api/weights/tickets/              # 磅单列表
POST   /api/weights/tickets/              # 创建磅单
GET    /api/weights/tickets/{id}/         # 磅单详情
POST   /api/weights/tickets/{id}/approve/ # 审核通过
POST   /api/weights/tickets/{id}/reject/  # 审核驳回
POST   /api/weights/tickets/{id}/mark_review/  # 标记需回查

GET    /api/weights/price-adjustments/    # 价格调整记录
POST   /api/weights/price-adjustments/    # 创建价格调整
```

### 赊账回款

```
GET    /api/credits/credits/              # 赊账列表
POST   /api/credits/credits/              # 创建赊账
POST   /api/credits/credits/{id}/approve/ # 确认赊账
POST   /api/credits/credits/{id}/reject/  # 驳回赊账

GET    /api/credits/repayments/           # 回款列表
POST   /api/credits/repayments/           # 创建回款
POST   /api/credits/repayments/{id}/approve/  # 确认回款
POST   /api/credits/repayments/{id}/reject/   # 驳回回款

GET    /api/credits/reminders/            # 回款提醒列表
POST   /api/credits/reminders/{id}/mark_read/  # 标记已读
POST   /api/credits/reminders/{id}/handle/     # 处理提醒
```

### 审计日志

```
GET  /api/audits/logs/             # 审计日志列表（仅管理员）
GET  /api/audits/logs/{id}/        # 审计日志详情
```

## 核心业务流程

### 1. 磅单流程

```
创建磅单 → 待审核(pending) → 审核通过(approved)
                              ↘ 审核驳回(rejected)
                              ↘ 标记需回查(review)
```

### 2. 赊账流程

```
创建赊账 → 待确认(pending) → 确认通过(approved)
                              ↘ 确认驳回(rejected)
```

### 3. 回款流程

```
创建回款 → 待确认(pending) → 确认通过(approved)
                              ↘ 确认驳回(rejected)
```

## 数据模型

### 核心实体关系

```
客户(Customer)  ──1:n──  磅单(WeightTicket)
    │                     │
    │                     └── 赊账记录(CreditRecord)
    │                            │
    └── 赊账/回款                 └── 回款记录(RepaymentRecord)
    └── 回款提醒(CreditReminder)

废品类型(WasteType) ──1:n── 磅单
           │
           └── 价格调整记录(PriceAdjustment)

审计日志(AuditLog) 记录所有操作
```

### 状态流转说明

| 模块 | 状态 | 说明 |
|------|------|------|
| 磅单 | pending | 待审核，刚创建的磅单 |
| 磅单 | approved | 审核通过，正常结算 |
| 磅单 | rejected | 审核驳回，异常单 |
| 磅单 | review | 需回查，待进一步确认 |
| 赊账/回款 | pending | 待财务确认 |
| 赊账/回款 | approved | 已确认 |
| 赊账/回款 | rejected | 已驳回 |

## 审计留痕机制

系统通过 `apps.audit.utils.log_action()` 函数记录所有关键操作：

- **操作人**：执行操作的用户
- **操作类型**：创建/更新/删除/审核通过/审核驳回/标记回查 等
- **操作时间**：精确到秒
- **IP 地址**：操作来源 IP
- **对象信息**：模型名称、对象 ID、对象描述
- **变更前后**：JSON 格式保存旧值和新值
- **操作描述**：可读的操作说明

审计日志通过 Django Admin 可查看，且不可修改和删除。

## 项目结构

```
trae-test-3/
├── apps/
│   ├── base/          # 基础模块（抽象模型、首页接口）
│   ├── customer/      # 客户管理（客户、废品类型）
│   ├── weight/        # 磅单管理（磅单、价格调整）
│   ├── credit/        # 赊账回款（赊账、回款、提醒）
│   └── audit/         # 审计日志（日志、中间件、工具）
├── config/            # Django 配置
├── scripts/           # 脚本（初始化数据）
├── manage.py          # Django 管理脚本
├── requirements.txt   # 依赖列表
└── README.md          # 项目说明
```

## 开发说明

### 添加新的审计日志

```python
from apps.audit.utils import log_action, model_to_dict

# 创建时
log_action(
    user=request.user,
    action='create',
    message=f'创建对象: {instance.name}',
    instance=instance,
    new_values=model_to_dict(instance),
    request=request
)

# 更新时
old_values = model_to_dict(old_instance)
instance.save()
log_action(
    user=request.user,
    action='update',
    message=f'更新对象: {instance.name}',
    instance=instance,
    old_values=old_values,
    new_values=model_to_dict(instance),
    request=request
)
```

### 切换数据库

编辑 `config/settings.py` 中的 `DATABASES` 配置：

```python
# PostgreSQL 示例
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'waste_recycling',
        'USER': 'postgres',
        'PASSWORD': 'password',
        'HOST': 'localhost',
        'PORT': '5432',
    }
}
```

## 生产部署建议

1. 修改 `SECRET_KEY` 为安全随机值
2. 设置 `DEBUG = False`
3. 配置正确的 `ALLOWED_HOSTS`
4. 使用 PostgreSQL/MySQL 替代 SQLite
5. 配置静态文件服务（Nginx + WhiteNoise）
6. 配置 HTTPS
7. 定期备份数据库和审计日志
8. 配置日志轮转

## License

MIT License
