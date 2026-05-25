# 水果批发 · 进货分级与档口配货台账

基于 Nuxt 3 + FastAPI 的档口业务台账，从散落在过磅单、冷库表、客户电话单里的碎片数据，整合出一条完整链路：**过磅 → 分级 → 配货 → 赊销 → 回款 → 异常**。

核心设计：**同一数据源、三种角色视角、连续回查面板**。档口负责人看整体推进、配货员处理明细、财务盯异常和回查——都基于同一套数据。

---

## 快速启动

### 1. 后端 (FastAPI + SQLite)

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

后端自动创建 SQLite 数据库 `backend/fruit_stall.db` 并注入演示数据（5 条进货单、7 条异常记录）。

### 2. 前端 (Nuxt 3)

```bash
cd frontend
npm install
NUXT_TELEMETRY_DISABLED=1 npx nuxt dev -p 3002 --host 0.0.0.0
```

前端通过 `frontend/server/api/[...].ts` 代理到 `http://127.0.0.1:8000`，无需配置 CORS。

### 3. 访问

打开 `http://localhost:3002/login`，用以下测试账号登录。

---

## 测试账号

| 角色 | 账号 | 密码 | 说明 |
|------|------|------|------|
| 档口负责人 | `admin` | `admin123` | 全权限，查看整体推进 |
| 配货员 | `picker` | `picker123` | 负责分级和配货 |
| 财务记账 | `finance` | `finance123` | 盯异常、查回款 |

切换角色：页面左下角的角色切换按钮。

---

## 演示数据说明

系统预置了以下进货单（可直接触发异常处理）：

| 单号 | 品名 | 场景 | 异常点 |
|------|------|------|--------|
| CG20260520-001 | 烟台红富士 | 正常单，完整链路 | 无异常 |
| CG20260521-002 | 阿克苏冰糖心 | **高损耗 + 客诉 + 赔付** | 损耗 35%，客户拒收，赔付 ¥8,000 |
| CG20260510-003 | 赣南脐橙 | **逾期货款** | 大润发逾期 3 天未回款 |
| CG20260524-004 | 金煌芒果 | 刚到货未分级 | 等待分级处理 |
| CG20260515-005 | 阳山水蜜桃 | **高损耗 + 客诉待处理** | 损耗 41%，客诉待处理 |

建议先点进 **CG20260521-002** 体验完整的异常回查链路。

---

## 刻意简化的范围

为了聚焦核心业务链路，以下功能做了刻意简化，实际上线需要补齐：

1. **认证 & 权限**：JWT 仅做简单角色区分（`stall_manager` / `picker` / `finance`），没有细粒度按钮级权限控制，没有 OAuth/SSO。
2. **数据库**：用 SQLite 单文件，没有考虑并发写入和数据备份。生产环境建议 PostgreSQL。
3. **金额/重量精度**：统一用 `float`，没有用 `Decimal`。实际财务场景应切换到高精度类型。
4. **文件/图片**：异常记录的 `evidence` 字段是文本，没有真实文件上传。
5. **客户/供应商管理**：只有基础 CRUD，没有联系人多角色、没有地址簿、没有信誉等级。
6. **报表 & 导出**：没有导出 Excel/PDF，没有按日/周/月维度的报表汇总。
7. **消息通知**：没有短信/微信提醒，没有待办推送。
8. **审计日志**：没有操作日志（谁在什么时候改了什么）。
9. **多冷库/多档口**：目前是单档口单冷库，没有仓库/档口维度。
10. **前端**：没有分页，大量数据时列表会一次性渲染。

---

## 目录结构

```
├── backend/
│   ├── app/
│   │   ├── main.py           # FastAPI 入口
│   │   ├── models.py         # SQLAlchemy 模型
│   │   ├── schemas.py        # Pydantic schema
│   │   ├── database.py       # 数据库连接
│   │   ├── auth.py           # JWT 认证
│   │   ├── seed.py           # 演示数据
│   │   └── routers/
│   │       ├── purchases.py  # 进货单
│   │       ├── gradings.py   # 分级
│   │       ├── allocations.py# 配货
│   │       ├── sales.py      # 赊销/回款
│   │       ├── exceptions.py # 异常记录
│   │       ├── review.py     # 回查/统计
│   │       └── base.py       # 客户/供应商基础数据
│   └── requirements.txt
└── frontend/
    ├── pages/
    │   ├── index.vue         # 概览
    │   ├── purchases/        # 进货单（含详情+回查面板）
    │   ├── gradings.vue      # 分级
    │   ├── allocations.vue   # 配货
    │   ├── sales.vue         # 赊销/回款
    │   └── exceptions.vue    # 异常看板
    ├── components/
    │   └── TraceStep.vue     # 连续回查步骤组件
    ├── stores/auth.ts        # Pinia 认证
    ├── plugins/fetch.ts      # 全局 fetch 客户端
    └── server/api/[...].ts   # 后端代理
```