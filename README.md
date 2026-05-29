# 苗木基地管理系统 — 起苗排单与装车复核

## 项目概述

将起苗排单和装车复核接入同一链路，覆盖从排单创建、养护确认、起苗执行到装车复核的全流程，异常上报与处理全程留痕可回查。

## 技术栈

| 层 | 选型 |
|---|---|
| 前端 | React 19 + Vite + Ant Design 6 + React Router 7 |
| 后端 | Python 3 / FastAPI + SQLAlchemy + Pydantic v2 |
| 数据库 | SQLite（单文件 `backend/nursery.db`） |

## 启动方式

### 后端

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

- 服务地址：`http://localhost:8000`
- API 文档：`http://localhost:8000/docs`
- 首次启动自动写入演示数据；重置数据只需 `rm nursery.db` 后重启

### 前端

```bash
cd frontend
npm install
npm run dev
```

- 默认地址：`http://localhost:5173`（被占用时自动切到 5174）
- 后端 CORS 已放行 5173 / 5174 两个端口

## 测试账号

| 用户名 | 姓名 | 角色 |
|--------|------|------|
| `zhangjg` | 张建国 | 基地负责人 |
| `liyh` | 李养护 | 养护员 |
| `wanggd` | 王跟单 | 销售跟单 |

> 无密码，输入用户名即可登录。登录态存于浏览器 localStorage。

## 演示数据

系统预置以下数据，可直接触发异常处理流程：

| 类型 | 数量 | 说明 |
|------|------|------|
| 地块 | 5 | A1香樟、A2桂花、B1红叶石楠、B2银杏、C1紫薇 |
| 排单 | 6 | 已完成×2、起苗中×1、已确认×1、待确认×1、异常×1 |
| 装车记录 | 3 | 已复核×1、异常×1（数量差异自动触发）、待装车×1 |
| 异常记录 | 4 | 见下表 |

**异常记录详情：**

| 严重程度 | 类型 | 来源 | 状态 | 触发场景 |
|----------|------|------|------|----------|
| 紧急 | 病害 | 起苗 #6 | 处理中 | B1红叶石楠起苗时发现根腐病 |
| 严重 | 数量差异 | 装车 #2 | 待处理 | 计划80棵实际66棵，差14棵 |
| 一般 | 质量问题 | 养护 #2 | 处理中 | A2桂花部分苗木偏小 |
| 紧急 | 客户索赔 | 装车 #1 | 待处理 | 客户收货后发现死苗 |

## 核心业务链路

```
创建排单 → 确认排单 → 开始起苗 → 完成起苗
   ↓                                    ↓
锁定地块(扣减可用数 + 已排单)      可用数为0则地块→已起苗
                                        ↓
                                  创建装车记录 → 填写实装 → 复核确认
                                                       ↓
                                                数量差异 → 自动创建异常
```

**异常分支：**
- 起苗中/已确认 → 上报异常 → 排单状态变"异常"，异常记录全程留痕
- 异常抽屉：待处理 → 填写处理方案 → 开始处理 → 填写结果 → 关闭异常

## 项目结构

```
backend/
├── main.py              # FastAPI 入口 + CORS + 路由注册
├── database.py          # SQLite 连接
├── models.py            # 6 个 ORM 模型
├── schemas.py           # Pydantic 请求/响应模型
├── seed.py              # 演示数据
├── requirements.txt     # Python 依赖
└── routers/
    ├── auth.py          # POST /api/auth/login
    ├── plots.py         # 地块 CRUD
    ├── orders.py        # 排单管理 + 状态流转 + 异常上报
    ├── loading.py       # 装车复核 + 填写实装 + 复核确认
    ├── exceptions.py    # 异常管理 + 精确回查
    ├── dashboard.py     # 看板统计 + 待办
    └── audit.py         # 操作留痕查询

frontend/src/
├── App.jsx              # 主布局 + 路由 + 登录
├── api.js               # Axios 实例
├── contexts/
│   └── AuthContext.jsx   # 认证上下文
├── pages/
│   ├── Dashboard.jsx     # 看板
│   ├── Orders.jsx        # 起苗排单
│   ├── Loading.jsx       # 装车复核
│   └── Exceptions.jsx    # 异常管理
└── components/
    ├── ExceptionDrawer.jsx  # 异常处理抽屉
    ├── AuditTimeline.jsx    # 操作留痕时间线
    └── StatusTag.jsx        # 状态标签
```

## 刻意简化项

| 简化点 | 说明 |
|--------|------|
| 认证鉴权 | 无密码/JWT，仅用 username 查询匹配，登录态存 localStorage |
| 角色权限 | 三角色在 UI 上区分展示但未做后端权限校验，任何账号可执行所有操作 |
| 通知推送 | 无 WebSocket/消息通知，需手动刷新页面 |
| 数据校验 | 前端有基础表单校验，后端缺少部分业务校验（如起苗数量不可超过可用数的前端提示） |
| 地块回退 | 完成起苗后地块状态单向流转，未实现撤销/回退操作 |
| 移动端适配 | 仅桌面端布局，未做响应式 |
| 并发控制 | SQLite 单写，无乐观锁/悲观锁，多标签页同时操作可能冲突 |
