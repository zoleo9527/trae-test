#!/bin/bash

BASE_URL="http://localhost:3000/api"
TOKEN=""

echo "======================================"
echo "  婚纱影楼服装调度系统 API 测试脚本"
echo "======================================"

login() {
    echo ""
    echo "=== 1. 登录获取 Token ==="
    RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
        -H "Content-Type: application/json" \
        -d '{"phone":"13800138001","password":"123456"}')
    echo "登录响应: $RESPONSE"
    TOKEN=$(echo $RESPONSE | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
    echo "获取到的 Token: $TOKEN"
}

test_health() {
    echo ""
    echo "=== 健康检查 ==="
    curl -s "http://localhost:3000/health" | python3 -m json.tool
}

test_costumes() {
    echo ""
    echo "=== 2. 获取服装列表 ==="
    curl -s -X GET "$BASE_URL/costumes?page=1&page_size=5&category=婚纱" \
        -H "Authorization: Bearer $TOKEN" | python3 -m json.tool

    echo ""
    echo "=== 3. 创建新服装 ==="
    curl -s -X POST "$BASE_URL/costumes" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d '{
            "name": "测试款婚纱",
            "category": "婚纱",
            "style": "韩系",
            "size": "M",
            "color": "粉色",
            "brand": "测试品牌",
            "purchase_price": 5000,
            "rental_price": 800,
            "remark": "API测试创建"
        }' | python3 -m json.tool
}

test_customers() {
    echo ""
    echo "=== 4. 获取客户列表 ==="
    curl -s -X GET "$BASE_URL/schedules/customers" \
        -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
}

test_schedules() {
    echo ""
    echo "=== 5. 获取档期列表 ==="
    curl -s -X GET "$BASE_URL/schedules?page=1&page_size=10" \
        -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
}

test_dispatches() {
    echo ""
    echo "=== 6. 获取调度记录列表 ==="
    curl -s -X GET "$BASE_URL/dispatches?page=1&page_size=10" \
        -H "Authorization: Bearer $TOKEN" | python3 -m json.tool

    echo ""
    echo "=== 7. 筛选状态为已归还的调度记录 ==="
    curl -s -X GET "$BASE_URL/dispatches?status=returned" \
        -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
}

test_maintenances() {
    echo ""
    echo "=== 8. 获取保养记录列表 ==="
    curl -s -X GET "$BASE_URL/maintenances?page=1&page_size=10" \
        -H "Authorization: Bearer $TOKEN" | python3 -m json.tool

    echo ""
    echo "=== 9. 筛选维修类型的保养记录 ==="
    curl -s -X GET "$BASE_URL/maintenances?type=repair" \
        -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
}

test_logs() {
    echo ""
    echo "=== 10. 获取操作日志（店长权限） ==="
    curl -s -X GET "$BASE_URL/logs?page=1&page_size=20" \
        -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
}

test_exports() {
    echo ""
    echo "=== 11. 导出服装调度记录 ==="
    curl -s -X GET "$BASE_URL/exports/dispatches?start_date=2024-01-01&end_date=2024-12-31" \
        -H "Authorization: Bearer $TOKEN" \
        -o "dispatches_export.xlsx"
    echo "导出完成，文件保存为: dispatches_export.xlsx"

    echo ""
    echo "=== 12. 导出保养记录 ==="
    curl -s -X GET "$BASE_URL/exports/maintenances" \
        -H "Authorization: Bearer $TOKEN" \
        -o "maintenances_export.xlsx"
    echo "导出完成，文件保存为: maintenances_export.xlsx"
}

