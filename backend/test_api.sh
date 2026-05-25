#!/bin/bash

BASE_URL="http://localhost:8080/api/v1"

echo "========================================"
echo "美术馆运营系统 API 测试脚本"
echo "========================================"
echo ""

echo "【健康检查】"
curl -s "${BASE_URL}/health" | jq .
echo ""

echo "========================================"
echo "【1. 登录认证】"
echo "========================================"
echo ""

echo "馆务经理登录:"
MANAGER_TOKEN=$(curl -s -X POST "${BASE_URL}/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"manager","password":"123456"}' | jq -r '.data.token')
echo "Token: ${MANAGER_TOKEN:0:50}..."
echo ""

echo "票务专员登录:"
TICKETING_TOKEN=$(curl -s -X POST "${BASE_URL}/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"ticketing","password":"123456"}' | jq -r '.data.token')
echo "Token: ${TICKETING_TOKEN:0:50}..."
echo ""

echo "活动执行登录:"
ACTIVITIES_TOKEN=$(curl -s -X POST "${BASE_URL}/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"activities","password":"123456"}' | jq -r '.data.token')
echo "Token: ${ACTIVITIES_TOKEN:0:50}..."
echo ""

echo "========================================"
echo "【2. 票务管理 - 正常流程】"
echo "========================================"
echo ""

echo "创建票务:"
curl -s -X POST "${BASE_URL}/tickets" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TICKETING_TOKEN}" \
  -d '{
    "type": "adult",
    "price": 80.00,
    "visitor_name": "测试观众A",
    "visitor_phone": "13800001111",
    "visitor_id_card": "110101199001011234",
    "channel": "onsite"
  }' | jq .
echo ""

echo "获取票务列表:"
curl -s -G "${BASE_URL}/tickets" \
  -H "Authorization: Bearer ${TICKETING_TOKEN}" \
  -d "page=1&page_size=5" | jq .
echo ""

echo "获取票务统计:"
curl -s "${BASE_URL}/tickets/statistics" \
  -H "Authorization: Bearer ${TICKETING_TOKEN}" | jq .
echo ""

echo "========================================"
echo "【3. 票务核销 - 正常流】"
echo "========================================"
echo ""

echo "核销有效票 (qr-ticket-normal-001):"
curl -s -X POST "${BASE_URL}/tickets/verify" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TICKETING_TOKEN}" \
  -d '{
    "qr_code": "qr-ticket-normal-001",
    "station": "主入口-A"
  }' | jq .
echo ""

echo "========================================"
echo "【4. 票务核销 - 异常流】"
echo "========================================"
echo ""

echo "核销已过期票 (qr-ticket-expired-003):"
curl -s -X POST "${BASE_URL}/tickets/verify" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TICKETING_TOKEN}" \
  -d '{
    "qr_code": "qr-ticket-expired-003",
    "station": "主入口-A"
  }' | jq .
echo ""

echo "核销已退款票 (qr-ticket-refunded-004):"
curl -s -X POST "${BASE_URL}/tickets/verify" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TICKETING_TOKEN}" \
  -d '{
    "qr_code": "qr-ticket-refunded-004",
    "station": "主入口-A"
  }' | jq .
echo ""

echo "核销不存在的票:"
curl -s -X POST "${BASE_URL}/tickets/verify" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TICKETING_TOKEN}" \
  -d '{
    "qr_code": "qr-code-not-exist",
    "station": "主入口-A"
  }' | jq .
echo ""

echo "========================================"
echo "【5. 会员活动管理】"
echo "========================================"
echo ""

echo "获取活动列表:"
curl -s -G "${BASE_URL}/activities" \
  -H "Authorization: Bearer ${ACTIVITIES_TOKEN}" \
  -d "page=1&page_size=10&status=published" | jq .
echo ""

echo "创建活动报名:"
curl -s -X POST "${BASE_URL}/activities/1/register" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${ACTIVITIES_TOKEN}" \
  -d '{
    "member_name": "测试会员",
    "member_phone": "13900008888",
    "member_email": "test@example.com",
    "participants": 2
  }' | jq .
echo ""

echo "获取活动报名列表:"
curl -s -G "${BASE_URL}/activities/1/registrations" \
  -H "Authorization: Bearer ${ACTIVITIES_TOKEN}" \
  -d "page=1&page_size=10" | jq .
echo ""

echo "确认报名 (ID:2):"
curl -s -X POST "${BASE_URL}/activities/registrations/2/confirm" \
  -H "Authorization: Bearer ${ACTIVITIES_TOKEN}" | jq .
echo ""

echo "========================================"
echo "【6. 展品台账管理】"
echo "========================================"
echo ""

echo "获取展品列表:"
curl -s -G "${BASE_URL}/exhibits" \
  -H "Authorization: Bearer ${MANAGER_TOKEN}" \
  -d "page=1&page_size=10" | jq .
echo ""

echo "创建展品流转申请:"
curl -s -X POST "${BASE_URL}/exhibits/transfers" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${MANAGER_TOKEN}" \
  -d '{
    "exhibit_id": 3,
    "to_status": "on_display",
    "to_location": "A馆-03区",
    "reason": "春季特展需要"
  }' | jq .
echo ""

echo "========================================"
echo "【7. 审计日志查询】"
echo "========================================"
echo ""

echo "获取审计日志:"
curl -s -G "${BASE_URL}/audit/logs" \
  -H "Authorization: Bearer ${MANAGER_TOKEN}" \
  -d "page=1&page_size=10&module=ticket" | jq .
echo ""

echo "追踪单条资源操作历史:"
curl -s -G "${BASE_URL}/audit/trace" \
  -H "Authorization: Bearer ${MANAGER_TOKEN}" \
  -d "resource_type=ticket&resource_no=TK20240002" | jq .
echo ""

echo "========================================"
echo "【8. 导出任务】"
echo "========================================"
echo ""

echo "创建票务导出任务:"
curl -s -X POST "${BASE_URL}/tasks/export" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TICKETING_TOKEN}" \
  -d '{
    "type": "export_tickets",
    "module": "tickets",
    "params": {
      "start_date": "2024-01-01",
      "end_date": "2024-12-31"
    },
    "title": "2024年票务数据导出"
  }' | jq .
echo ""

echo "获取任务列表:"
curl -s -G "${BASE_URL}/tasks" \
  -H "Authorization: Bearer ${TICKETING_TOKEN}" \
  -d "page=1&page_size=10" | jq .
echo ""

echo "========================================"
echo "【测试完成】"
echo "========================================"
