# 《文创商店-补货计划与门店调拨系统

## 一、项目概述

本系统旨在打通文创商店的补货计划、门店调拨、上新陈列和会员兑换全链路，解决手工接力、数据分散、重复录入和重复确认等问题。实现店长、企划专员、仓管三种角色在同一链路中协同作业。

### 核心功能模块
- **补货计划管理**：按门店群制定补货计划，自动生成门店补货单
- **补货单流转**：草稿 → 已提交 → 审核中 → 已驳回/出库中 → 已发货 → 已收货 → 已完成/已取消
- **门店调拨**：门店间余缺调拨，双门店确认机制
- **陈列检查**：巡店问题记录 → 整改 → 复核闭环
- **会员兑换**：积分兑换商品
- **审计日志**：全链路操作追踪
- **数据导出**：Excel导出支持
- **仪表盘**：多维度数据统计

---

## 二、启动方式

### 1. 安装依赖

```bash
cd /Users/liu/Documents/private/model-test/trae-test-4

pip install -r requirements.txt
```

### 2. 数据库迁移

```bash
python manage.py makemigrations
python manage.py migrate
```

### 3. 初始化演示数据

```bash
python manage.py init_demo_data
```

### 4. 启动服务

```bash
python manage.py runserver 0.0.0.0:8000
```

服务地址: http://localhost:8000

### 5. API文档地址（DRF自带界面）: http://localhost:8000/api/

---

## 三、测试账号

| 角色 | 用户名 | 密码 | 说明 |
|------|--------|------|------|
| 店长 | store_manager | 123456 | 上海南京东路店（SH001）|
| 店长2 | store_manager2 | 123456 | 杭州西湖店（HZ001）|
| 企划专员 | planner | 123456 | 全局权限 |
| 仓管 | warehouse | 123456 | 全局权限 |

### 登录获取Token:

```bash
POST /api/auth/login/

Content-Type: application/json

{
    "username": "store_manager",
    "password": "123456"
}
```

返回：
```json
{
    "refresh": "...",
    "access": "..."
}
```

后续请求Header中携带：
```
Authorization: Bearer <access_token>
```

---

## 四、核心API接口

### 1. 补货计划 API

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/replenishment-plans/ | 补货计划列表 |
| POST | /api/replenishment-plans/ | 创建补货计划 |
| GET | /api/replenishment-plans/{id}/ | 补货计划详情 |
| POST | /api/replenishment-plans/{id}/generate-orders/ | 根据计划生成补货单 |
| GET | /api/replenishment-plans/export/ | 导出补货计划 |

### 2. 补货单 API

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/replenishment-orders/ | 补货单列表（支持筛选） |
| POST | /api/replenishment-orders/ | 创建补货单 |
| GET | /api/replenishment-orders/{id}/ | 补货单详情 |
| POST | /api/replenishment-orders/{id}/submit/ | 提交 |
| POST | /api/replenishment-orders/{id}/review/ | 审核通过 |
| POST | /api/replenishment-orders/{id}/reject/ | 驳回 |
| POST | /api/replenishment-orders/{id}/ship/ | 发货 |
| POST | /api/replenishment-orders/{id}/receive/ | 收货 |
| POST | /api/replenishment-orders/{id}/complete/ | 完成 |
| POST | /api/replenishment-orders/{id}/cancel/ | 取消 |
| GET | /api/replenishment-orders/{id}/audit-logs/ | 审计日志 |
| GET | /api/replenishment-orders/export/ | 导出补货单 |

### 3. 调拨单 API

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/transfer-orders/ | 调拨单列表 |
| POST | /api/transfer-orders/ | 创建调拨单 |
| GET | /api/transfer-orders/{id}/ | 调拨单详情 |
| POST | /api/transfer-orders/{id}/submit/ | 提交 |
| POST | /api/transfer-orders/{id}/out-confirm/ | 转出确认 |
| POST | /api/transfer-orders/{id}/out-reject/ | 转出拒绝 |
| POST | /api/transfer-orders/{id}/in-confirm/ | 转入确认 |
| POST | /api/transfer-orders/{id}/in-reject/ | 转入拒绝 |
| POST | /api/transfer-orders/{id}/cancel/ | 取消 |

