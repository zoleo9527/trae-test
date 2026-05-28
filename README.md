# 婚纱影楼 · 修片回传与客户复核工作台

> 把档期表、修片群和客户聊天里本来就互相牵连的信息，合并到同一份数据里，
> 让一线处理和管理回看基于同一套上下文。Nuxt 3 + FastAPI 全栈联调。

## 核心场景

- **首页概览**：进入即见「待复核 / 已驳回 / 需回查 / 未结清尾款」数量，以及受影响订单列表。
- **订单详情**：时间线（拍摄 / 选片 / 回传 / 回查 / 尾款）、批次回传、单张复核与二次回传。
- **连续回查面板**：同一订单的所有批次按版本聚合，并排对比，避免翻聊天记录找上下文。
- **复核 / 驳回 / 回查 / 二次回传**：前端动作即时刷新批次状态、订单列表和统计数据。

## 目录结构

```
.
├── backend/                 # FastAPI 后端
│   ├── main.py
│   ├── database.py          # SQLAlchemy + SQLite
│   ├── models.py            # Order / Batch / Photo / Review / TimelineEvent
│   ├── schemas.py           # Pydantic 模型
│   ├── crud.py              # 业务逻辑 + 种子数据
│   └── requirements.txt
└── frontend/                # Nuxt 3 前端
    ├── app.vue
    ├── nuxt.config.ts
    ├── package.json
    ├── composables/
    │   └── useWsApi.ts
    ├── assets/main.css
    └── pages/
        ├── index.vue        # 首页（dashboard + 订单列表）
        ├── orders/
        │   ├── index.vue    # 订单列表
        │   ├── [id].vue     # 订单详情（时间线 / 批次 / 复核）
        │   └── [id]/continuous.vue   # 连续回查面板
```

## 环境准备

- Node.js ≥ 18
- Python ≥ 3.11（venv 已在 `backend/venv/` 创建）

## 初始化与本地启动

### 1. 安装依赖

```bash
# 前端
cd frontend
npm install

# 后端
cd ../backend
source venv/bin/activate
pip install -r requirements.txt
# 若 Python 3.14 遇到 pydantic-core 编译失败，执行：
# PYO3_USE_ABI3_FORWARD_COMPATIBILITY=1 pip install -r requirements.txt
```

### 2. 启动后端（FastAPI）

```bash
cd backend
source venv/bin/activate
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

启动后访问：

- API 文档（Swagger）：http://localhost:8000/docs
- 健康检查：http://localhost:8000/api/health

**首次启动会自动创建 SQLite 数据库 `backend/wedding_studio.db`，并写入 4 个示例订单
（覆盖不同的拍摄/选片/回传/回查/尾款状态），无需手动执行种子脚本。**

### 3. 启动前端（Nuxt 3）

新开终端：

```bash
cd frontend
npm run dev
```

默认运行于 http://localhost:3000

如果后端不在 `http://localhost:8000`，启动前设置：

```bash
NUXT_PUBLIC_API_BASE=http://your-backend-host:8000/api npm run dev
```

## 演示入口

| 页面 | 地址 |
| --- | --- |
| 首页（dashboard + 订单列表） | http://localhost:3000 |
| 订单列表 | http://localhost:3000/orders |
| 订单详情（示例 1） | http://localhost:3000/orders/1 |
| 连续回查面板（示例 1） | http://localhost:3000/orders/1/continuous |
| 后端 Swagger | http://localhost:8000/docs |

## 主场景使用说明

### 首页

- 顶部 5 张数据卡片展示 **订单总数 / 待复核 / 已驳回 / 需回查 / 未结清尾款**。
- 列表支持按订单号/客户姓名搜索、按状态与门店筛选。
- 每行显示最新批次状态、待复核/已驳回/需回查数量、尾款状态、负责人。
- 点击「详情」进入订单详情；点击「连续回查」进入对比面板。

### 订单详情 `/orders/:id`

- **时间线**：拍摄、选片、回传、回查、尾款事件按时间倒序，一件事在一个入口看全。
- **批次回传**：每个批次一个 Tab，点击照片弹出单张复核对话框。
- **复核动作**：通过 / 驳回 / 回查，实时更新照片状态、批次状态与订单列表。
- **二次回传**：修片师上传新版本，版本号 +1，状态回到「待复核」，自动追加时间线。

### 连续回查面板 `/orders/:id/continuous`

- 所有批次的照片按版本聚合；可按批次切 Tab，也可按照片名并排对比多个版本（仅显示有多版本的照片）。
- 单击任一张照片即可在当前上下文里复核 / 驳回 / 回查 / 二次回传。
- 改期、版本混乱、客诉复盘所需信息在同一页面全部可见，不需要翻聊天记录。

## 数据准备

- 数据库：SQLite，首次启动 FastAPI 时自动建表并写入示例数据。
- 清理后重新初始化：删除 `backend/wedding_studio.db`，重启后端即可重新生成。
- 如需手动增加示例，编辑 `backend/crud.py` 中的 `seed_database` 函数后重启。

## 联调约定

- 前端通过 `composables/useWsApi.ts` 调用后端，统一错误提示（`ElMessage.error`）。
- 后端使用 CORS 全开，允许所有来源和方法（开发环境），生产环境请限制 `allow_origins`。
- 所有写操作（复核 / 回查 / 回传）完成后，前端自动重新拉取订单与统计数据，保证列表与详情状态一致。
