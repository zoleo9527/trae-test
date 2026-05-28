#!/bin/bash
set -e

BASE_URL="http://localhost:8081/api"

echo "=== 登录获取 Token ==="
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}')
TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
echo "Token obtained"
echo ""

echo "=== 1. 获取一个活跃的租赁（用于创建归还记录） ==="
RENTALS=$(curl -s -H "Authorization: Bearer $TOKEN" "$BASE_URL/rentals?status=active")
RENTAL_ID=$(echo "$RENTALS" | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
echo "Active Rental ID: $RENTAL_ID"

RENTAL_INFO=$(curl -s -H "Authorization: Bearer $TOKEN" "$BASE_URL/rentals/$RENTAL_ID")
INSTRUMENT_ID=$(echo "$RENTAL_INFO" | grep -o '"instrument_id":[0-9]*' | head -1 | cut -d':' -f2)
RENTAL_STATUS_BEFORE=$(echo "$RENTAL_INFO" | grep -o '"status":"[^"]*"' | head -1 | cut -d'"' -f4)
DEPOSIT_STATUS_BEFORE=$(echo "$RENTAL_INFO" | grep -o '"deposit_status":"[^"]*"' | head -1 | cut -d'"' -f4)
echo "Rental status before return: $RENTAL_STATUS_BEFORE"
echo "Deposit status before return: $DEPOSIT_STATUS_BEFORE"
echo "Instrument ID: $INSTRUMENT_ID"
echo ""

echo "=== 2. 创建归还记录（pending_review） ==="
RETURN_RESPONSE=$(curl -s -X POST "$BASE_URL/returns" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"rental_id\": $RENTAL_ID,
    \"return_date\": \"2026-05-28\",
    \"condition\": \"good\",
    \"damage_description\": \"状态机测试\",
    \"deposit_deduction\": 50,
    \"deposit_refund\": 450
  }")
RETURN_ID=$(echo "$RETURN_RESPONSE" | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
RETURN_STATUS=$(echo "$RETURN_RESPONSE" | grep -o '"status":"[^"]*"' | head -1 | cut -d'"' -f4)
echo "Return Record ID: $RETURN_ID"
echo "Return Status: $RETURN_STATUS (expected: pending_review)"
echo ""

echo "=== 3. 验证租赁/乐器/押金状态未改变 ==="
RENTAL_AFTER_CREATE=$(curl -s -H "Authorization: Bearer $TOKEN" "$BASE_URL/rentals/$RENTAL_ID")
RENTAL_STATUS_AFTER=$(echo "$RENTAL_AFTER_CREATE" | grep -o '"status":"[^"]*"' | head -1 | cut -d'"' -f4)
DEPOSIT_STATUS_AFTER=$(echo "$RENTAL_AFTER_CREATE" | grep -o '"deposit_status":"[^"]*"' | head -1 | cut -d'"' -f4)
INSTRUMENT_AFTER=$(curl -s -H "Authorization: Bearer $TOKEN" "$BASE_URL/instruments/$INSTRUMENT_ID")
INSTRUMENT_STATUS_AFTER=$(echo "$INSTRUMENT_AFTER" | grep -o '"status":"[^"]*"' | head -1 | cut -d'"' -f4)
echo "Rental status: $RENTAL_STATUS_AFTER (expected: $RENTAL_STATUS_BEFORE)"
echo "Deposit status: $DEPOSIT_STATUS_AFTER (expected: $DEPOSIT_STATUS_BEFORE)"
echo "Instrument status: $INSTRUMENT_STATUS_AFTER (expected: rented)"
echo ""

echo "=== 4. 测试非法状态转换（pending_review -> pending_review 非法） ==="
curl -s -X PUT "$BASE_URL/returns/$RETURN_ID/review" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"pending_review","review_notes":"非法转换测试"}'
echo " (should return error or no change)"
echo ""

echo "=== 5. 审核通过（pending_review -> approved） ==="
curl -s -X PUT "$BASE_URL/returns/$RETURN_ID/review" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"approved","review_notes":"审核通过"}'
echo ""

RENTAL_APPROVED=$(curl -s -H "Authorization: Bearer $TOKEN" "$BASE_URL/rentals/$RENTAL_ID")
RENTAL_STATUS_APP=$(echo "$RENTAL_APPROVED" | grep -o '"status":"[^"]*"' | head -1 | cut -d'"' -f4)
DEPOSIT_STATUS_APP=$(echo "$RENTAL_APPROVED" | grep -o '"deposit_status":"[^"]*"' | head -1 | cut -d'"' -f4)
INSTRUMENT_APP=$(curl -s -H "Authorization: Bearer $TOKEN" "$BASE_URL/instruments/$INSTRUMENT_ID")
INSTRUMENT_STATUS_APP=$(echo "$INSTRUMENT_APP" | grep -o '"status":"[^"]*"' | head -1 | cut -d'"' -f4)
echo "Rental status after approved: $RENTAL_STATUS_APP (expected: returned)"
echo "Deposit status after approved: $DEPOSIT_STATUS_APP (expected: partially_refunded)"
echo "Instrument status after approved: $INSTRUMENT_STATUS_APP (expected: available)"
echo ""

echo "=== 6. 撤销通过，改为需回查（approved -> needs_review） ==="
curl -s -X PUT "$BASE_URL/returns/$RETURN_ID/review" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"needs_review","review_notes":"需回查，撤销通过"}'
echo ""

