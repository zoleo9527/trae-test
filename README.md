# 游学营地管理系统

## 一、启动方式

### 1. 编译运行
```bash
# 下载依赖
go mod tidy

# 编译
go build -o camp-server ./cmd/server/

# 运行
./camp-server
```

### 2. 直接运行
```bash
go run ./cmd/server/
```

服务启动后访问: `http://localhost:8080`

---

## 二、角色切换（演示账号）

| 角色 | 用户名 | 密码 | 说明 |
|------|--------|------|------|
| 🏛️ 营地主任 | `director` | `123456` | 全权限，看整体进度 |
| 👩‍🏫 班务老师 | `teacher1` | `123456` | 李红 - 签到、医疗上报、随访 |
| 👨‍🏫 班务老师 | `teacher2` | `123456` | 王芳 - 签到、医疗上报、随访 |
| 📦 后勤协调 | `logistics` | `123456` | 赵强 - 分房、物资管理 |
| 🏥 医护人员 | `medical` | `123456` | 陈医生 - 医疗处理、随访 |
| ⚙️ 系统管理员 | `admin` | `123456` | 全权限 |

### 切换角色方法
1. 调用登录接口获取token
2. 在请求头中携带: `Authorization: Bearer <token>`

---

## 三、核心API列表

### 认证
```bash
# 登录
POST /api/v1/auth/login
Content-Type: application/json

{
    "username": "director",
    "password": "123456"
}

# 获取当前用户信息
GET /api/v1/auth/me
```

### 仪表板（按角色返回不同数据）
```bash
GET /api/v1/dashboard?camp_id=<camp_id>
```

### 活动签到
```bash
# 批量签到
POST /api/v1/checkin/batch
Content-Type: application/json

{
    "activity_id": "uuid",
    "camper_ids": ["camper1_id", "camper2_id"],
    "status": "present",
    "temperature": 36.5,
    "has_symptoms": false,
    "symptoms": "",
    "remark": ""
}

# 获取活动签到列表
GET /api/v1/checkin/activity/:activity_id

# 获取活动签到统计
GET /api/v1/checkin/activity/:activity_id/statistics

# 获取营员签到记录
GET /api/v1/checkin/camper/:camper_id
```

### 医疗上报
```bash
# 创建医疗上报
POST /api/v1/medical
Content-Type: application/json

{
    "camper_id": "uuid",
    "severity": "mild",
    "symptoms": "体温偏高",
    "description": "活动时发现",
    "temperature": 37.6,
    "initial_treatment": "休息观察",
    "need_follow_up": true
}

# 更新医疗状态
PUT /api/v1/medical/:id/status
Content-Type: application/json

{
    "status": "processing",
    "treatment": "物理降温",
    "medications": ["降温贴"]
}

# 记录家长通知
POST /api/v1/medical/:id/notify-parent
Content-Type: application/json

{
    "method": "phone",
    "content": "已电话告知家长孩子情况"
}

# 获取医疗记录列表
GET /api/v1/medical?camp_id=<camp_id>&status=processing

# 获取营员医疗记录
GET /api/v1/medical/camper/:camper_id

# 获取医疗统计
GET /api/v1/medical/statistics?camp_id=<camp_id>
```

### 营员管理
```bash
# 获取营员列表
GET /api/v1/campers?camp_id=<camp_id>&status=checked_in

# 获取营员详情
GET /api/v1/campers/:id

# 获取营员完整历史（签到+医疗+分房+物资+随访）
GET /api/v1/campers/:id/history
```

### 日志回查
```bash
# 获取操作日志
GET /api/v1/logs/operations?entity_type=medical&entity_id=<id>

# 获取状态变更历史
GET /api/v1/logs/status/:entity_type/:entity_id
```

---

## 四、演示数据链路说明

### 数据概览
- **营地**: 2024暑期探索夏令营（15天）
- **营员**: 6人（4男2女）
- **房间**: 4间（2栋201、202、203，3栋301）
- **活动**: 3个（晨练、徒步、科技工坊）
- **医疗上报**: 2条（1条已解决、1条随访中）
- **随访任务**: 2条（1条已完成、1条待处理）
- **物资**: 4种（感冒药、退烧药、口罩、登山杖）

### 关键链路示例

