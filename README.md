# 游泳馆运营系统 - 课程排班与消课对账

## 项目概述

这是一个专为游泳馆设计的运营管理系统，核心解决**课程排班**与**消课对账**的全链路追踪问题。系统强调数据流转的可追溯性，让每一次课程、每一笔消费、每一个投诉都有完整的审计链条。

---

## 快速启动

### 1. 安装依赖

```bash
# 创建虚拟环境（推荐）
python3 -m venv venv
source venv/bin/activate  # macOS/Linux

# 安装依赖
pip install -r requirements.txt
```

### 2. 配置环境变量

```bash
cp .env.example .env
# 编辑 .env 文件，根据需要修改配置
```

### 3. 初始化数据库

```bash
python manage.py makemigrations
python manage.py migrate
```

### 4. 导入演示数据

```bash
python manage.py seed_demo_data
```

### 5. 启动服务

```bash
python manage.py runserver 0.0.0.0:8000
```

### 6. 访问系统

- API文档: http://localhost:8000/api/docs/
- 管理后台: http://localhost:8000/admin/

---

## 测试账号

| 用户名 | 密码 | 角色 | 权限说明 |
|--------|------|------|----------|
| `director` | `123456` | 馆长 | 全部权限，包括财务报表、审计日志、数据导出 |
| `coach_sup` | `123456` | 教练主管 | 排班管理、课程管理、考勤报表、投诉处理 |
| `frontdesk1` | `123456` | 前台客服 | 学员管理、报名、充值、消课、提交投诉 |
| `frontdesk2` | `123456` | 前台客服 | 同上 |
| `coach1` / `coach2` / `coach3` | `123456` | 教练 | 查看排班、签到考勤 |

---

## 核心功能模块

### 1. 课程排班 (schedule)
- **课程模板**: 定义课程类型、难度、时长、人数限制
- **学员档案**: 完整的学员信息，包括健康备注和游泳水平
- **排班管理**: 支持教练冲突检测、状态流转（草稿→发布→确认→完成）
- **报名管理**: 自动检测人数、课程状态、时间有效性
- **考勤管理**: 支持请假、签到、批量考勤

### 2. 储值管理 (membership)
- **套餐配置**: 支持次卡、期卡、储值卡三种类型
- **储值卡**: 余额/次数管理、有效期、冻结/解冻
- **充值记录**: 多种支付方式、交易流水号
- **消费记录**: 与课程报名自动关联，支持对账追踪
- **财务报表**: 按时间范围统计收支

### 3. 消课对账 (attendance)
- **对账批次**: 按日期范围批量消课
- **对账记录**: 每条消课的详细状态和错误信息
- **考勤汇总**: 日出勤率、消课金额自动统计
- **周度报表**: 按周汇总分析

### 4. 投诉与现场问题 (complaint)
- **问题分类**: 水质、设施、教练、服务、排课等
- **优先级**: 紧急问题自动通知馆长
- **处理流程**: 提交→分配→处理→解决→关闭，支持升级
- **处理记录**: 完整的评论和内部备注体系
- **超时预警**: 自动标记超期未处理问题

---

## 链式追踪设计

系统的核心设计理念是**"一条能来回追踪的链"**:

### 排班链
```
排班详情 → 报名列表 → 单个学员考勤 → 该学员的所有课程历史
           ↓
     消课对账记录 → 对应储值卡扣费流水
```

### 学员链
```
学员详情 → 所有报名记录 → 对应课程详情 → 该课程所有学员
           ↓
     储值卡详情 → 充值/消费流水
```

### 投诉链
```
投诉详情 → 关联学员 → 学员上课历史
     ↓
处理记录 → 操作人 → 时间线完整可追溯
```

---

## 异常场景演示数据

系统预置了多个可以直接触发异常处理的场景：

### 1. 请假消课计算异常
- **学员**: 钱多多
- **场景**: 剩余次数只有1次，但有2节已报名未消课的课程
- **触发**: 对包含钱多多的已完成排班执行消课对账
- **预期**: 系统会标记失败，错误信息为"次数不足"

