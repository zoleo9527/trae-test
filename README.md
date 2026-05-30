# 城市书房 - 场馆巡检与设备报修系统

一套基于 Django REST Framework 的城市书房综合管理系统，打通借阅、活动、巡检、报修四大业务模块，实现数据流转与角色联动。

## 核心设计理念

### 数据流转机制
- **巡检 → 报修自动联动**：巡检中标记"需要报修"的项目，审核通过后自动生成报修工单
- **设备状态同步**：报修工单状态变化自动更新设备状态（正常→故障→维修中→正常）
- **通知推送**：关键节点自动发送通知（工单分配、状态变更、驳回等）

### 角色权限体系
| 角色 | 权限范围 |
|------|----------|
| 系统管理员 (admin) | 全部权限 |
| 场馆经理 (manager) | 场馆管理、审核巡检、派单报修 |
| 巡检人员 (inspector) | 提交巡检记录、查看分配任务 |
| 维修人员 (maintenance) | 处理报修工单、更新进度 |
| 志愿者 (volunteer) | 活动报名、签到、提交反馈 |
| 读者 (reader) | 借阅查询、活动报名 |

### 首页数据看板
登录即可见：
- **待处理事项**：待审核巡检、待派单报修、待确认工单
- **已驳回记录**：需要修改重提的巡检/报修
- **需回查项目**：标记需进一步核实的巡检项
- **我的任务**：按角色展示待办清单

## 技术栈

- **后端框架**: Django 4.2 + Django REST Framework 3.14
- **认证方案**: JWT (SimpleJWT)
- **数据库**: SQLite3 (默认) / PostgreSQL
- **权限控制**: 基于角色的访问控制 (RBAC)
- **审计留痕**: 自动记录所有写操作、操作日志可追溯

## 快速开始

### 1. 环境准备

```bash
# 创建虚拟环境
python3 -m venv venv
source venv/bin/activate  # macOS/Linux

# 安装依赖
pip install -r requirements.txt
```

### 2. 初始化数据库

```bash
# 生成迁移
python manage.py makemigrations

# 执行迁移
python manage.py migrate

# 创建演示数据（必做）
python manage.py initdata

# 创建超级管理员（可选，initdata已创建）
python manage.py createsuperuser
```

### 3. 启动服务

```bash
python manage.py runserver
```

服务地址: http://localhost:8000

### 4. 演示账号

| 用户名 | 密码 | 角色 |
|--------|------|------|
| admin | admin123 | 系统管理员 |
| manager | manager123 | 场馆经理 |
| inspector | inspector123 | 巡检人员 |
| maintenance | maintenance123 | 维修人员 |
| volunteer | volunteer123 | 志愿者 |
| reader | reader123 | 读者 |

## 核心接口文档

### 认证接口

```bash
# 登录获取Token
POST /api/token/
Content-Type: application/json

{
    "username": "inspector",
    "password": "inspector123"
}

# Token刷新
POST /api/token/refresh/
```

后续请求 Header 携带:
```
Authorization: Bearer <access_token>
```

### 首页看板

```bash
GET /api/dashboard/
```

返回当前用户可见的统计数据、待处理事项、我的任务。

### 巡检流程接口

```bash
# 1. 创建巡检记录
POST /api/inspections/

# 2. 添加巡检项结果
POST /api/inspections/{id}/items/

# 3. 提交巡检
POST /api/inspections/{id}/submit/

# 4. 经理审核通过（自动创建报修工单）
POST /api/inspections/{id}/approve/
{
    "comments": "审核通过"
}

# 5. 经理驳回
POST /api/inspections/{id}/reject/
{
    "comments": "请补充现场照片"
}

# 6. 标记需回查
POST /api/inspections/{id}/needs_review/
{
    "reason": "消防器材有效期需核实"
}
```

### 报修流程接口

```bash
# 1. 直接报修（或由巡检自动生成）
POST /api/repairs/

# 2. 经理派单
POST /api/repairs/{id}/assign/
{
    "assignee_id": 4
}

# 3. 维修人员开始处理
POST /api/repairs/{id}/start/

# 4. 完成维修
POST /api/repairs/{id}/complete/
{
    "solution": "更换了空调滤网",
    "cost": 150
}

# 5. 报修人确认完成
POST /api/repairs/{id}/confirm/
{
    "rating": 5,
    "comments": "维修及时，服务好"
}

# 6. 查看操作日志
GET /api/repairs/{id}/logs/
```

### 活动签到与反馈

```bash
# 活动签到
POST /api/activities/{id}/checkin/
{
    "user_id": 6,
    "checkin_code": "ACT2024"
}

# 志愿者提交反馈
POST /api/volunteer-feedbacks/
{
    "activity": 1,
    "task_description": "图书整理",
    "actual_hours": 3.5,
    "issues_encountered": "有几本书籍破损",
    "suggestions": "建议增加修补工具"
}

# 经理处理反馈
POST /api/volunteer-feedbacks/{id}/resolve/
{
    "notes": "已安排处理"
}
```