### 4. 陈列记录 API

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/display-records/ | 陈列记录列表 |
| POST | /api/display-records/ | 创建陈列记录 |
| POST | /api/display-records/{id}/fix/ | 整改 |
| POST | /api/display-records/{id}/verify/ | 复核 |
| POST | /api/display-records/{id}/reject/ | 驳回整改 |

### 5. 会员兑换 API

| 方法 | 说明 |
|------|------|
| GET | /api/redemptions/ | 兑换列表 |
| POST | /api/redemptions/ | 创建兑换 |
| POST | /api/redemptions/{id}/process/ | 审核处理 |
| POST | /api/redemptions/{id}/complete/ | 完成 |
| POST | /api/redemptions/{id}/reject/ | 驳回 |

### 6. 仪表盘 API

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/dashboard/stats/ | 仪表盘统计 |

---

## 五、异常触发场景演示

### 1. **状态冲突异常** (409 Conflict)

**操作**: 尝试对已完成的补货单 RP-DEMO-003 执行提交/审核/发货等任何操作

```bash
POST /api/replenishment-orders/3/submit/
```

**响应**:
```json
{
    "code": "status_conflict",
    "message": "当前状态不允许此操作",
    "details": "订单状态为 [已完成]，无法执行 [提交]",
    "suggestion": "请检查订单状态"
}
```

---

### 2. **商品已下架异常** (400 Bad Request)

**操作**: 提交补货单 RP-DEMO-004（包含已下架商品 SKU007 丝绸笔记本）

```bash
POST /api/replenishment-orders/4/submit/
```

**响应**:
```json
{
    "code": "product_delisted",
    "message": "商品已下架",
    "details": "商品 [SKU007 丝绸笔记本 状态为已下架",
    "suggestion": "请移除已下架商品或联系商品上架"
}
```

---

### 3. **库存不足异常** (400 Bad Request)

**操作**: 提交调拨单 TF-DEMO-002（SH002 的 SKU004 库存为0）

```bash
POST /api/transfer-orders/2/submit/
```

**响应**:
```json
{
    "code": "insufficient_stock",
    "message": "库存不足",
    "details": "门店 [SH002] 商品 [SKU004 手绘陶瓷杯] 库存不足: 可用 0，需调出 20",
    "suggestion": "请调整调拨数量或选择其他商品"
}
```

---

### 4. **联名商品同步异常** (409 Conflict)

**操作**: 尝试下架联名款 SKU002 故宫联名文创胶带（有待处理补货单）

```bash
PATCH /api/products/2/
Content-Type: application/json

{
    "status": "delisted"
}
```

**响应**:
```json
{
    "code": "collaboration_sync_error",
    "message": "联名商品同步失败",
    "details": "联名商品 [SKU002 故宫联名文创胶带 存在 2 条待处理补货单",
    "suggestion": "请先处理完相关补货单后再操作"
}
```

---

### 5. **数据偏差异常** (400 Bad Request)

**操作**: 补货单 RP-DEMO-005 收货时实收与实发不一致

```bash
POST /api/replenishment-orders/5/receive/
Content-Type: application/json

{
    "received_items": [
        {"item_id": 9, "received_quantity": 3},
        {"item_id": 10, "received_quantity": 18}
    ]
}
```

（SKU003 实发 5，实收 3；SKU009 实发 20，实收 18）

**响应**:
```json
{
    "code": "data_deviation",
    "message": "收货数据存在偏差",
    "details": "SKU003: 实发5，实收3，偏差-2；SKU009: 实发20，实收18，偏差-2",
    "suggestion": "请确认实际数量并在备注中说明偏差原因，或联系仓管核对"
}
```

---

### 6. **权限不足异常** (403 Forbidden)

**操作**: 门店B店长（store_manager2）登录后操作门店A的补货单 RP-DEMO-001

```bash
# 先用 store_manager2 登录获取 token
POST /api/token/
{
    "username": "store_manager2",
    "password": "123456"
}

# 然后尝试操作门店A的单据
POST /api/replenishment-orders/1/submit/
```

