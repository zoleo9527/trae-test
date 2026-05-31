# 地坪施工工地进度与质量复查系统

## 项目简介

针对地坪施工行业目前依赖施工日报、发货回单和变更签认表人工管理的痛点，本系统实现了工地进度、质量复查和班组结算的一体化管理，重点解决异常处理流程不透明、返工原因无法追溯、材料去向不明导致的结算争议等问题。

## 技术栈

- **前端**: Nuxt 3 + Vue 3 + TypeScript + Tailwind CSS + Pinia
- **后端**: FastAPI + SQLAlchemy + Pydantic + SQLite
- **认证**: JWT Token + OAuth2

## 项目结构

```
trae-test-4/
├── backend/                    # FastAPI 后端
│   ├── app/
│   │   ├── main.py            # 应用入口
│   │   ├── models.py          # 数据模型
│   │   ├── schemas.py         # Pydantic 模式
│   │   ├── database.py        # 数据库连接
│   │   ├── auth.py            # 认证逻辑
│   │   ├── seed_data.py       # 演示数据
│   │   └── routers/           # API路由
│   ├── init_db.py             # 数据库初始化脚本
│   └── requirements.txt       # Python依赖
└── frontend/                   # Nuxt 3 前端
    ├── pages/                 # 页面组件
    ├── layouts/               # 布局组件
    ├── stores/                # Pinia状态管理
    ├── composables/           # 组合式函数
    ├── assets/                # 静态资源
    └── nuxt.config.ts         # Nuxt配置
```

## 核心功能

### 1. 双栏详情台设计
所有业务页面采用左列表+右详情的双栏布局，支持从列表直接查看详情和执行处理动作，避免多层页面跳转。

### 2. 工地进度管理
- 施工日报录入与审核
- 异常标记与处理流程
- 自动关联质量检查记录
- 项目进度实时统计

### 3. 质量复查管理
- 质量检查记录录入
- 返工整改流程（整改-复检闭环）
- 返工原因与材料浪费追溯
- 整改期限管理

### 4. 班组结算管理
- 自动关联施工面积和返工扣款
- 材料损耗自动计算
- 结算争议处理流程
- 争议解决记录留存

### 5. 材料管理
- 材料配送单管理
- 质量问题记录与退货处理
- 批次追溯

## 快速启动

### 后端启动

```bash
cd backend

# 安装依赖
pip install -r requirements.txt

# 初始化数据库（导入演示数据）
python init_db.py

# 启动服务
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

后端API文档: http://localhost:8000/docs

### 前端启动

```bash
cd frontend

# 安装依赖
npm install

# 启动开发服务
npm run dev
```

前端访问: http://localhost:3000

## 测试账号

| 用户名 | 密码 | 角色 | 说明 |
|--------|------|------|------|
| admin | admin123 | 系统管理员 | 全权限 |
| manager | 123456 | 项目负责人 | 查看整体进度、审核、处理结算 |
| inspector | 123456 | 质检工程师 | 质量检查、整改确认、复检 |
| leader1 | 123456 | 班组长 | 查看施工日志、异常和回查 |
| leader2 | 123456 | 班组长 | 查看施工日志、异常和回查 |

## 演示数据说明

系统预置了多条可直接触发异常处理的演示数据：

### 待处理异常
1. **智慧产业园A1栋** - 2026-05-21施工日志：突发阵雨导致200㎡地坪起砂，需返工处理
2. **物流仓储中心** - 2026-05-19施工日志：300㎡区域基层强度不足，固化处理后仍起砂

### 需返工整改
1. **智慧产业园A1栋** - 雨淋区域返工，面积200㎡，整改期限2026-05-25
2. **物流仓储中心** - 基层强度不足返工，面积300㎡，整改期限2026-05-23

### 已处理异常（可查看处理流程）
1. **生物医药基地** - 环氧材料批次色差问题，已换货处理

### 结算争议
1. **智慧产业园A1栋** - 5月下半月结算：班组认为雨淋返工是不可抗力，不应全额扣款25500元，要求各承担50%

## 刻意简化的部分

1. **权限控制**：仅实现了简单的角色区分，未做细粒度的接口权限控制
2. **文件上传**：施工照片、验收资料等附件上传功能未实现
3. **消息通知**：异常发生、整改到期等提醒通知功能未实现
4. **复杂报表**：仅提供基础统计，未做多维度数据分析报表
5. **导出功能**：PDF/Excel导出功能未实现
6. **数据库**：使用SQLite便于演示，生产环境建议使用PostgreSQL
7. **多租户**：未实现多项目、多公司的数据隔离
8. **操作日志**：详细的操作审计日志未实现

## API接口

### 认证
- `POST /api/auth/login` - 登录
- `GET /api/auth/me` - 获取当前用户

### 项目
- `GET /api/projects` - 项目列表
- `GET /api/projects/{id}` - 项目详情
- `GET /api/projects/{id}/progress` - 项目进度统计

### 施工日志
- `GET /api/diaries` - 施工日志列表
- `GET /api/diaries/{id}` - 施工日志详情
- `POST /api/diaries` - 创建施工日志
- `PUT /api/diaries/{id}` - 更新施工日志
- `POST /api/diaries/{id}/handle-exception` - 处理异常

### 质量检查
- `GET /api/inspections` - 检查记录列表
- `POST /api/inspections` - 创建检查记录
- `POST /api/inspections/{id}/complete-rectification` - 完成整改
- `POST /api/inspections/{id}/reinspect` - 复检

### 结算
- `GET /api/settlements` - 结算单列表
- `POST /api/settlements/{id}/resolve-dispute` - 解决争议

### 仪表盘
- `GET /api/dashboard/stats` - 统计数据
- `GET /api/dashboard/exceptions` - 异常列表
- `GET /api/dashboard/recent-activities` - 最近动态