### 借阅管理

```bash
# 创建借阅记录
POST /api/borrows/

# 还书
POST /api/borrows/{id}/return_book/

# 续借
POST /api/borrows/{id}/renew/
```

### 审计与通知

```bash
# 审计日志（仅管理员/经理）
GET /api/audit-logs/

# 我的通知
GET /api/notifications/unread/

# 标记已读
POST /api/notifications/{id}/mark_read/

# 全部标记已读
POST /api/notifications/mark_all_read/
```

## 数据流转演示（推荐操作顺序）

### 场景：巡检发现问题 → 自动生成报修 → 维修完成

1. **inspector** 登录，创建巡检记录
   ```bash
   POST /api/inspections/
   {
       "venue": 1,
       "title": "5月30日日常巡检",
       "type": "daily"
   }
   ```

2. 添加巡检项，标记空调有问题需报修
   ```bash
   POST /api/inspections/{id}/items/
   {
       "item_name": "中央空调-1号检查",
       "item_category": "facility",
       "is_passed": false,
       "has_issue": true,
       "issue_description": "制冷效果差，有异响",
       "need_repair": true,
       "device": 1
   }
   ```

3. 提交巡检
   ```bash
   POST /api/inspections/{id}/submit/
   ```

4. **manager** 登录，审核通过巡检
   ```bash
   POST /api/inspections/{id}/approve/
   ```
   → 系统自动生成报修工单，设备状态变为"故障"

5. **manager** 派单给维修人员
   ```bash
   POST /api/repairs/{new_id}/assign/
   {
       "assignee_id": 4
   }
   ```

6. **maintenance** 开始处理 → 完成维修
   ```bash
   POST /api/repairs/{id}/start/
   POST /api/repairs/{id}/complete/
   {
       "solution": "添加氟利昂，更换压缩机轴承"
   }
   ```

7. 报修人确认完成
   ```bash
   POST /api/repairs/{id}/confirm/
   ```
   → 设备状态自动恢复为"正常"

## 项目结构

```
trae-test-5/
├── config/                 # 项目配置
│   ├── settings.py
│   ├── urls.py
│   └── wsgi.py
├── apps/
│   ├── common/            # 公共模块（基础模型、权限、视图）
│   ├── users/             # 用户管理
│   ├── venues/            # 场馆管理
│   ├── devices/           # 设备管理
│   ├── inspections/       # 巡检管理
│   ├── repairs/           # 报修管理
│   ├── borrowing/         # 借阅管理
│   ├── activities/        # 活动管理
│   └── audit/             # 审计与通知
├── manage.py
├── requirements.txt
└── README.md
```

## 关键设计点

### 状态机设计
每个核心业务对象都有明确的状态流转和操作权限控制：
- **巡检**: 草稿 → 已提交 → 审核中 → 已通过/已驳回/需回查 → 已完成
- **报修**: 待处理 → 已派单 → 处理中 → 待确认 → 已完成/已驳回

### 审计留痕
- 所有写操作自动记录审计日志（用户、时间、IP、模块、操作类型）
- 报修工单有单独的操作日志链，完整记录流转过程
- 数据变更历史可通过审计日志回溯

### 权限控制
- 基于角色的权限控制（RBAC）
- 对象级权限：仅相关人员可操作（如报修人可确认工单）
- 字段级权限：不同角色可见字段不同

### 逾期提醒机制
- 巡检、报修、借阅均有逾期标记字段
- 可配置定时任务扫描逾期项并推送通知
- 逾期记录在首页看板高亮显示

## 管理后台

Django Admin 地址: http://localhost:8000/admin/

使用 admin / admin123 登录，可进行：
- 数据批量管理
- 用户角色分配
- 系统配置调整

## 常见问题

### 如何切换到 PostgreSQL？

修改 `config/settings.py` 中的 DATABASES 配置：

```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'city_library',
        'USER': 'postgres',
        'PASSWORD': 'postgres',
        'HOST': 'localhost',
        'PORT': '5432',
    }
}
```

### 如何添加新角色？

在 `apps/users/models.py` 的 Role 枚举中添加新选项，然后在 `apps/common/permissions.py` 中配置权限。

### 生产环境部署注意事项

1. 修改 `SECRET_KEY` 为强随机字符串
2. 设置 `DEBUG = False`
3. 配置正确的 `ALLOWED_HOSTS`
4. 使用 PostgreSQL 替代 SQLite
5. 配置 HTTPS
6. 配置定时任务处理逾期提醒