### 2. 教练排班冲突
- **教练**: coach1
- **场景**: 为coach1在已有排班的时间段创建新排班
- **触发**: POST /api/schedule/schedules/ 传入冲突时间
- **预期**: 返回状态冲突错误，提示"该教练在当前时间段已有排班"

### 3. 学员重复报名
- **学员**: 张小明 (已有课程报名)
- **场景**: 为张小明再次报名同一课程
- **触发**: POST /api/schedule/enrollments/ 使用相同的schedule_id和student_id
- **预期**: 返回状态冲突错误，提示"该学员已报名此课程"

### 4. 状态流转冲突
- **排班**: 任意已完成的排班
- **场景**: 尝试将已完成的排班改回"已发布"
- **触发**: POST /api/schedule/schedules/{id}/update_status/ 传入无效状态
- **预期**: 返回状态冲突错误，列出允许的状态转换

### 5. 储值卡余额不足
- **学员**: 钱多多 (余额50元，剩余次数1次)
- **场景**: 尝试扣费超过余额或次数
- **触发**: POST /api/membership/consumptions/ 大额消费
- **预期**: 返回校验错误，显示当前余额和需要金额

### 6. 紧急投诉处理
- **已预置**: "孩子泳池边滑倒磕破头"
- **优先级**: URGENT (自动分配给馆长)
- **场景**: 查看该投诉详情和处理记录
- **触发**: 尝试关闭该投诉（非馆长/主管会被拒绝）
- **预期**: 非处理人或主管无法关闭

### 7. 消课重复扣费保护
- **场景**: 对同一排班重复执行消课对账
- **触发**: 多次调用 POST /api/membership/consumptions/reconcile/
- **预期**: 已产生消费记录的报名会被跳过并标记"已存在消费记录"

---

## API 快速参考

### 认证
```bash
# 登录
POST /api/auth/login/
{"username": "director", "password": "123456"}

# 获取当前用户
GET /api/auth/me/

# 登出
POST /api/auth/logout/
```

### 课程排班
```bash
# 排班列表（支持筛选）
GET /api/schedule/schedules/?status=published&coach_id=1

# 创建排班（自动教练冲突检测）
POST /api/schedule/schedules/

# 查看排班完整链条（含报名、考勤统计）
GET /api/schedule/schedules/{id}/chain/

# 排班状态变更
POST /api/schedule/schedules/{id}/update_status/

# 学员报名
POST /api/schedule/enrollments/

# 申请请假
POST /api/schedule/enrollments/{id}/apply_leave/

# 更新考勤
POST /api/schedule/enrollments/{id}/update_attendance/

# 批量考勤
POST /api/schedule/enrollments/batch_attendance/

# 考勤报表
GET /api/schedule/schedules/attendance_report/

# 查看学员完整链条
GET /api/schedule/students/{id}/chain/
```

### 储值管理
```bash
# 开卡
POST /api/membership/cards/

# 充值
POST /api/membership/recharges/

# 消费
POST /api/membership/consumptions/

# 消课对账（按排班）
POST /api/membership/consumptions/reconcile/

# 财务报表
GET /api/membership/consumptions/financial_report/

# 储值卡完整链条
GET /api/membership/cards/{id}/chain/

# 导出数据（仅馆长）
GET /api/membership/cards/?export=1
```

### 消课对账
```bash
# 创建对账批次
POST /api/attendance/batches/

# 执行对账
POST /api/attendance/batches/{id}/process/

# 考勤汇总
GET /api/attendance/summaries/?by_week=1
```

### 投诉处理
```bash
# 投诉列表（支持筛选我的待办）
GET /api/complaint/?my=1&overdue=1

# 提交投诉
POST /api/complaint/

# 分配处理人
POST /api/complaint/{id}/assign/

# 更新状态
POST /api/complaint/{id}/update_status/

# 添加处理记录
POST /api/complaint/{id}/add_comment/

# 升级问题
POST /api/complaint/{id}/escalate/

# 投诉统计
GET /api/complaint/statistics/
```

