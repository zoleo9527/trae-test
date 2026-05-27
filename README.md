# 自助洗车 - 会员续费与活动推送系统

## 项目概述
面向运营主管、巡检员、客服的多人协作平台，解决设备报修、退款申诉、会员续费、活动推送等业务流程协同问题。

## 技术栈
- **前端**: SvelteKit + TypeScript + TailwindCSS
- **后端**: Go Fiber + GORM
- **数据库**: SQLite (开发环境)
- **认证**: JWT Token

## 快速开始

### 1. 启动后端服务
```bash
cd server
go mod download
go run main.go
```
后端服务地址: http://localhost:8080

### 2. 启动前端服务
```bash
cd web
npm install
npm run dev
```
前端服务地址: http://localhost:5173

### 3. 演示账号
| 角色 | 账号 | 密码 |
|------|------|------|
| 运营主管 | admin | 123456 |
| 巡检员 | inspector | 123456 |
| 客服 | service | 123456 |

## 核心功能

### 首页看板
- 待处理、已驳回、需回查数据统计
- 快捷操作入口
- 最近活动时间轴

### 会员续费
- 批量续费操作
- 套餐管理与核销
- 续费状态时间轴
- 会员标签与分组

### 活动推送
- 活动创建与编辑
- 定向人群筛选
- 推送效果追踪
- A/B 测试支持

### 设备报修
- 报修单流转
- 多人协作处理
- 照片与证据留存
- 异常升级机制

### 退款申诉
- 申诉审核流程
- 凭证上传与核验
- 退款处理记录
- 智能风险提示

## 项目结构
```
├── server/          # Go Fiber 后端
│   ├── main.go
│   ├── api/         # API 路由
│   ├── models/      # 数据模型
│   ├── services/    # 业务逻辑
│   └── middleware/  # 中间件
├── web/             # SvelteKit 前端
│   ├── src/
│   │   ├── lib/     # 通用组件与工具
│   │   ├── routes/  # 页面路由
│   │   └── stores/  # 状态管理
└── scripts/         # 初始化脚本
```
