# 城市书房-活动报名与签到核销系统 API 文档

## 基础信息

- **Base URL**: `http://localhost:3000/api`
- **认证方式**: Bearer Token (JWT)
- **默认账号密码**: `123456`

---

## 角色说明

| 角色代码 | 角色名称 | 权限说明 |
|---------|---------|---------|
| `DIRECTOR` | 馆长 | 全部权限，包括审计日志查看 |
| `ACTIVITY_OPERATOR` | 活动运营 | 活动管理、报名审核、补录、导出 |
| `VOLUNTEER_COORDINATOR` | 志愿者协调 | 人工签到、标记未到 |
| `VOLUNTEER` | 志愿者 | 报名、查看活动 |

---

## 1. 认证模块

### 1.1 登录

```
POST /api/auth/login
Content-Type: application/json

Request:
{
  "username": "director",
  "password": "123456"
}

Response:
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid",
      "username": "director",
      "name": "王馆长",
      "role": "DIRECTOR",
      "phone": "13800000001"
    }
  },
  "message": "登录成功"
}
```

### 1.2 获取当前用户信息

```
GET /api/auth/me
Authorization: Bearer {token}
```

### 1.3 修改密码

```
POST /api/auth/change-password
Authorization: Bearer {token}
Content-Type: application/json

{
  "oldPassword": "123456",
  "newPassword": "newpassword"
}
```

---

## 2. 书房管理

### 2.1 获取书房列表

```
GET /api/libraries?page=1&pageSize=20&keyword=中心
Authorization: Bearer {token}
```

### 2.2 获取书房详情

```
GET /api/libraries/{id}
Authorization: Bearer {token}
```

### 2.3 获取书房统计

```
GET /api/libraries/{id}/stats
Authorization: Bearer {token}
```

---

## 3. 活动管理

### 3.1 创建活动

```
POST /api/activities
Authorization: Bearer {token}
Content-Type: application/json
Permission: 活动运营/馆长

{
  "title": "周末亲子阅读会",
  "description": "适合4-10岁儿童参与",
  "libraryId": "{library_id}",
  "location": "多功能厅",
  "maxParticipants": 30,
  "startTime": "2024-06-15T14:00:00Z",
  "endTime": "2024-06-15T16:00:00Z",
  "registrationStart": "2024-06-01T00:00:00Z",
  "registrationEnd": "2024-06-14T00:00:00Z",
  "coverImage": "https://example.com/image.jpg",
  "tags": ["亲子", "阅读"],
  "requirements": "请携带水杯"
}
```

### 3.2 获取活动列表

```
GET /api/activities?page=1&pageSize=20&libraryId=&status=REGISTRATION_OPEN&keyword=&startDate=&endDate=
Authorization: Bearer {token}
```

**状态枚举**: `DRAFT`, `PUBLISHED`, `REGISTRATION_OPEN`, `REGISTRATION_CLOSED`, `ONGOING`, `COMPLETED`, `CANCELLED`

### 3.3 获取活动详情

```
GET /api/activities/{id}
Authorization: Bearer {token}
```

### 3.4 获取活动统计

```
GET /api/activities/{id}/stats
Authorization: Bearer {token}

Response:
{
  "success": true,
  "data": {
    "totalRegistrations": 28,
    "approvedCount": 25,
    "checkedInCount": 20,
    "noShowCount": 5,
    "attendanceRate": 80
  },
  "message": "获取成功"
}
```

### 3.5 更新活动

```
PUT /api/activities/{id}
Authorization: Bearer {token}
Permission: 活动运营/馆长
```

### 3.6 更新活动状态

```
PATCH /api/activities/{id}/status
Authorization: Bearer {token}
Content-Type: application/json
Permission: 活动运营/馆长

{
  "status": "REGISTRATION_OPEN"
}
```

### 3.7 删除活动

```
DELETE /api/activities/{id}
Authorization: Bearer {token}
Permission: 活动运营/馆长
```

---

## 4. 报名管理

### 4.1 创建报名

```
POST /api/registrations
Authorization: Bearer {token}
Content-Type: application/json
Headers: x-idempotency-key: {unique_key} (可选幂等)

{
  "activityId": "activity-001",
  "userId": "user-uuid",
  "userName": "张三",
  "userPhone": "13800001234",
  "idCardNumber": "330102199001010000"
}
```

### 4.2 获取报名列表

```
GET /api/registrations?page=1&pageSize=20&activityId=&status=&keyword=
Authorization: Bearer {token}
```

**状态枚举**: `PENDING`, `APPROVED`, `REJECTED`, `CANCELLED`, `CHECKED_IN`, `NO_SHOW`