test_normal_flow() {
    echo ""
    echo "======================================"
    echo "  正常流程测试: 预约 -> 领取 -> 归还"
    echo "======================================"

    echo ""
    echo "Step 1: 获取可用服装ID"
    COSTUME_RESP=$(curl -s -X GET "$BASE_URL/costumes?status=available&page_size=1" \
        -H "Authorization: Bearer $TOKEN")
    COSTUME_ID=$(echo $COSTUME_RESP | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
    echo "选中服装ID: $COSTUME_ID"

    echo ""
    echo "Step 2: 获取客户ID"
    CUST_RESP=$(curl -s -X GET "$BASE_URL/schedules/customers?page_size=1" \
        -H "Authorization: Bearer $TOKEN")
    CUSTOMER_ID=$(echo $CUST_RESP | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
    echo "选中客户ID: $CUSTOMER_ID"

    echo ""
    echo "Step 3: 创建档期"
    SCHEDULE_RESP=$(curl -s -X POST "$BASE_URL/schedules" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d "{
            \"customer_id\": $CUSTOMER_ID,
            \"schedule_date\": \"2024-12-01\",
            \"time_slot\": \"09:00-12:00\",
            \"type\": \"内景拍摄\",
            \"deposit_amount\": 1000,
            \"total_amount\": 5999
        }")
    echo "档期创建响应: $SCHEDULE_RESP"
    SCHEDULE_ID=$(echo $SCHEDULE_RESP | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
    echo "创建的档期ID: $SCHEDULE_ID"

    echo ""
    echo "Step 4: 创建服装调度（预约）"
    DISPATCH_RESP=$(curl -s -X POST "$BASE_URL/dispatches" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d "{
            \"schedule_id\": $SCHEDULE_ID,
            \"costume_id\": $COSTUME_ID,
            \"customer_id\": $CUSTOMER_ID,
            \"expected_pickup_at\": \"2024-11-30T10:00:00Z\",
            \"expected_return_at\": \"2024-12-02T18:00:00Z\",
            \"accessories\": \"头纱、项链\",
            \"remark\": \"正常流程测试\"
        }")
    echo "调度创建响应: $DISPATCH_RESP"
    DISPATCH_ID=$(echo $DISPATCH_RESP | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
    echo "创建的调度ID: $DISPATCH_ID"

    echo ""
    echo "Step 5: 领取服装"
    curl -s -X POST "$BASE_URL/dispatches/$DISPATCH_ID/pickup" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d '{"remark": "客户准时取件，配件齐全"}' | python3 -m json.tool

    echo ""
    echo "Step 6: 归还服装（无损坏）"
    curl -s -X POST "$BASE_URL/dispatches/$DISPATCH_ID/return" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d '{"remark": "检查无误，服装完好"}' | python3 -m json.tool

    echo ""
    echo "Step 7: 查看自动创建的保养记录"
    curl -s -X GET "$BASE_URL/maintenances?dispatch_id=$DISPATCH_ID" \
        -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
}

test_problem_flow() {
    echo ""
    echo "======================================"
    echo "  问题流程测试: 预约 -> 领取 -> 损坏归还 -> 维修"
    echo "======================================"

    echo ""
    echo "Step 1: 获取可用服装ID"
    COSTUME_RESP=$(curl -s -X GET "$BASE_URL/costumes?status=available&page_size=1" \
        -H "Authorization: Bearer $TOKEN")
    COSTUME_ID=$(echo $COSTUME_RESP | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
    echo "选中服装ID: $COSTUME_ID"

    echo ""
    echo "Step 2: 获取客户ID"
    CUST_RESP=$(curl -s -X GET "$BASE_URL/schedules/customers?page_size=1" \
        -H "Authorization: Bearer $TOKEN")
    CUSTOMER_ID=$(echo $CUST_RESP | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
    echo "选中客户ID: $CUSTOMER_ID"

    echo ""
    echo "Step 3: 创建档期"
    SCHEDULE_RESP=$(curl -s -X POST "$BASE_URL/schedules" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d "{
            \"customer_id\": $CUSTOMER_ID,
            \"schedule_date\": \"2024-12-05\",
            \"time_slot\": \"14:00-18:00\",
            \"type\": \"外景拍摄\",
            \"deposit_amount\": 800,
            \"total_amount\": 6999
        }")
    SCHEDULE_ID=$(echo $SCHEDULE_RESP | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
    echo "创建的档期ID: $SCHEDULE_ID"

    echo ""
    echo "Step 4: 创建服装调度"
    DISPATCH_RESP=$(curl -s -X POST "$BASE_URL/dispatches" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d "{
            \"schedule_id\": $SCHEDULE_ID,
            \"costume_id\": $COSTUME_ID,
            \"customer_id\": $CUSTOMER_ID,
            \"expected_pickup_at\": \"2024-12-04T10:00:00Z\",
            \"expected_return_at\": \"2024-12-06T18:00:00Z\",
            \"remark\": \"问题流程测试\"
        }")
    DISPATCH_ID=$(echo $DISPATCH_RESP | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
    echo "创建的调度ID: $DISPATCH_ID"

    echo ""
    echo "Step 5: 领取服装"
    curl -s -X POST "$BASE_URL/dispatches/$DISPATCH_ID/pickup" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d '{}' > /dev/null

    echo ""
    echo "Step 6: 归还服装（有损坏）"
    curl -s -X POST "$BASE_URL/dispatches/$DISPATCH_ID/return" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d '{
            "damage_remark": "裙摆处有明显污渍，左侧拉链损坏",
            "remark": "外景拍摄时意外弄脏，需要深度清洁和维修"
        }' | python3 -m json.tool

    echo ""
    echo "Step 7: 查看维修保养记录"
    MAINT_RESP=$(curl -s -X GET "$BASE_URL/maintenances?dispatch_id=$DISPATCH_ID" \
        -H "Authorization: Bearer $TOKEN")
    echo $MAINT_RESP | python3 -m json.tool
    MAINT_ID=$(echo $MAINT_RESP | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
    echo "维修记录ID: $MAINT_ID"

    echo ""
    echo "Step 8: 完成保养"
    curl -s -X POST "$BASE_URL/maintenances/$MAINT_ID/complete" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d '{
            "cost": 280,
            "remark": "污渍已清洁，拉链已更换"
        }' | python3 -m json.tool

    echo ""
    echo "Step 9: 查看服装状态是否恢复可用"
    curl -s -X GET "$BASE_URL/costumes/$COSTUME_ID" \
        -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
}

test_cancel_flow() {
    echo ""
    echo "======================================"
    echo "  取消流程测试: 预约 -> 取消"
    echo "======================================"

    echo ""
    echo "Step 1: 获取可用服装ID"
    COSTUME_RESP=$(curl -s -X GET "$BASE_URL/costumes?status=available&page_size=1" \
        -H "Authorization: Bearer $TOKEN")
    COSTUME_ID=$(echo $COSTUME_RESP | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
    echo "选中服装ID: $COSTUME_ID"

    echo ""
    echo "Step 2: 获取客户ID"
    CUST_RESP=$(curl -s -X GET "$BASE_URL/schedules/customers?page_size=1" \
        -H "Authorization: Bearer $TOKEN")
    CUSTOMER_ID=$(echo $CUST_RESP | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)

    echo ""
    echo "Step 3: 创建档期"
    SCHEDULE_RESP=$(curl -s -X POST "$BASE_URL/schedules" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d "{
            \"customer_id\": $CUSTOMER_ID,
            \"schedule_date\": \"2024-12-10\",
            \"time_slot\": \"09:00-12:00\",
            \"type\": \"内景拍摄\"
        }")
    SCHEDULE_ID=$(echo $SCHEDULE_RESP | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)

    echo ""
    echo "Step 4: 创建服装调度"
    DISPATCH_RESP=$(curl -s -X POST "$BASE_URL/dispatches" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d "{
            \"schedule_id\": $SCHEDULE_ID,
            \"costume_id\": $COSTUME_ID,
            \"customer_id\": $CUSTOMER_ID,
            \"remark\": \"取消流程测试\"
        }")
    DISPATCH_ID=$(echo $DISPATCH_RESP | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
    echo "创建的调度ID: $DISPATCH_ID"

    echo ""
    echo "Step 5: 查看服装状态（应是已预约）"
    curl -s -X GET "$BASE_URL/costumes/$COSTUME_ID" \
        -H "Authorization: Bearer $TOKEN" | python3 -c "import sys,json;d=json.load(sys.stdin);print('服装状态:', d['data']['costume']['status'])"

    echo ""
    echo "Step 6: 取消调度"
    curl -s -X POST "$BASE_URL/dispatches/$DISPATCH_ID/cancel" \
        -H "Authorization: Bearer $TOKEN" | python3 -m json.tool

    echo ""
    echo "Step 7: 查看服装状态（应恢复为可用）"
    curl -s -X GET "$BASE_URL/costumes/$COSTUME_ID" \
        -H "Authorization: Bearer $TOKEN" | python3 -c "import sys,json;d=json.load(sys.stdin);print('服装状态:', d['data']['costume']['status'])"
}

test_reschedule_flow() {
    echo ""
    echo "======================================"
    echo "  改期流程测试: 确认 -> 改期"
    echo "======================================"

    echo ""
    echo "Step 1: 获取可用服装ID（2件）"
    COSTUME_RESP=$(curl -s -X GET "$BASE_URL/costumes?status=available&page_size=2" \
        -H "Authorization: Bearer $TOKEN")
    COSTUME_ID_1=$(echo $COSTUME_RESP | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
    COSTUME_ID_2=$(echo $COSTUME_RESP | grep -o '"id":[0-9]*' | head -2 | tail -1 | cut -d':' -f2)
    echo "服装1 ID: $COSTUME_ID_1, 服装2 ID: $COSTUME_ID_2"

    echo ""
    echo "Step 2: 获取客户ID"
    CUST_RESP=$(curl -s -X GET "$BASE_URL/schedules/customers?page_size=1" \
        -H "Authorization: Bearer $TOKEN")
    CUSTOMER_ID=$(echo $CUST_RESP | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)

    echo ""
    echo "Step 3: 创建档期"
    SCHEDULE_RESP=$(curl -s -X POST "$BASE_URL/schedules" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d "{
            \"customer_id\": $CUSTOMER_ID,
            \"schedule_date\": \"2024-12-15\",
            \"time_slot\": \"09:00-12:00\",
            \"type\": \"外景拍摄\"
        }")
    SCHEDULE_ID=$(echo $SCHEDULE_RESP | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
    echo "创建的档期ID: $SCHEDULE_ID"

    echo ""
    echo "Step 4: 确认档期"
    curl -s -X POST "$BASE_URL/schedules/$SCHEDULE_ID/confirm" \
        -H "Authorization: Bearer $TOKEN" | python3 -m json.tool

    echo ""
    echo "Step 5: 创建服装调度（使用服装1）"
    DISPATCH_RESP=$(curl -s -X POST "$BASE_URL/dispatches" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d "{
            \"schedule_id\": $SCHEDULE_ID,
            \"costume_id\": $COSTUME_ID_1,
            \"customer_id\": $CUSTOMER_ID,
            \"expected_pickup_at\": \"2024-12-14T10:00:00Z\",
            \"expected_return_at\": \"2024-12-16T18:00:00Z\",
            \"remark\": \"改期流程测试\"
        }")
    DISPATCH_ID=$(echo $DISPATCH_RESP | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
    echo "创建的调度ID: $DISPATCH_ID"

    echo ""
    echo "Step 6: 确认调度"
    curl -s -X POST "$BASE_URL/dispatches/$DISPATCH_ID/confirm" \
        -H "Authorization: Bearer $TOKEN" | python3 -m json.tool

    echo ""
    echo "Step 7: 服装1状态（已预约）, 服装2状态（可用）"
    curl -s -X GET "$BASE_URL/costumes/$COSTUME_ID_1" \
        -H "Authorization: Bearer $TOKEN" | python3 -c "import sys,json;d=json.load(sys.stdin);print('服装1状态:', d['data']['costume']['status'])"
    curl -s -X GET "$BASE_URL/costumes/$COSTUME_ID_2" \
        -H "Authorization: Bearer $TOKEN" | python3 -c "import sys,json;d=json.load(sys.stdin);print('服装2状态:', d['data']['costume']['status'])"

    echo ""
    echo "Step 8: 档期改期 + 更换服装"
    curl -s -X POST "$BASE_URL/schedules/$SCHEDULE_ID/reschedule" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d "{
            \"schedule_date\": \"2024-12-20\",
            \"time_slot\": \"14:00-18:00\",
            \"remark\": \"客户要求改期到周末\"
        }" | python3 -m json.tool

    echo ""
    echo "Step 9: 调度改期 + 更换服装（换成服装2）"
    curl -s -X POST "$BASE_URL/dispatches/$DISPATCH_ID/reschedule" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d "{
            \"new_costume_id\": $COSTUME_ID_2,
            \"expected_pickup_at\": \"2024-12-19T10:00:00Z\",
            \"expected_return_at\": \"2024-12-21T18:00:00Z\",
            \"remark\": \"换一件更合适的\"
        }" | python3 -m json.tool

    echo ""
    echo "Step 10: 服装1状态（应释放为可用）, 服装2状态（应变为已预约）"
    curl -s -X GET "$BASE_URL/costumes/$COSTUME_ID_1" \
        -H "Authorization: Bearer $TOKEN" | python3 -c "import sys,json;d=json.load(sys.stdin);print('服装1状态:', d['data']['costume']['status'])"
    curl -s -X GET "$BASE_URL/costumes/$COSTUME_ID_2" \
        -H "Authorization: Bearer $TOKEN" | python3 -c "import sys,json;d=json.load(sys.stdin);print('服装2状态:', d['data']['costume']['status'])"
}

test_statemachine_validation() {
    echo ""
    echo "======================================"
    echo "  状态机约束验证测试"
    echo "======================================"

    echo ""
    echo "Step 1: 创建档期（状态: pending）"
    CUST_RESP=$(curl -s -X GET "$BASE_URL/schedules/customers?page_size=1" \
        -H "Authorization: Bearer $TOKEN")
    CUSTOMER_ID=$(echo $CUST_RESP | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
    
    SCHEDULE_RESP=$(curl -s -X POST "$BASE_URL/schedules" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d "{
            \"customer_id\": $CUSTOMER_ID,
            \"schedule_date\": \"2024-12-25\",
            \"time_slot\": \"09:00-12:00\",
            \"type\": \"内景拍摄\"
        }")
    SCHEDULE_ID=$(echo $SCHEDULE_RESP | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
    echo "创建的档期ID: $SCHEDULE_ID"

    echo ""
    echo "Step 2: 测试非法流转: pending -> completed（应失败）"
    curl -s -X POST "$BASE_URL/schedules/$SCHEDULE_ID/complete" \
        -H "Authorization: Bearer $TOKEN" | python3 -m json.tool

    echo ""
    echo "Step 3: 确认档期（pending -> confirmed, 应成功）"
    curl -s -X POST "$BASE_URL/schedules/$SCHEDULE_ID/confirm" \
        -H "Authorization: Bearer $TOKEN" | python3 -c "import sys,json;d=json.load(sys.stdin);print('success:', d['success'], '| message:', d['message'])"

    echo ""
    echo "Step 4: 再次确认（confirmed -> confirmed, 应失败）"
    curl -s -X POST "$BASE_URL/schedules/$SCHEDULE_ID/confirm" \
        -H "Authorization: Bearer $TOKEN" | python3 -c "import sys,json;d=json.load(sys.stdin);print('success:', d['success'], '| message:', d['message'])"

    echo ""
    echo "Step 5: 创建调度（状态: pending）"
    COSTUME_RESP=$(curl -s -X GET "$BASE_URL/costumes?status=available&page_size=1" \
        -H "Authorization: Bearer $TOKEN")
    COSTUME_ID=$(echo $COSTUME_RESP | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
    
    DISPATCH_RESP=$(curl -s -X POST "$BASE_URL/dispatches" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d "{
            \"schedule_id\": $SCHEDULE_ID,
            \"costume_id\": $COSTUME_ID,
            \"customer_id\": $CUSTOMER_ID
        }")
    DISPATCH_ID=$(echo $DISPATCH_RESP | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
    echo "创建的调度ID: $DISPATCH_ID"

    echo ""
    echo "Step 6: 测试非法流转: pending -> returned（应失败）"
    curl -s -X POST "$BASE_URL/dispatches/$DISPATCH_ID/return" \
        -H "Authorization: Bearer $TOKEN" | python3 -c "import sys,json;d=json.load(sys.stdin);print('success:', d['success'], '| message:', d['message'])"

    echo ""
    echo "Step 7: 查看操作日志 - 检查详细变更记录"
    curl -s -X GET "$BASE_URL/logs?resource_type=schedule&resource_id=$SCHEDULE_ID" \
        -H "Authorization: Bearer $TOKEN" | python3 -c "
import sys,json
d=json.load(sys.stdin)
print('日志总数:', d['data']['total'])
for log in d['data']['list'][:3]:
    print(f\"  [{log['created_at']}] {log['action']}: {log['old_value'][:80]} -> {log['new_value'][:80]}\")
"
}

show_help() {
    echo ""
    echo "使用方法:"
    echo "  $0 health          - 健康检查"
    echo "  $0 login           - 登录获取token"
    echo "  $0 basic           - 基础API测试"
    echo "  $0 normal          - 正常流程测试"
    echo "  $0 problem         - 问题流程测试"
    echo "  $0 cancel          - 取消流程测试"
    echo "  $0 reschedule      - 改期流程测试"
    echo "  $0 statemachine    - 状态机约束验证测试"
    echo "  $0 exports         - 导出功能测试"
    echo "  $0 all             - 全部测试"
    echo ""
    echo "测试账号:"
    echo "  店长: 13800138001 / 123456"
    echo "  选片师: 13800138002 / 123456"
    echo "  客服管家: 13800138003 / 123456"
    echo "  摄影师: 13800138004 / 123456"
}

case "${1:-all}" in
    "health")
        test_health
        ;;
    "login")
        login
        ;;
    "basic")
        login
        test_costumes
        test_customers
        test_schedules
        test_dispatches
        test_maintenances
        test_logs
        ;;
    "normal")
        login
        test_normal_flow
        ;;
    "problem")
        login
        test_problem_flow
        ;;
    "cancel")
        login
        test_cancel_flow
        ;;
    "reschedule")
        login
        test_reschedule_flow
        ;;
    "statemachine")
        login
        test_statemachine_validation
        ;;
    "exports")
        login
        test_exports
        ;;
    "all")
        test_health
        login
        test_costumes
        test_customers
        test_schedules
        test_dispatches
        test_maintenances
        test_logs
        test_normal_flow
        test_problem_flow
        test_cancel_flow
        test_reschedule_flow
        test_statemachine_validation
        test_exports
        ;;
    *)
        show_help
        ;;
esac

echo ""
echo "测试完成！"
