# 跑腿平台-用户退款与客服回查 API 文档

## 基础信息
- 基础URL: `http://localhost:8080/api/v1`
- 认证方式: Bearer Token
- Token有效期: 24小时

## 通用响应格式
```json
{
  "code": 0,
  "message": "success",
  "data": {}
}
```

- `code`: 0表示成功，非0表示错误
- `message`: 错误描述
- `data`: 响应数据

## 分页响应格式
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "total": 100,
    "page": 1,
    "page_size": 20,
    "list": []
  }
}
```

---

## 1. 认证接口

### 1.1 登录
```
POST /api/v1/auth/login
Content-Type: application/json
```

请求体:
```json
{
  "username": "ops_manager",
  "password": "123456"
}
```

响应:
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIs...",
    "token_type": "Bearer",
    "expires_in": 86400,
    "user": {
      "id": "uuid",
      "username": "ops_manager",
      "real_name": "张明",
      "role": "ops_manager",
      "email": "ops@runner.com",
      "phone": "13800000002"
    }
  }
}
```

### 1.2 获取当前用户信息
```
GET /api/v1/auth/me
Authorization: Bearer <token>
```

### 1.3 修改密码
```
PUT /api/v1/auth/password
Authorization: Bearer <token>
Content-Type: application/json
```

请求体:
```json
{
  "old_password": "123456",
  "new_password": "newpassword"
}
```

---

## 2. 订单接口

### 2.1 创建订单 (调度员)
```
POST /api/v1/orders
Authorization: Bearer <token>
Content-Type: application/json
```

### 2.2 查询订单列表
```
GET /api/v1/orders?order_no=&status=&user_id=&page=1&page_size=20
Authorization: Bearer <token>
```

查询参数:
- `order_no`: 订单号模糊查询
- `status`: 订单状态 (pending/assigned/picked_up/delivering/completed/cancelled/refunded)
- `user_id`: 用户ID
- `runner_id`: 骑手ID
- `merchant_id`: 商家ID
- `start_date`: 开始日期
- `end_date`: 结束日期
- `page`: 页码
- `page_size`: 每页条数

### 2.3 获取订单详情
```
GET /api/v1/orders/:id
Authorization: Bearer <token>
```

### 2.4 指派订单 (调度员)
```
POST /api/v1/orders/:id/assign
Authorization: Bearer <token>
Content-Type: application/json
```

请求体:
```json
{
  "runner_id": "uuid",
  "reason": "智能派单"
}
```

### 2.5 更新订单状态 (调度员)
```
PUT /api/v1/orders/:id/status
Authorization: Bearer <token>
Content-Type: application/json
```

请求体:
```json
{
  "status": "delivering",
  "timeout_reason": "交通拥堵",
  "remark": "备注信息"
}
```

---

## 3. 退款接口

### 3.1 创建退款申请
```
POST /api/v1/refunds
Authorization: Bearer <token>
Content-Type: application/json
```

请求体:
```json
{
  "order_id": "uuid",
  "reason": "timeout",
  "amount": 50.00,
  "description": "超时45分钟，餐品已凉",
  "evidence_images": ["https://example.com/img1.jpg"]
}
```

退款原因: `timeout`(超时), `damaged`(破损), `wrong_item`(错发), `quality_issue`(质量), `user_cancel`(取消), `other`(其他)

### 3.2 查询退款列表
```
GET /api/v1/refunds?order_no=&status=&reason=&page=1&page_size=20
Authorization: Bearer <token>
```

查询参数:
- `order_no`: 订单号
- `status`: 退款状态 (pending/reviewing/approved/rejected/processing/completed/cancelled)
- `reason`: 退款原因
- `user_id`: 用户ID
- `start_date`, `end_date`: 日期范围

### 3.3 获取退款详情
```
GET /api/v1/refunds/:id
Authorization: Bearer <token>
```

### 3.4 获取退款完整详情(含操作日志)
```
GET /api/v1/refunds/:id/detail
Authorization: Bearer <token>
```

### 3.5 更新退款申请
```
PUT /api/v1/refunds/:id
Authorization: Bearer <token>
Content-Type: application/json
```

### 3.6 审核退款 (客服)
```
POST /api/v1/refunds/:id/review
Authorization: Bearer <token>
Content-Type: application/json
```

请求体:
```json
{
  "status": "approved",
  "reject_reason": "",
  "remark": "审核通过"
}
```

状态: `approved`(通过), `rejected`(驳回), `processing`(处理中)

### 3.7 添加退款备注
```
POST /api/v1/refunds/:id/remarks
Authorization: Bearer <token>
Content-Type: application/json
```

