# 茶叶经销管理系统 (Tea Distribution Management)

基于 Django REST Framework 的茶叶经销管理后端，覆盖**价格审批 → 活动提报 → 订货 → 分仓发货 → 试饮回访**全链路。

## 核心能力

| 模块 | 说明 |
|------|------|
| 价格审批 | 申报单价、指定门店、生效周期，审批人一键通过/驳回 |
| 活动提报 | **与价格审批一对一关联**，审批通过后自动确定活动价口径 |
| 订货 | 草稿 → 确认 → 发货 → 签收，关联活动自动使用活动价 |
| 分仓发货 | 按批次出库，库存不足时阻断发货，发货明细留痕 |
| 试饮回访 | 记录门店反馈、下次回访日期，形成回查闭环 |
| 审计日志 | 所有状态变更、字段修改自动留痕，可按模型/操作人/时间查询 |
| 仪表盘 | 待处理、已驳回、需回查数据一目了然 |

## 数据流

```
价格审批 (PriceApproval)
    │
    ├── 待审批 → 已通过 → 生成活动提报 (ActivitySubmission, OneToOne)
    │                                    │
    │                                    ├── 待审批 → 已通过 → 订货单引用活动价
    │                                    │                              │
    │                                    │                              └── 发货单按批次出库
    │                                    │
    │                                    └── 已驳回 → 记录驳回原因
    │
    └── 已驳回 → 记录驳回原因

库存变动: 每次发货自动生成 InventoryRecord (批次结存可见)
试饮回访: 活动结束后若无回访记录，仪表盘提示需回查
```

## 快速开始

### 环境要求

- Python 3.10+
- Django 4.2+
- Django REST Framework 3.14+

### 本地启动

```bash
cd backend

# 安装依赖
pip install -r requirements.txt

# 数据库迁移
python manage.py migrate

# 初始化演示数据（包含账号、产品、仓库、门店、审批单等）
python manage.py init_data

# 启动服务
python manage.py runserver 0.0.0.0:8000
```

### 演示账号

| 角色 | 用户名 | 密码 | 权限 |
|------|--------|------|------|
| 管理员 | `admin` | `tea12345` | 全部权限，超级用户 |
| 销售 | `sales` | `tea12345` | 提交价格审批、活动提报；创建订货单 |
| 审批人 | `approver` | `tea12345` | 审批价格审批、活动提报 |
| 仓管 | `warehouse` | `tea12345` | 管理批次、发货、签收 |

### 演示入口

启动后访问：

| 入口 | 地址 | 说明 |
|------|------|------|
| API 根路径 | http://localhost:8000/api/ | DRF browsable API |
| 仪表盘 | http://localhost:8000/api/dashboard/ | 待处理/已驳回/需回查汇总 |
| 价格审批 | http://localhost:8000/api/price-approvals/ | 审批列表及操作 |
| 活动提报 | http://localhost:8000/api/activity-submissions/ | 活动列表及操作 |
| 订货单 | http://localhost:8000/api/orders/ | 订货列表及操作 |
| 发货单 | http://localhost:8000/api/shipments/ | 发货列表及操作 |
| 审计日志 | http://localhost:8000/api/audit-logs/ | 操作留痕查询 |
| Django Admin | http://localhost:8000/admin/ | 后台管理 |

## API 速查

### 价格审批

```
GET    /api/price-approvals/              # 列表
POST   /api/price-approvals/              # 创建（销售）
GET    /api/price-approvals/{id}/         # 详情
PUT    /api/price-approvals/{id}/         # 修改（待审批状态）
POST   /api/price-approvals/{id}/approve/ # 审批通过（审批人）
POST   /api/price-approvals/{id}/reject/  # 驳回（审批人）
POST   /api/price-approvals/{id}/create_activity/ # 生成活动提报（销售，价格审批已通过时）
```

### 活动提报（必须关联已通过的价格审批）

```
GET    /api/activity-submissions/              # 列表
POST   /api/activity-submissions/              # 创建（销售，需指定 price_approval）
GET    /api/activity-submissions/{id}/         # 详情
POST   /api/activity-submissions/{id}/approve/ # 审批通过（审批人）
POST   /api/activity-submissions/{id}/reject/  # 驳回（审批人）
```

### 订货 & 发货

```
GET    /api/orders/                          # 列表（含活动价来源信息）
POST   /api/orders/                          # 创建（含 items 明细，关联活动后自动带出商品和活动价）
GET    /api/orders/{id}/                     # 详情（含价格审批、活动价、门店口径全链路）
POST   /api/orders/{id}/confirm/             # 确认订货
POST   /api/orders/{id}/cancel/              # 取消订货
POST   /api/shipments/{id}/ship/             # 发货（自动生成库存变动记录）
POST   /api/shipments/{id}/receive/          # 签收
```

**活动价自动承接规则**（订单关联已通过活动后）：
- `items.product` 自动锁定为价格审批的商品，传入其他商品将被拒绝
- `items.unit_price` 自动使用审批的 `proposed_unit_price`，传入不一致价格将被拒绝
- `items.activity_price_applied` 自动标记为 `true`
- 若价格审批指定了门店，订单 `store` 必须匹配，否则拒绝提交
- 订单详情返回字段包含 `price_approval_code`、`price_approval_product`、`price_approval_unit_price`、`price_approval_store` 等，活动价来源一目了然

### 仪表盘

```
GET /api/dashboard/              # 汇总：待处理数、已驳回数、需回查数
GET /api/dashboard/pending/      # 待处理列表（价格审批+活动+订货+发货）
GET /api/dashboard/rejected/     # 已驳回列表
GET /api/dashboard/review_needed/ # 需回查列表（活动结束未回访）
```

### 其他

```
GET /api/products/               # 产品
GET /api/warehouses/             # 仓库
GET /api/stores/                 # 门店
GET /api/batches/                # 批次（含 current_quantity 当前库存）
GET /api/inventory-records/      # 库存变动记录
GET /api/trial-followups/        # 试饮回访
GET /api/audit-logs/             # 审计日志
```

## 初始化方式

```bash
# 全新环境
python manage.py migrate
python manage.py init_data

# 重置数据
python manage.py flush
python manage.py init_data
```

## 项目结构

```
backend/
├── apps/tea/
│   ├── models.py              # 全部数据模型
│   ├── serializers.py         # DRF 序列化器
│   ├── views.py               # 视图集 & 仪表盘
│   ├── urls.py                # 路由
│   ├── permissions.py         # 角色权限类
│   ├── services.py            # 审计日志服务
│   ├── signals.py             # 模型信号
│   ├── managers.py            # 自定义 QuerySet
│   ├── admin.py               # Django Admin 注册
│   └── management/commands/
│       └── init_data.py       # 初始化命令
├── config/
│   ├── settings.py
│   ├── urls.py
│   └── wsgi.py
├── requirements.txt
└── manage.py
```

## 权限与审计说明

- **权限嵌入数据模型**：`Meta.permissions` 定义 `can_approve_price`、`can_submit_price` 等权限，通过 `auth.Group` 分配给角色
- **视图级权限控制**：`get_permissions()` 根据 action 动态分配，如审批动作仅审批人可操作
- **审计日志**：`AuditService.log()` 在每次审批/状态变更时写入 `AuditLog`，包含操作人、IP、字段级新旧值
- **审计日志只读**：Django Admin 中审计日志不可创建/修改/删除，仅可查询