RENTAL_NEEDS=$(curl -s -H "Authorization: Bearer $TOKEN" "$BASE_URL/rentals/$RENTAL_ID")
RENTAL_STATUS_NEEDS=$(echo "$RENTAL_NEEDS" | grep -o '"status":"[^"]*"' | head -1 | cut -d'"' -f4)
DEPOSIT_STATUS_NEEDS=$(echo "$RENTAL_NEEDS" | grep -o '"deposit_status":"[^"]*"' | head -1 | cut -d'"' -f4)
INSTRUMENT_NEEDS=$(curl -s -H "Authorization: Bearer $TOKEN" "$BASE_URL/instruments/$INSTRUMENT_ID")
INSTRUMENT_STATUS_NEEDS=$(echo "$INSTRUMENT_NEEDS" | grep -o '"status":"[^"]*"' | head -1 | cut -d'"' -f4)
echo "Rental status after needs_review: $RENTAL_STATUS_NEEDS (expected: active/overdue)"
echo "Deposit status after needs_review: $DEPOSIT_STATUS_NEEDS (expected: collected)"
echo "Instrument status after needs_review: $INSTRUMENT_STATUS_NEEDS (expected: rented)"
echo ""

echo "=== 7. 需回查后判争议（needs_review -> disputed） ==="
curl -s -X PUT "$BASE_URL/returns/$RETURN_ID/review" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"disputed","review_notes":"判争议，押金没收"}'
echo ""

RENTAL_DISPUTED=$(curl -s -H "Authorization: Bearer $TOKEN" "$BASE_URL/rentals/$RENTAL_ID")
DEPOSIT_STATUS_DISP=$(echo "$RENTAL_DISPUTED" | grep -o '"deposit_status":"[^"]*"' | head -1 | cut -d'"' -f4)
echo "Deposit status after disputed: $DEPOSIT_STATUS_DISP (expected: forfeited)"
echo ""

echo "=== 8. 撤销争议，改为驳回（disputed -> rejected） ==="
curl -s -X PUT "$BASE_URL/returns/$RETURN_ID/review" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"rejected","review_notes":"驳回，撤销争议"}'
echo ""

RENTAL_REJECTED=$(curl -s -H "Authorization: Bearer $TOKEN" "$BASE_URL/rentals/$RENTAL_ID")
RENTAL_STATUS_REJ=$(echo "$RENTAL_REJECTED" | grep -o '"status":"[^"]*"' | head -1 | cut -d'"' -f4)
DEPOSIT_STATUS_REJ=$(echo "$RENTAL_REJECTED" | grep -o '"deposit_status":"[^"]*"' | head -1 | cut -d'"' -f4)
INSTRUMENT_REJ=$(curl -s -H "Authorization: Bearer $TOKEN" "$BASE_URL/instruments/$INSTRUMENT_ID")
INSTRUMENT_STATUS_REJ=$(echo "$INSTRUMENT_REJ" | grep -o '"status":"[^"]*"' | head -1 | cut -d'"' -f4)
echo "Rental status after rejected: $RENTAL_STATUS_REJ (expected: active/overdue)"
echo "Deposit status after rejected: $DEPOSIT_STATUS_REJ (expected: collected)"
echo "Instrument status after rejected: $INSTRUMENT_STATUS_REJ (expected: rented)"
echo ""

echo "=== 9. 驳回后重新通过（rejected -> approved） ==="
curl -s -X PUT "$BASE_URL/returns/$RETURN_ID/review" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"approved","review_notes":"重新审核通过"}'
echo ""

RENTAL_APP2=$(curl -s -H "Authorization: Bearer $TOKEN" "$BASE_URL/rentals/$RENTAL_ID")
RENTAL_STATUS_APP2=$(echo "$RENTAL_APP2" | grep -o '"status":"[^"]*"' | head -1 | cut -d'"' -f4)
DEPOSIT_STATUS_APP2=$(echo "$RENTAL_APP2" | grep -o '"deposit_status":"[^"]*"' | head -1 | cut -d'"' -f4)
INSTRUMENT_APP2=$(curl -s -H "Authorization: Bearer $TOKEN" "$BASE_URL/instruments/$INSTRUMENT_ID")
INSTRUMENT_STATUS_APP2=$(echo "$INSTRUMENT_APP2" | grep -o '"status":"[^"]*"' | head -1 | cut -d'"' -f4)
echo "Rental status after approved: $RENTAL_STATUS_APP2 (expected: returned)"
echo "Deposit status after approved: $DEPOSIT_STATUS_APP2 (expected: partially_refunded)"
echo "Instrument status after approved: $INSTRUMENT_STATUS_APP2 (expected: available)"
echo ""

echo "=== 10. 查看 audit_logs 验证状态转换留痕 ==="
AUDIT_LOGS=$(curl -s -H "Authorization: Bearer $TOKEN" "$BASE_URL/dashboard/audit-logs?entity_type=return&entity_id=$RETURN_ID")
echo "$AUDIT_LOGS" | grep -o '"action":"[^"]*","entity_type":"[^"]*","entity_id":[0-9]*' | sort | uniq
echo ""
LOG_COUNT=$(echo "$AUDIT_LOGS" | grep -o '"action":"[^"]*"' | wc -l)
echo "Total audit logs for return $RETURN_ID: $LOG_COUNT (expected: create + 5 reviews = 6)"
echo ""

echo "=== 所有状态机测试完成 ==="