请求体:
```json
{
  "content": "已联系用户确认",
  "is_internal": true
}
```

---

## 4. 申诉接口

### 4.1 创建申诉
```
POST /api/v1/appeals
Authorization: Bearer <token>
Content-Type: application/json
```

请求体:
```json
{
  "order_id": "uuid",
  "refund_id": "uuid",
  "title": "超时判定有误",
  "content": "实际已按时送达，有GPS为证",
  "evidence": ["https://example.com/evidence.jpg"]
}
```

### 4.2 查询申诉列表
```
GET /api/v1/appeals?order_no=&status=&page=1&page_size=20
Authorization: Bearer <token>
```

状态: `pending`(待处理), `reviewing`(处理中), `upheld`(支持), `rejected`(驳回), `closed`(关闭)

### 4.3 获取申诉详情
```
GET /api/v1/appeals/:id
Authorization: Bearer <token>
```

### 4.4 获取申诉完整详情(含操作日志)
```
GET /api/v1/appeals/:id/detail
Authorization: Bearer <token>
```

### 4.5 处理申诉 (客服)
```
POST /api/v1/appeals/:id/handle
Authorization: Bearer <token>
Content-Type: application/json
```

请求体:
```json
{
  "status": "upheld",
  "result": "申诉成立，撤销罚款",
  "reject_reason": "",
  "remark": ""
}
```

### 4.6 添加申诉备注
```
POST /api/v1/appeals/:id/remarks
Authorization: Bearer <token>
Content-Type: application/json
```

---

## 5. 补贴接口

### 5.1 创建补贴申请 (运营经理)
```
POST /api/v1/subsidies
Authorization: Bearer <token>
Content-Type: application/json
```

请求体:
```json
{
  "order_id": "uuid",
  "refund_id": "uuid",
  "appeal_id": "uuid",
  "payee_id": "uuid",
  "payee_type": "user",
  "amount": 50.00,
  "reason": "订单超时补偿",
  "description": "详细说明"
}
```

收款方类型: `user`(用户), `runner`(骑手), `merchant`(商家)

### 5.2 查询补贴列表
```
GET /api/v1/subsidies?order_no=&status=&page=1&page_size=20
Authorization: Bearer <token>
```

状态: `pending`(待审核), `approved`(已通过), `rejected`(已驳回), `paid`(已支付)

### 5.3 获取补贴详情
```
GET /api/v1/subsidies/:id
Authorization: Bearer <token>
```

### 5.4 获取补贴完整详情(含操作日志)
```
GET /api/v1/subsidies/:id/detail
Authorization: Bearer <token>
```

### 5.5 审核补贴 (运营经理)
```
POST /api/v1/subsidies/:id/review
Authorization: Bearer <token>
Content-Type: application/json
```

请求体:
```json
{
  "status": "approved",
  "remark": "同意补贴"
}
```

### 5.6 标记已支付 (运营经理)
```
POST /api/v1/subsidies/:id/paid
Authorization: Bearer <token>
Content-Type: application/json
```

请求体:
```json
{
  "payment_method": "alipay",
  "transaction_no": "TXN202405200001"
}
```

### 5.7 添加补贴备注
```
POST /api/v1/subsidies/:id/remarks
Authorization: Bearer <token>
Content-Type: application/json
```

---

## 6. 操作日志接口

### 6.1 查询操作日志
```
GET /api/v1/logs?target_id=&target_type=&action=&page=1&page_size=20
Authorization: Bearer <token>
```

查询参数:
- `target_id`: 目标ID
- `target_type`: 目标类型 (refund/appeal/subsidy/order)
- `action`: 操作类型
- `operator_id`: 操作人ID
- `start_date`, `end_date`: 日期范围

### 6.2 获取仪表盘统计
```
GET /api/v1/dashboard/stats
Authorization: Bearer <token>
```

响应:
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "pending_refunds": 5,
    "pending_appeals": 3,
    "pending_subsidies": 2,
    "today_operations": 28
  }
}
```

---

## 7. 健康检查
```
GET /api/v1/health
```

---

## 角色权限说明

| 接口 | admin | ops_manager | dispatcher | customer_service | user | runner | merchant |
|------|-------|-------------|------------|------------------|------|--------|----------|
| 创建订单 | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| 指派订单 | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| 更新订单状态 | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| 审核退款 | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| 处理申诉 | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| 创建补贴 | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| 审核补贴 | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| 标记补贴已付 | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| 查询列表 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 获取详情 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 添加备注 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