**响应**:
```json
{
    "code": "permission_denied",
    "message": "权限不足",
    "details": "您无权操作此门店的数据",
    "suggestion": "请联系管理员或对应门店人员操作"
}
```

---

### 7. **超期未整改筛选

**筛选**: GET /api/display-records/?has_overdue=true

会返回 3 条超期 7 天以上未整改的记录

---

### 8. **低库存预警筛选

**筛选**: GET /api/inventories/?low_stock=true

会返回库存低于安全库存的记录

---

## 六、刻意简化说明

为了聚焦核心业务逻辑，本演示版本做了以下简化：

1. **用户认证系统**
   - 使用简单的用户名密码认证，未接入企业SSO或第三方登录
   - 未实现密码重置、邮箱验证等功能
   - Token有效期8小时，未实现刷新Token的详细说明

2. **图片上传功能
   - 陈列照片、商品图片等功能仅预留字段，未实现实际文件上传

3. **通知系统**
   - 状态变更通知、待办提醒、短信/邮件通知等未实现

4. **工作流引擎**
   - 状态机逻辑硬编码在Service层，未接入专业工作流引擎
   - 未实现自定义审批流程配置

5. **库存成本核算**
   - 仅计算简单的库存数量管理，未实现先进先出、加权平均等成本核算

6. **前端界面
   - 仅提供REST API，未实现Web前端界面
   - 可通过DRF自带的浏览器界面进行交互

7. **数据同步机制**
   - 联名商品同步仅在Service层做简单校验，未实现与商品主数据系统对接

8. **批量操作**
   - 未实现批量审核、批量导出等批量操作

9. **数据权限粒度
   - 权限控制基于角色+门店，未实现细到字段级权限

10. **日志持久化**
    - 审计日志仅记录关键操作，未实现完整的数据库变更日志

---

## 七、系统架构

### 层次结构

```
┌─────────────────────────────────────────┐
│           REST API Layer (views.py)
│  ViewSet + Action + Permissions
├─────────────────────────────────────────┤
│         Service Layer (services/)
│  状态机 │ 业务逻辑 │ 校验规则
├─────────────────────────────────────────┤
│         Serializer Layer
│  数据校验 │ 序列化 │ _links导航
├─────────────────────────────────────────┤
│         Model Layer (models.py)
│  数据模型 │ 状态枚举 │ 关联关系
├─────────────────────────────────────────┤
│         Filter Layer (filters.py)
│  多维度筛选 │ 异常场景筛选
├─────────────────────────────────────────┤
│      Exception Layer (exceptions.py)
│  自定义异常 │ 统一异常处理
├─────────────────────────────────────────┤
│      Middleware (middleware.py)
│  审计日志 │ 请求响应记录
└─────────────────────────────────────────┘
```

### 设计特点

1. **厚服务层**: 核心业务逻辑全部封装在Service层，View层仅做参数解析和响应组装
2. **状态机驱动**: 补货单、调拨单等业务对象使用状态机模式，严格控制状态流转
3. **HATEOAS导航**: 通过`_links`字段串联列表-详情-动作，避免多层页面跳转
4. **统一异常处理**: 8种自定义异常，区分校验失败、权限不足、状态冲突等场景
5. **审计追踪**: 所有关键操作自动记录审计日志，支持追溯
6. **角色权限隔离**: 店长只能看到本店数据，企划和仓管可看全局

---

## 八、数据库表结构概览

| 表名 | 说明 |
|------|------|
| auth_user | Django用户表 |
| inventory_userprofile | 用户扩展表（角色、门店、电话）|
| inventory_storegroup | 门店群 |
| inventory_store | 门店 |
| inventory_product | 商品 |
| inventory_inventory | 库存 |
| inventory_replenishmentplan | 补货计划 |
| inventory_replenishmentorder | 补货单 |
| inventory_replenishmentitem | 补货单明细 |
| inventory_transferorder | 调拨单 |
| inventory_transferitem | 调拨单明细 |
| inventory_displayrecord | 陈列记录 |
| inventory_memberredemption | 会员兑换 |
| inventory_auditlog | 审计日志 |
