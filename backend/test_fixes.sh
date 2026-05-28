#!/bin/bash
set -e

BASE_URL="http://localhost:8081/api"

echo "=== 登录获取 Token ==="
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}')
echo "$LOGIN_RESPONSE"
TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
echo "Token: $TOKEN"
echo ""

echo "=== 1. 测试仪表盘统计 ==="
curl -s -H "Authorization: Bearer $TOKEN" "$BASE_URL/dashboard/stats"
echo ""
echo ""

echo "=== 2. 测试待处理明细 ==="
curl -s -H "Authorization: Bearer $TOKEN" "$BASE_URL/dashboard/items/pending"
echo ""
echo ""

echo "=== 3. 测试已驳回明细 ==="
curl -s -H "Authorization: Bearer $TOKEN" "$BASE_URL/dashboard/items/rejected"
echo ""
echo ""

echo "=== 4. 测试需回查明细 ==="
curl -s -H "Authorization: Bearer $TOKEN" "$BASE_URL/dashboard/items/needs-review"
echo ""
echo ""

echo "=== 5. 获取一个活跃的租赁ID用于测试归还 ==="
RENTALS=$(curl -s -H "Authorization: Bearer $TOKEN" "$BASE_URL/rentals?status=active")
echo "$RENTALS"
RENTAL_ID=$(echo "$RENTALS" | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
echo "Active Rental ID: $RENTAL_ID"
echo ""

echo "=== 6. 测试归还登记（仅创建记录，不修改状态） ==="
RETURN_RESPONSE=$(curl -s -X POST "$BASE_URL/returns" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"rental_id\": $RENTAL_ID,
    \"return_date\": \"2026-05-28\",
    \"condition\": \"good\",
    \"damage_description\": \"测试归还\",
    \"deposit_deduction\": 0,
    \"deposit_refund\": 500
  }")
echo "$RETURN_RESPONSE"
RETURN_ID=$(echo "$RETURN_RESPONSE" | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
echo "Return Record ID: $RETURN_ID"
echo ""

echo "=== 7. 验证租赁状态仍为 active（未提前修改） ==="
curl -s -H "Authorization: Bearer $TOKEN" "$BASE_URL/rentals/$RENTAL_ID"
echo ""
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

echo "=== 9. 验证驳回后租赁状态仍为 active，乐器状态仍为 rented ==="
curl -s -H "Authorization: Bearer $TOKEN" "$BASE_URL/rentals/$RENTAL_ID"
echo ""
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

echo "=== 12. 验证通过后租赁状态变为 returned，乐器变为 available ==="
curl -s -H "Authorization: Bearer $TOKEN" "$BASE_URL/rentals/$RENTAL_ID"
echo ""
echo ""

echo "=== 13. 检查 audit_logs（验证无重复写入，命名正确） ==="
curl -s -H "Authorization: Bearer $TOKEN" "$BASE_URL/dashboard/audit-logs?entity_type=return&entity_id=$RETURN_ID"
echo ""
echo ""

echo "=== 14. 检查 audit_logs action 命名 ==="
curl -s -H "Authorization: Bearer $TOKEN" "$BASE_URL/dashboard/audit-logs?limit=10" | grep -o '"action":"[^"]*"' | sort | uniq
echo ""

echo "=== 所有测试完成 ==="
