# 商用清洁 - 项目排班与打卡回传系统

## 系统概述

这是一个完整的商用清洁项目管理系统，实现了**排班→打卡→质检→整改→回访的完整业务链路追踪。

## 核心设计理念：
- **四角色权限隔离**：项目主管、排班专员、质检员、清洁员各有独立视图
- **全链路追踪**：从排班到回访形成完整可追溯链条
- **同一数据源**：一线处理和管理回看基于同一套数据
- **异常处理优先**：漏打卡、整改追踪、耗材补货作为主场景

## 技术栈：
- **后端**：Go + Fiber + GORM + SQLite
- **前端**：SvelteKit + TypeScript

## 快速启动

### 1. 启动后端服务

```bash
cd commercial-cleaning-tracker/backend

# 初始化Go模块（首次运行
go mod tidy

# 启动服务（端口3000）
go run main.go
```

### 2. 启动前端服务

```bash
cd commercial-cleaning-tracker/frontend

# 安装依赖（首次运行
npm install

# 启动开发服务（端口5173）
npm run dev
```

### 3. 访问系统

打开浏览器访问：http://localhost:5173

## 测试账号：

| 角色 | 用户名 | 密码 |
|------|--------|------|
| 项目主管 | manager | 123456 |
| 排班专员 | scheduler | 123456 |
| 质检员 | inspector | 123456 |
| 清洁员 | worker1 | 123456 |

## 系统功能

### 项目主管 (manager)
- 📊 数据看板：总览排班、异常统计概览
- 🔍 连续回查面板：完整业务链路追踪
- 📋 排班管理：查看所有排班
- 📝 回访跟踪：续约回访管理
- 🏢 项目列表：所有项目信息

### 排班专员 (scheduler)
- 📅 排班管理：创建周排班表、人员分配
- 🧪 耗材审批：处理清洁员耗材申请

### 质检员 (inspector)
- ✅ 质检录入：对班次进行质检打分
- 🔍 连续回查：查看完整业务链路
- 🔧 整改追踪：分配整改任务、验证整改结果

### 清洁员 (worker)
- 📋 我的排班：查看个人排班
- 🕒 打卡：上班打卡、下班签退
- 🧪 耗材申领：申请清洁耗材
- 🔧 整改任务：处理分配的整改任务

## 演示数据说明

系统启动后自动生成演示数据包含以下异常场景：

1. **漏打卡场景**：研发楼A栋班次未打卡

2. **迟到场景**：金融中心A座6层班次迟到15分钟

3. **质检不合格+整改场景**：
   - 金融中心A座6层：质检65分，整改待处理
   - 购物中心1-3层：质检58分，整改已完成待验证

4. **耗材审批场景**：
   - 待审批：空气清新剂、洁厕灵申请
   - 已拒绝：强力清洁剂申请（库存不足

5. **回访跟踪场景**：
   - 购物中心合同续约跟进
   - 整改验证回访

## 刻意简化的部分

1. **文件上传**：打卡截图、质检照片仅存储URL，实际文件上传未实现
2. **地理位置**：打卡位置仅文本记录文本输入，未集成GPS
3. **消息通知**：整改、审批等实时通知未实现
4. **导出功能**：排班表、报表导出未实现
5. **高级权限**：用户管理、密码重置等管理功能简化
6. **分页加载**：数据列表暂未实现分页

## API接口说明

### 认证
- `POST /api/login` - 用户登录

### 排班
- `GET /api/schedules - 获取排班列表
- `POST /api/schedules - 创建排班
- `POST /api/schedules/:id/publish - 发布排班
- `GET /api/shifts - 获取班次列表
- `GET /api/shifts/:id - 获取班次详情

### 打卡
- `GET /api/checkins - 获取打卡记录
- `POST /api/checkins - 创建打卡
- `POST /api/checkins/:id/checkout - 签退
- `PATCH /api/checkins/:id/correct - 修正打卡（管理员)

### 质检
- `GET /api/inspections - 获取质检列表
- `POST /api/inspections - 创建质检

### 整改
- `GET /api/rectifications - 获取整改列表
- `POST /api/rectifications - 创建整改
- `POST /api/rectifications/:id/complete - 完成整改
- `POST /api/rectifications/:id/verify - 验证整改

### 耗材
- `GET /api/materials - 获取耗材申请列表
- `POST /api/materials - 创建耗材申请
- `PATCH /api/materials/:id/approve - 审批耗材申请

### 回访
- `GET /api/followups - 获取回访列表
- `POST /api/followups - 创建回访
- `POST /api/followups/:id/complete - 完成回访

### 追踪链
- `GET /api/trace-chain` - 获取完整追踪链

### 数据看板
- `GET /api/dashboard/stats - 获取看板统计
