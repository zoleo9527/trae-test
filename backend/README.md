# 婚纱影楼服装调度与保养记录系统

基于 Go Fiber + PostgreSQL 开发的婚纱影楼服装调度与保养管理系统。

## 技术栈

- **Web 框架**: Go Fiber v2
- **ORM**: GORM
- **数据库**: PostgreSQL
- **认证**: JWT
- **导出**: Excelize

## 项目结构

```
backend/
├── cmd/
│   ├── api/           # API 服务入口
│   └── seed/          # 种子数据初始化
├── internal/
│   ├── handlers/      # HTTP 处理器
│   ├── models/        # 数据模型
│   └── routes/        # 路由定义
├── pkg/
│   ├── config/        # 配置
│   ├── database/      # 数据库连接
│   └── middleware/    # 中间件
├── go.mod
├── go.sum
└── .env
```

## 快速开始

### 1. 数据库准备

```bash
# 创建数据库
createdb wedding_photo
```

### 2. 安装依赖

```bash
cd backend
go mod download
```

### 3. 初始化种子数据

```bash
go run cmd/seed/main.go
```

### 4. 启动服务

```bash
go run cmd/api/main.go
```

服务将在 `http://localhost:3000` 启动

### 5. 运行 API 测试

```bash
chmod +x test_api.sh
./test_api.sh all
```

## 用户角色

| 角色 | 账号 | 密码 | 权限说明 |
|------|------|------|----------|
| 店长 | 13800138001 | 123456 | 全部权限，含导出、日志 |
| 选片师 | 13800138002 | 123456 | 服装、档期、调度操作 |
| 客服管家 | 13800138003 | 123456 | 客户、档期管理 |
| 摄影师 | 13800138004 | 123456 | 查看权限 |

## API 概览

### 认证接口
- `POST /api/auth/login` - 登录

### 服装管理
- `GET /api/costumes` - 服装列表（支持筛选）
- `POST /api/costumes` - 创建服装
- `GET /api/costumes/:id` - 服装详情（含历史记录）
- `PUT /api/costumes/:id` - 更新服装
- `DELETE /api/costumes/:id` - 删除服装

### 客户与档期管理
- `GET /api/schedules/customers` - 客户列表
- `POST /api/schedules/customers` - 创建客户
- `GET /api/schedules` - 档期列表
- `POST /api/schedules` - 创建档期
- `GET /api/schedules/:id` - 档期详情
- `PATCH /api/schedules/:id/status` - 更新档期状态

### 服装调度
- `GET /api/dispatches` - 调度记录列表
- `POST /api/dispatches` - 创建调度（预约服装）
- `GET /api/dispatches/:id` - 调度详情
- `POST /api/dispatches/:id/pickup` - 领取服装
- `POST /api/dispatches/:id/return` - 归还服装
- `POST /api/dispatches/:id/cancel` - 取消调度

### 保养管理
- `GET /api/maintenances` - 保养记录列表
- `POST /api/maintenances` - 创建保养记录
- `GET /api/maintenances/:id` - 保养详情
- `POST /api/maintenances/:id/complete` - 完成保养
- `PATCH /api/maintenances/:id/status` - 更新保养状态

### 导出（店长权限）
- `GET /api/exports/dispatches` - 导出调度记录 Excel
- `GET /api/exports/maintenances` - 导出保养记录 Excel
- `GET /api/exports/costumes` - 导出服装清单 Excel

### 操作日志（店长权限）
- `GET /api/logs` - 操作日志列表

## 核心业务流程

### 正常流程
```
创建档期 → 创建调度(预约) → 领取服装 → 归还服装 → 自动创建保养 → 完成保养 → 服装恢复可用
```

### 问题流程（损坏归还）
```
... → 归还服装(填写损坏备注) → 自动创建维修记录 → 服装状态变为维修中 → 完成维修 → 服装恢复可用
```

### 取消流程
```
创建调度 → 取消调度 → 服装恢复可用
```

## 状态机

### 服装状态
```
available(可用) → reserved(已预约) → lent(借出) → cleaning(清洁中)/repairing(维修中) → available
```

### 调度状态
```
pending(待确认) → confirmed(已确认) → picked_up(已取件) → returned(已归还)
              ↘ cancelled(已取消)
```

### 保养状态
```
pending(待处理) → doing(处理中) → done(已完成)
```

## 筛选参数示例

```bash
# 按分类筛选服装
GET /api/costumes?category=婚纱

# 按状态筛选调度
GET /api/dispatches?status=picked_up

# 按日期范围导出
GET /api/exports/dispatches?start_date=2024-01-01&end_date=2024-12-31

# 分页
GET /api/costumes?page=2&page_size=20
```

## 实现取舍点

### 已实现
- ✅ JWT 多角色鉴权
- ✅ 服装状态机流转
- ✅ 调度与保养自动衔接
- ✅ 完整操作日志审计
- ✅ Excel 导出功能
- ✅ 多维度筛选和分页
- ✅ 事务保证数据一致性

### 设计取舍
1. **服装状态驱动而非库存数量** - 每件服装独立追踪，更贴合高端婚纱租赁
2. **归还自动触发保养** - 无需人工创建，避免遗漏
3. **损坏备注驱动维修流程** - 业务逻辑与数据字段直接关联
4. **操作日志独立表** - 不依赖数据库特性，便于迁移和查询
5. **店长权限导出** - 敏感操作收拢，便于管理

### 未实现（后续扩展）
1. 消息通知（微信/短信提醒）
2. 图片上传（服装照片、损坏照片）
3. 财务模块（收款、支出统计）
4. 多门店支持
5. 预约冲突检测
6. 报表统计大屏
7. 移动端适配
8. 工作流审批

## 扩展建议

### 近期扩展
1. 添加图片上传接口，对接 OSS
2. 实现微信小程序登录
3. 添加消息推送（归还提醒、保养完成提醒）

### 中期扩展
1. 接入财务系统，自动生成结算单
2. 开发报表模块，提供数据看板
3. 添加库存预警（服装使用次数、维修频率）

### 长期扩展
1. 多门店架构改造
2. 供应链管理（服装采购、供应商）
3. BI 数据分析
