# 桶装水配送管理系统

一套完整的桶装水配送管理系统，包含月结客户管理、配送订单、回款提醒、异常处理等核心功能，数据全程留痕可追溯。

## 技术栈

- **前端**: React 18 + TypeScript + Vite + TailwindCSS
- **后端**: FastAPI + SQLAlchemy + SQLite
- **图标**: Lucide React

## 项目结构

```
.
├── backend/                    # 后端服务
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py            # FastAPI 主应用
│   │   ├── models.py          # 数据模型
│   │   ├── schemas.py         # Pydantic 模式
│   │   ├── database.py        # 数据库连接
│   │   └── init_data.py       # 初始化数据脚本
│   ├── requirements.txt       # Python 依赖
│   └── water_delivery.db      # SQLite 数据库（运行后生成）
└── frontend/                   # 前端应用
    ├── src/
    │   ├── components/        # 通用组件
    │   ├── pages/             # 页面组件
    │   │   ├── Dashboard.tsx  # 仪表盘首页
    │   │   ├── Customers.tsx  # 月结客户
    │   │   ├── Orders.tsx     # 配送订单
    │   │   ├── Payments.tsx   # 收款记录
    │   │   ├── Reminders.tsx  # 回款提醒
    │   │   └── Exceptions.tsx # 异常处理
    │   ├── services/          # API 服务
    │   ├── types/             # TypeScript 类型
    │   ├── App.tsx
    │   ├── main.tsx
    │   └── index.css
    ├── package.json
    ├── vite.config.ts
    └── tailwind.config.js
```

## 快速开始

### 1. 后端启动

```bash
# 进入后端目录
cd backend

# 创建虚拟环境
python3 -m venv venv
source venv/bin/activate  # macOS/Linux
# 或 venv\Scripts\activate  # Windows

# 安装依赖
pip install -r requirements.txt

# 初始化数据库和演示数据
python -m app.init_data

# 启动后端服务
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

后端 API 文档: http://localhost:8000/docs

### 2. 前端启动

新开一个终端窗口：

```bash
# 进入前端目录
cd frontend

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

前端访问地址: http://localhost:3000

## 功能模块

### 🏠 仪表盘 (Dashboard)

- 待处理订单统计
- 已驳回订单统计
- 需回查订单统计
- 待处理异常统计
- 待回款提醒统计
- 今日配送和本月营收数据
- 快速查看待处理事项列表

### 👥 月结客户 (Customers)

- 客户信息管理（新增、查看、编辑）
- 客户账务信息（欠款、空桶结余）
- 客户回款提醒记录
- 客户操作日志全程留痕
- 创建客户时自动生成回款提醒关联

### 📦 配送订单 (Orders)

- 订单创建与管理
- 送水/回桶数量记录
- 配送员和路线分配
- 订单状态流转（待处理→已完成/需回查/已驳回）
- 签收照片管理
- 订单操作日志记录

### 💰 收款记录 (Payments)

- 收款登记
- 多种付款方式支持
- 自动更新客户欠款
- 收款记录查询
- 累计收款统计

### 🔔 回款提醒 (Reminders)

- 自动关联客户欠款数据
- 到期日提醒
- 逾期预警
- 一键发送提醒
- 标记已回款（自动生成收款记录）

### ⚠️ 异常处理 (Exceptions)

**抽屉式交互设计，处理四类异常：**

1. **空桶争议** - 回桶数量不一致
2. **照片问题** - 签收照片缺失或模糊
3. **客户投诉** - 服务质量问题
4. **配送延迟** - 未按时送达

功能特性：
- 异常上报与分类
- 异常处理流程
- 处理结果记录
- 关联操作日志查看

## 数据留痕设计

所有关键操作均记录操作日志，包含：
- 操作人
- 操作时间
- 操作类型
- 变更前后值对比
- 操作关联的订单/客户

## 演示入口

启动项目后，访问 http://localhost:3000 即可进入系统。

系统已预置演示数据：
- 5 家月结客户
- 7 笔配送订单
- 3 笔收款记录
- 5 条回款提醒
- 3 个异常案例

## 业务数据流

```
创建订单 → 自动更新客户欠款/空桶结余 → 生成回款提醒
     ↓
  配送完成 → 签收确认 → 状态变更（全程留痕）
     ↓
  异常上报 → 异常处理 → 记录处理结果
     ↓
  客户回款 → 登记收款 → 更新欠款 → 完成回款提醒
```
