# 商用清洁 - 质检抽查与整改闭环

项目排班、质检抽查、整改闭环、耗材补货、续约回访 一体化后端管理系统。

## 本地启动

```bash
# 1. 进入项目目录
cd cleaning-quality

# 2. 安装依赖
pip install -r requirements.txt

# 3. 初始化数据库并写入演示数据
python init_db.py

# 4. 启动服务
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## 演示入口

| 入口 | 地址 |
|------|------|
| Swagger UI (交互式文档) | http://localhost:8000/docs |
| ReDoc (阅读文档) | http://localhost:8000/redoc |
| 首页 Dashboard | http://localhost:8000/api/v1/dashboard |
| 服务根信息 | http://localhost:8000/ |

## 初始化说明

- 首次启动时 `uvicorn` 会自动建表（SQLite 文件: `cleaning_quality.db`）
- 运行 `python init_db.py` 写入演示数据（3 个项目、4 条排班、3 次质检、3 条整改、4 种耗材、2 条补货单、3 份合同）
- 重复运行 `init_db.py` 不会覆盖已有数据

## 核心业务流程

```
质检抽查 → 发现问题 → 创建整改单 → 指派负责人 → 开始整改 → 提交结果 → 审核通过/驳回
                                                              ↑                     |
                                                              +--- 驳回后重新整改 ---+
```

## API 一览

| 模块 | 路径前缀 | 说明 |
|------|----------|------|
| Dashboard | `/api/v1/dashboard` | 首页待处理/已驳回/需回查统计 |
| 审计日志 | `/api/v1/audit-logs` | 全量操作留痕查询 |
| 项目 | `/api/v1/projects` | 项目基础信息 CRUD |
| 排班打卡 | `/api/v1/schedules` | 排班、签到/签退、漏打卡统计 |
| 质检抽查 | `/api/v1/inspections` | 质检单创建、状态流转、逐项评分 |
| 整改闭环 | `/api/v1/rectifications` | 创建→指派→整改→提交→审核→驳回重做 |
| 耗材管理 | `/api/v1/consumables` | 库存状态自动判定、补货申请→审批→到货 |
| 合同续约 | `/api/v1/contracts` | 到期提醒、续约回访 |

## 状态机

### 质检状态流转
`pending → in_progress → completed/skipped`

### 整改状态流转
`pending → assigned → in_progress → submitted → approved/rejected`
- `rejected → in_progress`（驳回后重新整改）
- `pending/assigned/in_progress` 超过 deadline 自动标记 `overdue`
- `overdue → in_progress/assigned`（恢复后继续）

### 耗材状态自动判定
- `critical`（库存=0）→ `reorder`（库存<阈值50%）→ `low`（库存<阈值）→ `normal`

### 合同状态流转
`active → renewal_pending → renewing → active`
- 任意时刻可 `expired / terminated`

## 审计留痕

- 每次创建、更新、状态变更均写入 `audit_logs` 表
- 记录字段：操作人 ID、姓名、角色、变更前后值、操作详情
- 中间件层额外记录所有写请求（POST/PUT/PATCH/DELETE）的访问日志
- 审计日志通过 `/api/v1/audit-logs` 可按实体类型、实体ID、操作人、动作类型筛选
