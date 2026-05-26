# 游泳馆运营-水质巡检与整改回查

一个面向「馆长 / 教练主管 / 前台客服」的日常运营台：把**课程表、储值记录、水质巡检、整改回查、请假消课、投诉回看**放到同一张桌面上，
让常用动作沉在页面里，不再靠聊天工具拼上下文、靠记忆补步骤。

## 技术栈

- 前端：Nuxt 3 + TypeScript + Tailwind CSS + Pinia
- 后端：FastAPI（Python 3.10+）
- 数据：内存存储（首次启动自动 seed 演示数据）

前端跑在 `http://localhost:3000`，后端跑在 `http://localhost:8000`。
前端通过 `runtimeConfig.public.apiBase` 调用后端 `/api/v1`。

## 目录结构

```
.
├── backend/           # FastAPI 服务
│   ├── app/
│   │   ├── main.py
│   │   ├── models.py        # 数据模型与接口入参
│   │   ├── store.py         # 内存存储与演示数据
│   │   ├── config.py
│   │   └── routes/
│   │       ├── dashboard.py
│   │       ├── coaches.py
│   │       ├── members.py
│   │       ├── courses.py
│   │       ├── leaves.py
│   │       ├── water_quality.py   # 巡检 / 整改 / 回查
│   │       └── complaints.py
│   ├── pyproject.toml
│   └── requirements.txt
└── frontend/          # Nuxt 3 页面
    ├── pages/         # 首页 / 课程 / 会员 / 巡检 / 整改回查 / 请假 / 投诉
    ├── components/
    │   ├── ExceptionDrawer.vue
    │   └── drawers/   # 各类异常处理抽屉
    ├── composables/
    ├── layouts/
    ├── assets/css/main.css
    ├── nuxt.config.ts
    └── package.json
```

## 本地启动

### 1. 启动 FastAPI 后端

```bash
cd backend

# 推荐使用 venv
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# 启动
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

健康检查：

```bash
curl http://localhost:8000/health
```

主要 API（前缀 `/api/v1`）：

- `GET  /api/v1/dashboard` —— 首页统计与最近动态
- `GET|POST  /api/v1/coaches`
- `GET|POST  /api/v1/members`
- `GET  /api/v1/members/{id}/stored-value`
- `POST /api/v1/members/{id}/stored-value` —— 充值 / 消费 / 退款
- `GET|POST|PATCH  /api/v1/courses`
- `GET|POST  /api/v1/leaves`
- `POST /api/v1/leaves/{id}/review` —— 批准 / 驳回
- `GET|POST  /api/v1/inspections`
- `POST /api/v1/inspections/{id}/rectify` —— 对异常项发起整改
- `GET  /api/v1/rectifications`
- `POST /api/v1/rectifications/{id}/submit` —— 提交待回查
- `GET|POST  /api/v1/rechecks`
- `GET  /api/v1/complaints`

### 2. 启动 Nuxt 3 前端

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

打开 <http://localhost:3000>。

> 如需调整后端地址，修改 `frontend/.env` 中的 `NUXT_PUBLIC_API_BASE`。

## 演示入口

首次启动后端会自动 seed 一批演示数据（教练、会员、课程、巡检、整改、回查、请假、投诉），可直接体验：

| 页面 | 地址 | 说明 |
| --- | --- | --- |
| 首页总览 | http://localhost:3000/ | 待处理 / 已驳回 / 需回查 / 异常水质 等统计 + 最近动态 |
| 课程表 | http://localhost:3000/courses | 按日期查看，可标记完成 / 请假消课 / 取消 |
| 会员储值 | http://localhost:3000/members | 会员余额 + 储值流水 |
| 水质巡检 | http://localhost:3000/inspections | 记录巡检，异常一键发起整改 |
| 整改与回查 | http://localhost:3000/rectifications | 整改 → 提交 → 回查闭环 |
| 请假与消课 | http://localhost:3000/leaves | 新请假、审核（抽屉内） |
| 投诉回看 | http://localhost:3000/complaints | 投诉留痕 |

## 初始化方式

- 后端：首次启动 `uvicorn` 时，`app/store.py` 的 `Store._seed()` 自动生成演示数据。无需手动迁移。
- 前端：`npm install` 后 `npm run dev` 即可，`@nuxtjs/tailwindcss` 会在首次启动时生成 `.nuxt`。

> 这是一套纯演示环境，**数据存在内存中**，后端重启后恢复初始 seed 状态。
> 如需持久化，可将 `store.py` 替换为 SQLAlchemy / Tortoise ORM 等实现，路由层无需调整。

## 异常处理抽屉

所有会打断操作流的动作（请假审核、创建请假、创建整改、回查、新建巡检）都通过右侧抽屉（`ExceptionDrawer.vue`）
完成，避免页面跳转打断上下文。抽屉打开时遮罩点击空白可关闭，提交成功后自动刷新当前页数据。

## 留痕与回查

- 任何一次「请假消课」都会写入对应会员的储值流水（调用 `POST /api/v1/members/{id}/stored-value`）。
- 审核请假时必须留下 `reviewer` 与 `review_note`，便于事后回查。
- 水质巡检 → 整改 → 回查 是一条完整链路，任意一环都会更新对应状态，首页统计随之变化。