### 4.3 获取报名详情

```
GET /api/registrations/{id}
Authorization: Bearer {token}
```

### 4.4 审核通过报名

```
POST /api/registrations/{id}/approve
Authorization: Bearer {token}
Permission: 活动运营/馆长
```

### 4.5 驳回报名

```
POST /api/registrations/{id}/reject
Authorization: Bearer {token}
Content-Type: application/json
Permission: 活动运营/馆长

{
  "rejectReason": "活动名额已满"
}
```

### 4.6 取消报名

```
POST /api/registrations/{id}/cancel
Authorization: Bearer {token}
Content-Type: application/json

{
  "cancelReason": "临时有事"
}
```

### 4.7 补录报名

```
POST /api/registrations/supplement
Authorization: Bearer {token}
Content-Type: application/json
Permission: 活动运营/馆长

{
  "activityId": "activity-001",
  "userId": "user-uuid",
  "userName": "补录用户",
  "userPhone": "13900001234",
  "supplementReason": "现场报名，补录信息"
}
```

---

## 5. 签到核销

### 5.1 扫码签到

```
POST /api/checkins
Authorization: Bearer {token}
Content-Type: application/json

{
  "activityId": "activity-003",
  "registrationId": "reg-001",
  "userName": "陈志愿",
  "userPhone": "13800000004",
  "checkInMethod": "QR_CODE"
}
```

### 5.2 人工签到

```
POST /api/checkins/manual
Authorization: Bearer {token}
Content-Type: application/json
Permission: 志愿者协调/馆长

{
  "activityId": "activity-003",
  "userName": "现场访客",
  "userPhone": "13700001111",
  "manualRemark": "书法老师，未提前报名",
  "evidenceImage": "https://example.com/evidence.jpg"
}
```

### 5.3 获取签到列表

```
GET /api/checkins?page=1&pageSize=20&activityId=&status=&keyword=
Authorization: Bearer {token}
```

### 5.4 获取签到详情

```
GET /api/checkins/{id}
Authorization: Bearer {token}
```

### 5.5 标记未到

```
POST /api/checkins/no-show/{registrationId}
Authorization: Bearer {token}
Content-Type: application/json
Permission: 志愿者协调/馆长

{
  "remark": "联系不上，未到场"
}
```

---

## 6. 数据导出

### 6.1 导出报名数据

```
GET /api/export/registrations?activityId=&status=
Authorization: Bearer {token}
Permission: 活动运营/馆长
Content-Type: text/csv
```

### 6.2 导出签到数据

```
GET /api/export/checkins?activityId=
Authorization: Bearer {token}
Permission: 活动运营/馆长
Content-Type: text/csv
```

---

## 7. 审计日志

### 7.1 获取操作日志

```
GET /api/logs?page=1&pageSize=20&module=&action=&recordId=&keyword=
Authorization: Bearer {token}
Permission: 馆长
```

**模块枚举**: `ACTIVITY`, `REGISTRATION`, `CHECK_IN`, `USER`, `NOTIFICATION`

**操作枚举**: `CREATE`, `UPDATE`, `DELETE`, `APPROVE`, `REJECT`, `CANCEL`, `CHECK_IN`, `CHECK_OUT`, `REMIND`, `EXPORT`, `SUPPLEMENT`

### 7.2 获取日志详情

```
GET /api/logs/{id}
Authorization: Bearer {token}
Permission: 馆长
```

---

## 测试样例

### 正常流程测试

1. **活动运营创建活动** → 状态从 DRAFT → REGISTRATION_OPEN
2. **志愿者报名** → 状态 PENDING
3. **活动运营审核通过** → 状态 APPROVED
4. **活动开始扫码签到** → 状态 CHECKED_IN
5. **活动结束导出数据** → 生成CSV

### 异常流程测试

1. **报名被驳回** → 驳回原因记录在详情页
2. **现场补录** → 标记 isSupplement=true，记录补录原因
3. **人工签到** → 记录 manualRemark，上传证据图片
4. **标记未到** → 状态 NO_SHOW，留下操作日志
5. **重复报名拦截** → 基于 activityId_userId 唯一约束
6. **幂等请求** → 带 x-idempotency-key 重复提交返回相同结果

---

## 统一响应格式

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

### 分页响应

```json
{
  "success": true,
  "data": {
    "data": [],
    "total": 100,
    "page": 1,
    "pageSize": 20,
    "totalPages": 5
  },
  "message": "查询成功"
}
```

### 错误响应

```json
{
  "success": false,
  "message": "错误信息",
  "error": "详细错误（开发环境）"
}
```