### 审计日志
```bash
# 审计日志（仅馆长）
GET /api/auth/audit-logs/

# 查看某条记录的完整操作轨迹
GET /api/auth/audit-logs/trail/?content_type=enrollment&object_id=1
```

---

## 权限矩阵

| 功能 | 馆长 | 教练主管 | 前台客服 | 教练 |
|------|------|----------|----------|------|
| 课程管理(增删改) | ✅ | ✅ | ❌ | ❌ |
| 排班管理(增删改) | ✅ | ✅ | ❌ | ❌ |
| 学员管理 | ✅ | ✅ | ✅ | ❌ |
| 报名/请假 | ✅ | ✅ | ✅ | ❌ |
| 考勤签到 | ✅ | ✅ | ✅ | ✅ |
| 开卡/充值 | ✅ | ❌ | ✅ | ❌ |
| 消课对账 | ✅ | ❌ | ✅ | ❌ |
| 财务报表 | ✅ | ❌ | ❌ | ❌ |
| 数据导出 | ✅ | ❌ | ❌ | ❌ |
| 投诉处理 | ✅ | ✅ | 仅提交 | ❌ |
| 审计日志 | ✅ | ❌ | ❌ | ❌ |

---

## 刻意简化的部分

本系统是一个MVP版本，以下部分做了刻意简化，生产环境需要补充：

1. **权限控制**:
   - 目前仅基于角色做粗粒度控制，实际项目中需要按场馆、按数据范围做细粒度权限
   - 未集成django-guardian的对象级权限

2. **支付对接**:
   - 目前仅记录支付方式和流水号，未实际对接微信/支付宝等支付渠道
   - 充值金额直接入账，生产环境需要对账机制

3. **消息通知**:
   - 紧急投诉仅做了自动分配，未实际发送短信/APP推送
   - 课程提醒、消课通知等需要对接消息队列

4. **前端界面**:
   - 本版本仅提供API接口，前端界面需要单独开发
   - 不同角色的工作台视图需要按角色定制

5. **多场馆支持**:
   - 目前是单场馆设计，连锁场馆需要增加场馆维度和数据隔离

6. **缓存与性能**:
   - 未做缓存优化，高并发场景需要增加Redis缓存
   - 对账、报表等耗时操作应改为异步任务

7. **图片/文件存储**:
   - 目前使用本地文件存储，生产环境建议使用云存储(OSS/S3)

8. **审计日志的完整性**:
   - 目前通过信号和中间件捕获大部分操作，但某些批量操作可能遗漏
   - 敏感操作(如删除)需要更严格的审计

---

## 常见问题

### Q: 如何重置演示数据？
```bash
rm db.sqlite3
python manage.py migrate
python manage.py seed_demo_data
```

### Q: 如何创建新的测试账号？
```bash
python manage.py createsuperuser
```

### Q: 导出功能报错？
确保安装了openpyxl: `pip install openpyxl`

---

## 技术栈

- **框架**: Django 4.2 + Django REST Framework 3.14
- **数据库**: SQLite3 (可无缝切换到PostgreSQL/MySQL)
- **权限**: django-guardian (对象级权限预留)
- **过滤**: django-filter
- **文档**: drf-spectacular (Swagger/OpenAPI 3.0)
- **导出**: openpyxl (Excel)

---

## 设计亮点

1. **状态机**: 所有核心业务对象都有明确的状态流转规则，防止非法操作
2. **审计追踪**: 所有变更自动记录操作人、时间、变更前后值
3. **厚服务层**: 业务逻辑集中在services.py，视图层仅做参数校验和响应格式化
4. **统一异常**: 区分校验失败、权限不足、状态冲突等错误类型
5. **链式查询**: 每个核心对象都提供chain接口，一键查看完整关联链条
