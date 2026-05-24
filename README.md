# 家装监理-工地巡检与整改复查系统

## 项目简介

本系统是针对家装监理业务的工地巡检与整改复查管理系统，解决了传统业务中效率低、追责难、信息断层等问题。

## 核心功能

- **工地巡检管理**：创建、查看、管理巡检单，记录问题点
- **整改复查流程**：从巡检问题自动生成整改单，跟踪整改进度
- **状态时间轴**：完整记录每次状态变更，实现审计追踪
- **批量操作**：支持批量更新状态，提升高峰期处理效率
- **费用确认**：整改费用逐项确认，避免纠纷
- **版本追踪**：记录单据版本变更，解决签认不一致问题

## 技术栈

### 后端
- **框架**: FastAPI 0.104.1
- **ORM**: SQLAlchemy 2.0
- **数据库**: SQLite

### 前端
- **框架**: React 18
- **构建工具**: Vite 5
- **样式**: Tailwind CSS 3
- **路由**: React Router 6
- **图标**: Lucide React

## 启动方式

### 后端启动

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

后端 API 文档：http://localhost:8000/docs

### 前端启动

```bash
cd frontend
npm install
npm run dev
```

前端访问地址：http://localhost:3000

## 测试账号

系统预置了以下角色的测试账号，用于演示不同角色的业务链路：

| 用户名 | 姓名 | 角色 | 说明 |
|--------|------|------|------|
| supervisor1 | 张监理 | 监理负责人 | 负责工地巡检、问题记录、复查确认 |
| manager1 | 李管家 | 项目管家 | 负责项目协调、异议处理 |
| service1 | 王客服 | 业主客服 | 负责业主沟通、费用确认 |
| worker1 | 陈工长 | 施工工长 | 负责整改执行、进度上报 |

## 演示数据说明

系统启动时会自动创建以下演示数据，包含多种异常处理场景：

### 巡检单
1. **泥木工程中期巡检** - 整改中（高优先级）
   - 问题：卫生间防水层厚度不足、地漏坡度不够、墙面平整度超标
   - 异常：已发起整改，部分问题已完成

2. **水电工程验收** - 已完成
   - 问题：接线盒未加盖板（轻微问题，现场整改）

3. **油漆工程巡检** - 待处理
   - 待巡检，演示新单处理流程

4. **墙砖铺贴质量复检** - 有异议
   - 问题：墙砖空鼓率超标、阴阳角不垂直
   - 异常：整改完成后业主不认可，存在异议

5. **隐蔽工程巡检** - 待复查（紧急）
   - 问题：水管打压试验不合格
   - 异常：整改已超期1天，待复查

### 典型业务场景

#### 场景1：正常巡检整改流程
1. 监理创建巡检单，记录问题点
2. 系统自动生成整改单派给工长
3. 工长完成整改，标记待复查
4. 监理复查通过，巡检完成

#### 场景2：异议处理
1. 整改完成提交复查
2. 监理复查时业主提出异议
3. 系统标记"有异议"状态，管家介入协调
4. 重新整改或协商解决方案

#### 场景3：超期预警
1. 整改单设置截止日期
2. 超期后系统自动标红提醒
3. 工作台显示超期提醒横幅

#### 场景4：批量操作
1. 在巡检列表勾选多张单据
2. 底部出现批量操作栏
3. 可批量更新状态，提升效率

## 刻意简化的部分

本演示系统为了快速跑通业务链，对以下部分做了简化：

1. **用户认证**：未实现登录注册，默认以"张监理"身份操作
2. **文件上传**：照片上传功能未实现，仅保留数据模型
3. **消息通知**：站内信、短信、微信通知未实现
4. **权限控制**：角色权限未做细粒度控制
5. **数据导出**：PDF、Excel 导出功能未实现
6. **业主端**：仅实现了内部管理端，业主小程序/网页未实现
7. **统计报表**：仅做了基础统计，未实现复杂报表
8. **工作流引擎**：状态流转硬编码，未接入工作流引擎

## 项目结构

```
├── backend/                 # 后端代码
│   ├── main.py             # 主入口、API路由
│   ├── models.py           # 数据库模型
│   ├── schemas.py          # Pydantic 数据模型
│   ├── database.py         # 数据库配置
│   ├── requirements.txt    # Python 依赖
│   └── inspection.db       # SQLite 数据库（自动生成）
├── frontend/               # 前端代码
│   ├── src/
│   │   ├── components/     # 通用组件
│   │   │   ├── Layout.jsx       # 布局组件
│   │   │   ├── StatusTimeline.jsx  # 状态时间轴
│   │   │   ├── IssueCard.jsx      # 问题卡片
│   │   │   └── BatchActionBar.jsx  # 批量操作栏
│   │   ├── pages/          # 页面组件
│   │   │   ├── Dashboard.jsx      # 工作台
│   │   │   ├── InspectionList.jsx  # 巡检列表
│   │   │   ├── InspectionDetail.jsx # 巡检详情
│   │   │   ├── RectificationList.jsx # 整改列表
│   │   │   └── RectificationDetail.jsx # 整改详情
│   │   ├── utils/          # 工具函数
│   │   │   └── format.js         # 格式化工具
│   │   ├── App.jsx         # 应用入口
│   │   ├── main.jsx        # 渲染入口
│   │   └── index.css       # 全局样式
│   └── package.json        # Node 依赖
└── README.md               # 项目说明
```

## API 接口

### 巡检相关
- `GET /api/inspections` - 获取巡检列表
- `GET /api/inspections/{id}` - 获取巡检详情
- `POST /api/inspections` - 创建巡检单
- `PATCH /api/inspections/{id}/status` - 更新巡检状态
- `POST /api/inspections/batch-status` - 批量更新巡检状态

### 整改相关
- `GET /api/rectifications` - 获取整改列表
- `GET /api/rectifications/{id}` - 获取整改详情
- `POST /api/rectifications` - 创建整改单
- `POST /api/rectifications/{id}/review` - 复查确认
- `PATCH /api/rectification-items/{id}/confirm-cost` - 确认费用

### 其他
- `GET /api/dashboard/stats` - 获取统计数据
- `GET /api/status-history/{type}/{id}` - 获取状态历史
