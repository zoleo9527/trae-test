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

echo "=== 5. 获取一个活跃的租赁ID用于测试归还 ==="
RENTALS=$(curl -s -H "Authorization: Bearer $TOKEN" "$BASE_URL/rentals?status=active")
RENTAL_ID=$(echo "$RENTALS" | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
echo "Active Rental ID: $RENTAL_ID"

# 获取当前租赁状态
RENTAL_BEFORE=$(curl -s -H "Authorization: Bearer $TOKEN" "$BASE_URL/rentals/$RENTAL_ID")
INSTRUMENT_ID_BEFORE=$(echo "$RENTAL_BEFORE" | grep -o '"instrument_id":[0-9]*' | head -1 | cut -d':' -f2)
RENTAL_STATUS_BEFORE=$(echo "$RENTAL_BEFORE" | grep -o '"status":"[^"]*"' | head -1 | cut -d'"' -f4)
echo "Rental status before return: $RENTAL_STATUS_BEFORE"
echo "Instrument ID: $INSTRUMENT_ID_BEFORE"
echo ""

echo "=== 6. 测试归还登记（仅创建记录，不修改状态） ==="
RETURN_RESPONSE=$(curl -s -X POST "$BASE_URL/returns" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"rental_id\": $RENTAL_ID,
    \"return_date\": \"2026-05-28\",
    \"condition\": \"good\",
    \"damage_description\": \"测试归还v2\",
    \"deposit_deduction\": 50,
    \"deposit_refund\": 450
  }")
echo "$RETURN_RESPONSE" | grep -o '"id":[0-9]*,"rental_id":[0-9]*,"status":"[^"]*"'
RETURN_ID=$(echo "$RETURN_RESPONSE" | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
echo "Return Record ID: $RETURN_ID"
echo ""

echo "=== 7. 验证租赁状态仍为 active（未提前修改） ==="
RENTAL_AFTER_CREATE=$(curl -s -H "Authorization: Bearer $TOKEN" "$BASE_URL/rentals/$RENTAL_ID")
RENTAL_STATUS_AFTER_CREATE=$(echo "$RENTAL_AFTER_CREATE" | grep -o '"status":"[^"]*"' | head -1 | cut -d'"' -f4)
DEPOSIT_STATUS_AFTER_CREATE=$(echo "$RENTAL_AFTER_CREATE" | grep -o '"deposit_status":"[^"]*"' | head -1 | cut -d'"' -f4)
echo "Rental status after return create: $RENTAL_STATUS_AFTER_CREATE (expected: active)"
echo "Deposit status after return create: $DEPOSIT_STATUS_AFTER_CREATE (expected: collected)"

INSTRUMENT_AFTER_CREATE=$(curl -s -H "Authorization: Bearer $TOKEN" "$BASE_URL/instruments/$INSTRUMENT_ID_BEFORE")
INSTRUMENT_STATUS_AFTER_CREATE=$(echo "$INSTRUMENT_AFTER_CREATE" | grep -o '"status":"[^"]*"' | head -1 | cut -d'"' -f4)
echo "Instrument status after return create: $INSTRUMENT_STATUS_AFTER_CREATE (expected: rented)"
echo ""

echo "=== 8. 测试归还审核 - 已驳回（rejected）==="
curl -s -X PUT "$BASE_URL/returns/$RETURN_ID/review" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"status\": \"rejected\",
    \"review_notes\": \"资料不全，驳回\"
  }"
echo ""
echo ""

echo "=== 9. 验证驳回后状态正确回滚 ==="
RENTAL_AFTER_REJECT=$(curl -s -H "Authorization: Bearer $TOKEN" "$BASE_URL/rentals/$RENTAL_ID")
RENTAL_STATUS_AFTER_REJECT=$(echo "$RENTAL_AFTER_REJECT" | grep -o '"status":"[^"]*"' | head -1 | cut -d'"' -f4)
DEPOSIT_STATUS_AFTER_REJECT=$(echo "$RENTAL_AFTER_REJECT" | grep -o '"deposit_status":"[^"]*"' | head -1 | cut -d'"' -f4)
echo "Rental status after reject: $RENTAL_STATUS_AFTER_REJECT (expected: active)"
echo "Deposit status after reject: $DEPOSIT_STATUS_AFTER_REJECT (expected: collected)"

INSTRUMENT_AFTER_REJECT=$(curl -s -H "Authorization: Bearer $TOKEN" "$BASE_URL/instruments/$INSTRUMENT_ID_BEFORE")
INSTRUMENT_STATUS_AFTER_REJECT=$(echo "$INSTRUMENT_AFTER_REJECT" | grep -o '"status":"[^"]*"' | head -1 | cut -d'"' -f4)
echo "Instrument status after reject: $INSTRUMENT_STATUS_AFTER_REJECT (expected: rented)"
echo ""

echo "=== 10. 测试归还审核 - 需回查（needs_review）==="
curl -s -X PUT "$BASE_URL/returns/$RETURN_ID/review" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"status\": \"needs_review\",
    \"review_notes\": \"需要进一步核实损坏情况\"
  }"