#### 链路1: 签到异常 → 医疗上报 → 家长通知 → 随访
```
晨练签到（陈浩 37.6度）
    ↓
自动创建医疗上报（轻度）
    ↓
陈医生处理（休息观察+物理降温）
    ↓
李红电话通知家长
    ↓
2小时后体温恢复，医疗结案
    ↓
创建家长回访任务
    ↓
李红完成电话回访 → 家长表示满意
```

#### 链路2: 晚查寝发现 → 医疗上报 → 隔离 → 物资申领 → 待随访
```
王芳晚查寝发现孙小乐咳嗽发烧
    ↓
医疗上报（中度）
    ↓
陈医生处理：服药+单间隔离
    ↓
陈医生申领感冒药
    ↓
赵强审批并发放
    ↓
安排今早8点随访检查（待处理）
```

---

## 五、当前版本已完成的边界（轻处理部分）

### ✅ 已完整实现
1. **数据模型完整闭环**
   - 营员信息 ↔ 签到记录 ↔ 医疗上报 ↔ 随访任务
   - 每条链路都有状态历史和操作日志

2. **角色权限严格隔离**
   - 营地主任: 全局视图+所有操作
   - 班务老师: 签到+医疗+随访（自己班的营员）
   - 后勤协调: 分房+物资
   - 医护: 医疗+随访+异常签到

3. **回查能力完整**
   - 状态变更历史（前后状态+操作人+时间+备注）
   - 操作日志（前后值+操作人+角色+IP+时间）
   - 营员完整历史聚合（一键拉取所有相关记录）

4. **关键业务链路**
   - 签到异常自动触发医疗预警
   - 医疗上报自动关联随访任务
   - 分房变更自动同步床位计数+记录日志
   - 家长通知同步更新医疗和随访

### ⚠️ 当前轻处理（后续可扩展）

1. **认证安全**
   - 当前: JWT固定密钥
   - 建议: 环境变量配置密钥+Token刷新机制

2. **文件上传**
   - 当前: 无医疗图片/报告上传
   - 建议: OSS存储+图片压缩

3. **消息通知**
   - 当前: 仅记录通知状态，无实际发送
   - 建议: 集成短信/微信/邮件推送

4. **实时协作**
   - 当前: 无WebSocket实时更新
   - 建议: 新医疗/随访任务实时提醒

5. **数据导出**
   - 当前: 无Excel/PDF导出
   - 建议: 签到表/医疗记录批量导出

6. **多营地切换**
   - 当前: 单营地演示为主
   - 建议: 营地切换UI+数据隔离

7. **高级统计报表**
   - 当前: 基础统计
   - 建议: 趋势图/健康分析/人员效能

---

## 六、项目结构

```
trae-test-3/
├── cmd/
│   └── server/
│       └── main.go              # 入口文件
├── internal/
│   ├── auth/
│   │   ├── jwt.go               # JWT认证
│   │   └── permission.go        # 权限控制
│   ├── config/
│   │   └── config.go            # 配置
│   ├── database/
│   │   ├── db.go                # 数据库初始化
│   │   └── seed.go              # 演示数据
│   ├── handler/
│   │   ├── auth_handler.go      # 认证接口
│   │   ├── dashboard_handler.go # 仪表板接口
│   │   ├── checkin_handler.go   # 签到接口
│   │   ├── medical_handler.go   # 医疗接口
│   │   ├── camper_handler.go    # 营员接口
│   │   └── log_handler.go       # 日志接口
│   ├── model/                    # 数据模型
│   │   ├── base.go
│   │   ├── user.go
│   │   ├── camp.go
│   │   ├── camper.go
│   │   ├── activity.go
│   │   ├── medical.go
│   │   ├── room.go
│   │   ├── material.go
│   │   └── followup.go
│   └── service/                  # 业务服务层
│       ├── log_service.go
│       ├── checkin_service.go
│       ├── medical_service.go
│       ├── room_service.go
│       ├── material_service.go
│       ├── followup_service.go
│       └── dashboard_service.go
├── go.mod
├── go.sum
└── README.md
```

---

## 七、快速测试

### 1. 登录获取Token
```bash
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"director","password":"123456"}'
```

### 2. 访问仪表板
```bash
curl -H "Authorization: Bearer <your_token>" \
  "http://localhost:8080/api/v1/dashboard?camp_id=<camp_id>"
```

### 3. 查看营员历史（完整链路）
```bash
curl -H "Authorization: Bearer <your_token>" \
  "http://localhost:8080/api/v1/campers/<camper_id>/history"
```