echo ""
echo ""

echo "=== 10.1 验证需回查状态下不改变租赁和乐器状态 ==="
RENTAL_AFTER_NEEDS=$(curl -s -H "Authorization: Bearer $TOKEN" "$BASE_URL/rentals/$RENTAL_ID")
RENTAL_STATUS_AFTER_NEEDS=$(echo "$RENTAL_AFTER_NEEDS" | grep -o '"status":"[^"]*"' | head -1 | cut -d'"' -f4)
echo "Rental status after needs_review: $RENTAL_STATUS_AFTER_NEEDS (expected: active)"
echo ""

echo "=== 11. 测试归还审核 - 通过（approved）==="
curl -s -X PUT "$BASE_URL/returns/$RETURN_ID/review" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"status\": \"approved\",
    \"review_notes\": \"审核通过\"
  }"
echo ""
echo ""

echo "=== 12. 验证通过后状态正确更新 ==="
RENTAL_AFTER_APPROVE=$(curl -s -H "Authorization: Bearer $TOKEN" "$BASE_URL/rentals/$RENTAL_ID")
RENTAL_STATUS_AFTER_APPROVE=$(echo "$RENTAL_AFTER_APPROVE" | grep -o '"status":"[^"]*"' | head -1 | cut -d'"' -f4)
DEPOSIT_STATUS_AFTER_APPROVE=$(echo "$RENTAL_AFTER_APPROVE" | grep -o '"deposit_status":"[^"]*"' | head -1 | cut -d'"' -f4)
echo "Rental status after approve: $RENTAL_STATUS_AFTER_APPROVE (expected: returned)"
echo "Deposit status after approve: $DEPOSIT_STATUS_AFTER_APPROVE (expected: partially_refunded)"

INSTRUMENT_AFTER_APPROVE=$(curl -s -H "Authorization: Bearer $TOKEN" "$BASE_URL/instruments/$INSTRUMENT_ID_BEFORE")
INSTRUMENT_STATUS_AFTER_APPROVE=$(echo "$INSTRUMENT_AFTER_APPROVE" | grep -o '"status":"[^"]*"' | head -1 | cut -d'"' -f4)
echo "Instrument status after approve: $INSTRUMENT_STATUS_AFTER_APPROVE (expected: available)"
echo ""

echo "=== 13. 检查 audit_logs（验证无重复写入，命名正确，entity_id正确） ==="
AUDIT_LOGS=$(curl -s -H "Authorization: Bearer $TOKEN" "$BASE_URL/dashboard/audit-logs?entity_type=return&entity_id=$RETURN_ID")
echo "$AUDIT_LOGS" | grep -o '"action":"[^"]*","entity_type":"[^"]*","entity_id":[0-9]*' | sort | uniq
echo ""

echo "=== 14. 统计该 return 的 audit_log 数量（应为3条：create + 2次review） ==="
LOG_COUNT=$(echo "$AUDIT_LOGS" | grep -o '"action":"[^"]*"' | wc -l)
echo "Audit log count for return $RETURN_ID: $LOG_COUNT (expected: 3)"
echo ""

echo "=== 15. 验证创建记录时 entity_id 不为 0 ==="
echo "$AUDIT_LOGS" | grep -o '"entity_id":[0-9]*' | sort | uniq
echo ""

echo "=== 16. 测试仪表盘明细接口 ==="
echo "--- 待处理 ---"
PENDING=$(curl -s -H "Authorization: Bearer $TOKEN" "$BASE_URL/dashboard/items/pending")
echo "$PENDING" | grep -o '"total":[0-9]*'

echo "--- 已驳回 ---"
REJECTED=$(curl -s -H "Authorization: Bearer $TOKEN" "$BASE_URL/dashboard/items/rejected")
echo "$REJECTED" | grep -o '"total":[0-9]*'

echo "--- 需回查 ---"
NEEDS=$(curl -s -H "Authorization: Bearer $TOKEN" "$BASE_URL/dashboard/items/needs-review")
echo "$NEEDS" | grep -o '"total":[0-9]*'
echo ""

echo "=== 17. 检查所有 audit_logs 的 action 命名（应只有 service 层的命名，无 HTTP 方法） ==="
ALL_ACTIONS=$(curl -s -H "Authorization: Bearer $TOKEN" "$BASE_URL/dashboard/audit-logs?limit=50" | grep -o '"action":"[^"]*"' | sort | uniq)
echo "All audit log actions:"
echo "$ALL_ACTIONS"
echo ""

echo "=== 所有测试完成 ==="
