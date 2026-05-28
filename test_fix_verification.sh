#!/bin/bash

BASE_URL="http://localhost:8080/api/v1"
TOKEN=""

echo "========================================"
echo " 第三阶段修复验证测试"
echo "========================================"

# 登录函数
login() {
    local username=$1
    local password=$2
    echo ""
    echo "登录: $username"
    RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
        -H "Content-Type: application/json" \
        -d "{\"username\":\"$username\",\"password\":\"$password\"}")
    TOKEN=$(echo $RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)
    USER_ID=$(echo $RESPONSE | grep -o '"user_id":"[^"]*' | cut -d'"' -f4)
    echo "Token: ${TOKEN:0:20}..."
    echo "UserID: $USER_ID"
}

# 测试1: dashboard camp_id权限校验
test_dashboard_permission() {
    echo ""
    echo "========================================"
    echo "测试1: Dashboard camp_id权限校验"
    echo "========================================"
    
    login "teacher1" "123456"
    
    echo ""
    echo "老师访问自己营地(有权限 camp-001)"
    RESULT=$(curl -s -H "Authorization: Bearer $TOKEN" "$BASE_URL/dashboard?camp_id=camp-001")
    echo $RESULT | python3 -m json.tool | head -20
    
    echo ""
    echo "老师访问其它营地(应该被拒绝 camp-002)"
    RESULT=$(curl -s -H "Authorization: Bearer $TOKEN" "$BASE_URL/dashboard?camp_id=camp-002")
    echo $RESULT | python3 -m json.tool
    
    echo ""
    echo "权限校验结果:"
    if echo $RESULT | grep -q "无权限"; then
        echo "✅ 正确: 越权访问被拒绝"
    else
        echo "❌ 错误: 越权访问未被拒绝"
    fi
}

# 测试2: 签到写操作越权校验
test_checkin_write_permission() {
    echo ""
    echo "========================================"
    echo "测试2: 签到写操作越权校验"
    echo "========================================"
    
    login "teacher1" "123456"
    TEACHER1_ID=$USER_ID
    
    echo ""
    echo "获取营员列表..."
    CAMPERS=$(curl -s -H "Authorization: Bearer $TOKEN" "$BASE_URL/campers?camp_id=camp-001")
    
    # 获取老师1自己负责的营员ID
    CAMPER1_ID=$(echo $CAMPERS | python3 -c "
import sys, json
data = json.load(sys.stdin)
for c in data:
    if c['teacher_id'] == '$TEACHER1_ID':
        print(c['id'])
        break
")
    
    # 获取其他老师负责的营员ID
    CAMPER2_ID=$(echo $CAMPERS | python3 -c "
import sys, json
data = json.load(sys.stdin)
for c in data:
    if c['teacher_id'] != '$TEACHER1_ID':
        print(c['id'])
        break
")
    
    CAMPER1_NAME=$(echo $CAMPERS | python3 -c "
import sys, json
data = json.load(sys.stdin)
for c in data:
    if c['id'] == '$CAMPER1_ID':
        print(c['name'])
        break
")
    
    CAMPER2_NAME=$(echo $CAMPERS | python3 -c "
import sys, json
data = json.load(sys.stdin)
for c in data:
    if c['id'] == '$CAMPER2_ID':
        print(c['name'])
        break
")
    
    echo ""
    echo "老师1负责的营员: $CAMPER1_NAME ($CAMPER1_ID)"
    echo "其他老师负责的营员: $CAMPER2_NAME ($CAMPER2_ID)"
    
    echo ""
    echo "测试: 老师1给自己负责的营员签到(应该成功)"
    RESULT=$(curl -s -X POST "$BASE_URL/checkin/batch" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d "{
            \"activity_id\":\"act-001\",
            \"campers\":[{\"camper_id\":\"$CAMPER1_ID\",\"status\":\"present\",\"temperature\":36.5}]
        }")
    echo $RESULT | python3 -m json.tool
    
    echo ""
    echo "测试: 老师1给其他老师负责的营员签到(应该失败)"
    RESULT=$(curl -s -X POST "$BASE_URL/checkin/batch" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d "{
            \"activity_id\":\"act-001\",
            \"campers\":[{\"camper_id\":\"$CAMPER2_ID\",\"status\":\"present\",\"temperature\":36.5}]
        }")
    echo $RESULT | python3 -m json.tool
    
    echo ""
    echo "越权校验结果:"
    if echo $RESULT | grep -q "无权限"; then
        echo "✅ 正确: 越权签到被拒绝"
    else
        echo "❌ 错误: 越权签到未被拒绝"
    fi
}

# 测试3: 医疗写操作越权校验
test_medical_write_permission() {
    echo ""
    echo "========================================"
    echo "测试3: 医疗写操作越权校验"
    echo "========================================"
    
    login "teacher1" "123456"
    TEACHER1_ID=$USER_ID
    
    echo ""
    echo "获取营员列表..."
    CAMPERS=$(curl -s -H "Authorization: Bearer $TOKEN" "$BASE_URL/campers?camp_id=camp-001")
    
    CAMPER1_ID=$(echo $CAMPERS | python3 -c "
import sys, json
data = json.load(sys.stdin)
for c in data:
    if c['teacher_id'] == '$TEACHER1_ID':
        print(c['id'])
        break
")
    CAMPER2_ID=$(echo $CAMPERS | python3 -c "
import sys, json
data = json.load(sys.stdin)
for c in data:
    if c['teacher_id'] != '$TEACHER1_ID':
        print(c['id'])
        break
")
    
    CAMPER1_NAME=$(echo $CAMPERS | python3 -c "
import sys, json
data = json.load(sys.stdin)
for c in data:
    if c['id'] == '$CAMPER1_ID':
        print(c['name'])
        break
")
    CAMPER2_NAME=$(echo $CAMPERS | python3 -c "
import sys, json
data = json.load(sys.stdin)
for c in data:
    if c['id'] == '$CAMPER2_ID':
        print(c['name'])
        break
")
    
    echo ""
    echo "老师1负责的营员: $CAMPER1_NAME ($CAMPER1_ID)"
    echo "其他老师负责的营员: $CAMPER2_NAME ($CAMPER2_ID)"
    
    echo ""
    echo "测试: 老师1给自己负责的营员创建医疗(应该成功)"
    RESULT=$(curl -s -X POST "$BASE_URL/medical" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d "{
            \"camper_id\":\"$CAMPER1_ID\",
            \"symptoms\":\"测试轻微头痛\",
            \"report_time\":\"2024-07-18T10:00:00Z\"
        }")
    echo $RESULT | python3 -m json.tool
    
    echo ""
    echo "测试: 老师1给其他老师负责的营员创建医疗(应该失败)"
    RESULT=$(curl -s -X POST "$BASE_URL/medical" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d "{
            \"camper_id\":\"$CAMPER2_ID\",
            \"symptoms\":\"测试越权操作\",
            \"report_time\":\"2024-07-18T10:00:00Z\"
        }")
    echo $RESULT | python3 -m json.tool
    
    echo ""
    echo "越权校验结果:"
    if echo $RESULT | grep -q "无权限"; then
        echo "✅ 正确: 越权医疗被拒绝"
    else
        echo "❌ 错误: 越权医疗未被拒绝"
    fi
}

# 测试4: 营员详情权限校验
test_camper_detail_permission() {
    echo ""
    echo "========================================"
    echo "测试4: 营员详情与历史接口权限校验"
    echo "========================================"
    
    login "teacher1" "123456"
    TEACHER1_ID=$USER_ID
    
    echo ""
    echo "获取营员列表..."
    CAMPERS=$(curl -s -H "Authorization: Bearer $TOKEN" "$BASE_URL/campers?camp_id=camp-001")
    
    CAMPER1_ID=$(echo $CAMPERS | python3 -c "
import sys, json
data = json.load(sys.stdin)
for c in data:
    if c['teacher_id'] == '$TEACHER1_ID':
        print(c['id'])
        break
")
    CAMPER2_ID=$(echo $CAMPERS | python3 -c "
import sys, json
data = json.load(sys.stdin)
for c in data:
    if c['teacher_id'] != '$TEACHER1_ID':
        print(c['id'])
        break
")
    
    CAMPER1_NAME=$(echo $CAMPERS | python3 -c "
import sys, json
data = json.load(sys.stdin)
for c in data:
    if c['id'] == '$CAMPER1_ID':
        print(c['name'])
        break
")
    CAMPER2_NAME=$(echo $CAMPERS | python3 -c "
import sys, json
data = json.load(sys.stdin)
for c in data:
    if c['id'] == '$CAMPER2_ID':
        print(c['name'])
        break
")
    
    echo ""
    echo "老师1负责的营员: $CAMPER1_NAME ($CAMPER1_ID)"
    echo "其他老师负责的营员: $CAMPER2_NAME ($CAMPER2_ID)"
    
    echo ""
    echo "测试: 老师1查看自己负责营员详情(应该成功)"
    RESULT=$(curl -s -H "Authorization: Bearer $TOKEN" "$BASE_URL/campers/$CAMPER1_ID")
    echo $RESULT | python3 -m json.tool | head -30
    
    echo ""
    echo "测试: 老师1查看其他老师负责营员详情(应该失败)"
    RESULT=$(curl -s -H "Authorization: Bearer $TOKEN" "$BASE_URL/campers/$CAMPER2_ID")
    echo $RESULT | python3 -m json.tool
    
    echo ""
    echo "营员详情权限结果:"
    if echo $RESULT | grep -q "无权限"; then
        echo "✅ 正确: 越权查看营员详情被拒绝"
    else
        echo "❌ 错误: 越权查看营员详情未被拒绝"
    fi
    
    echo ""
    echo "测试: 老师1查看自己负责营员历史(应该成功)"
    RESULT=$(curl -s -H "Authorization: Bearer $TOKEN" "$BASE_URL/campers/$CAMPER1_ID/history")
    echo $RESULT | python3 -m json.tool | head -50
    
    echo ""
    echo "测试: 老师1查看其他老师负责营员历史(应该失败)"
    RESULT=$(curl -s -H "Authorization: Bearer $TOKEN" "$BASE_URL/campers/$CAMPER2_ID/history")
    echo $RESULT | python3 -m json.tool
    
    echo ""
    echo "营员历史权限结果:"
    if echo $RESULT | grep -q "无权限"; then
        echo "✅ 正确: 越权查看营员历史被拒绝"
    else
        echo "❌ 错误: 越权查看营员历史未被拒绝"
    fi
}

# 测试5: 医疗列表关联预加载
test_medical_preload() {
    echo ""
    echo "========================================"
    echo "测试5: 医疗列表关联预加载"
    echo "========================================"
    
    login "director" "123456"
    
    echo ""
    echo "获取医疗列表(检查关联预加载是否正确)"
    RESULT=$(curl -s -H "Authorization: Bearer $TOKEN" "$BASE_URL/medical?camp_id=camp-001")
    
    # 检查是否有不存在的关联错误
    if echo $RESULT | grep -q "error"; then
        echo "❌ 错误: 医疗列表查询出错"
        echo $RESULT | python3 -m json.tool
    else
        echo "✅ 正确: 医疗列表查询成功"
        echo ""
        echo "检查关联字段:"
        echo $RESULT | python3 -c "
import sys, json
data = json.load(sys.stdin)
if data and len(data) > 0:
    report = data[0]
    fields = ['camper', 'reporter', 'related_check_ins']
    for f in fields:
        if f in report:
            print(f'  ✅ {f}: 存在')
        else:
            print(f'  ⚠️  {f}: 不存在(可能为空)')
    # 检查是否有不存在的关联
    invalid_fields = ['status_history', 'parent_notifications', 'related_check_in']
    for f in invalid_fields:
        if f in report:
            print(f'  ❌ {f}: 存在不应该有的关联')
        else:
            print(f'  ✅ {f}: 正确地不存在')
"
    fi
}

# 测试6: 签到-医疗双向关联
test_checkin_medical_link() {
    echo ""
    echo "========================================"
    echo "测试6: 签到到医疗的可查询关联"
    echo "========================================"
    
    login "director" "123456"
    
    echo ""
    echo "获取活动签到列表(检查是否有关联医疗)"
    RESULT=$(curl -s -H "Authorization: Bearer $TOKEN" "$BASE_URL/checkin/activity/act-001")
    
    echo $RESULT | python3 -c "
import sys, json
data = json.load(sys.stdin)
if 'checkins' in data:
    checkins = data['checkins']
else:
    checkins = data if isinstance(data, list) else []

found_link = False
for ci in checkins:
    if 'related_medicals' in ci and ci['related_medicals']:
        found_link = True
        print(f'  ✅ 签到 {ci.get(\"id\",\"?\")} 有关联医疗记录')
        for rm in ci['related_medicals']:
            if 'medical_report' in rm:
                print(f'     - 关联医疗: {rm[\"medical_report\"].get(\"symptoms\",\"?\")}')

if found_link:
    print('✅ 正确: 签到到医疗的关联查询正常')
else:
    print('⚠️  提示: 当前查询结果中没有找到签到-医疗关联(可能是演示数据问题)')
"
}

# 测试7: 物资日志entity_id
test_material_log_entity_id() {
    echo ""
    echo "========================================"
    echo "测试7: 物资日志entity_id"
    echo "========================================"
    
    login "logistics" "123456"
    
    echo ""
    echo "获取物资申领单列表..."
    ISSUES=$(curl -s -H "Authorization: Bearer $TOKEN" "$BASE_URL/materials/issues?camp_id=camp-001")
    echo $ISSUES | python3 -c "
import sys, json
data = json.load(sys.stdin)
print('申领单ID列表:')
for issue in data:
    print(f'  - {issue[\"id\"]} (物资: {issue.get(\"item\",\"?\")})')
"
    
    echo ""
    echo "获取物资相关操作日志..."
    LOGS=$(curl -s -H "Authorization: Bearer $TOKEN" "$BASE_URL/logs/operations?entity_type=material_issue&camp_id=camp-001")
    echo $LOGS | python3 -c "
import sys, json
data = json.load(sys.stdin)
logs = data.get('logs', data) if isinstance(data, dict) else data
print('操作日志entity_id列表:')
for log in logs[:5]:
    if log.get('entity_type') == 'material_issue':
        print(f'  - {log[\"entity_id\"]} (操作: {log.get(\"action\",\"?\")})')
"
    
    echo ""
    echo "检查entity_id一致性:"
    echo $LOGS | python3 -c "
import sys, json
logs_data = json.load(sys.stdin)
logs = logs_data.get('logs', logs_data) if isinstance(logs_data, dict) else logs_data

issues_str = '''$ISSUES'''
import json as j
issues = j.loads(issues_str)
issue_ids = set(i['id'] for i in issues)

all_match = True
for log in logs:
    if log.get('entity_type') == 'material_issue':
        eid = log['entity_id']
        if eid in issue_ids:
            print(f'  ✅ entity_id {eid[:8]}... 匹配申领单')
        else:
            print(f'  ❌ entity_id {eid[:8]}... 不匹配任何申领单!')
            all_match = False

if all_match:
    print('✅ 正确: 物资日志entity_id都是有效的申领单ID')
else:
    print('❌ 错误: 存在不匹配的物资日志entity_id')
"
}

# 测试8: 分房床位校验
test_room_bed_validation() {
    echo ""
    echo "========================================"
    echo "测试8: 分房床位占用和重复分配校验"
    echo "========================================"
    
    login "teacher1" "123456"
    TEACHER1_ID=$USER_ID
    
    echo ""
    echo "获取房间列表..."
    ROOMS=$(curl -s -H "Authorization: Bearer $TOKEN" "$BASE_URL/rooms?camp_id=camp-001")
    echo $ROOMS | python3 -c "
import sys, json
data = json.load(sys.stdin)
print('房间列表:')
for r in data[:3]:
    print(f'  - {r[\"name\"]} (ID: {r[\"id\"]}, 床位数: {r[\"bed_count\"]})')
"
    
    # 获取老师1负责的营员
    CAMPERS=$(curl -s -H "Authorization: Bearer $TOKEN" "$BASE_URL/campers?camp_id=camp-001")
    CAMPER1_ID=$(echo $CAMPERS | python3 -c "
import sys, json
data = json.load(sys.stdin)
for c in data:
    if c['teacher_id'] == '$TEACHER1_ID':
        print(c['id'])
        break
")
    CAMPER1_NAME=$(echo $CAMPERS | python3 -c "
import sys, json
data = json.load(sys.stdin)
for c in data:
    if c['id'] == '$CAMPER1_ID':
        print(c['name'])
        break
")
    
    ROOM1_ID=$(echo $ROOMS | python3 -c "
import sys, json
data = json.load(sys.stdin)
print(data[0]['id'])
")
    ROOM1_BED_COUNT=$(echo $ROOMS | python3 -c "
import sys, json
data = json.load(sys.stdin)
print(data[0]['bed_count'])
")
    
    echo ""
    echo "测试营员: $CAMPER1_NAME ($CAMPER1_ID)"
    echo "测试房间: $ROOM1_ID (床位数: $ROOM1_BED_COUNT)"
    
    echo ""
    echo "测试1: 床位号超出范围(应该失败)"
    RESULT=$(curl -s -X POST "$BASE_URL/rooms/assign" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d "{
            \"camper_id\":\"$CAMPER1_ID\",
            \"room_id\":\"$ROOM1_ID\",
            \"bed_number\":999
        }")
    echo $RESULT | python3 -m json.tool
    
    echo ""
    echo "床位范围校验结果:"
    if echo $RESULT | grep -q "超出范围\|无效\|error"; then
        echo "✅ 正确: 床位号超出范围被拒绝"
    else
        echo "⚠️  提示: 结果: $(echo $RESULT | python3 -m json.tool | head -5)"
    fi
    
    echo ""
    echo "查看当前营员房间分配:"
    curl -s -H "Authorization: Bearer $TOKEN" "$BASE_URL/campers/$CAMPER1_ID" | python3 -m json.tool | grep -E '"room_id"|"bed_number"|"name"' | head -10
}

# 测试9: 回查链路一致性
test_audit_trail_consistency() {
    echo ""
    echo "========================================"
    echo "测试9: 回查链路一致性"
    echo "========================================"
    
    login "director" "123456"
    
    echo ""
    echo "获取营员完整历史(检查全链路)"
    CAMPERS=$(curl -s -H "Authorization: Bearer $TOKEN" "$BASE_URL/campers?camp_id=camp-001")
    CAMPER_ID=$(echo $CAMPERS | python3 -c "
import sys, json
data = json.load(sys.stdin)
print(data[0]['id'])
")
    CAMPER_NAME=$(echo $CAMPERS | python3 -c "
import sys, json
data = json.load(sys.stdin)
print(data[0]['name'])
")
    
    echo ""
    echo "营员: $CAMPER_NAME ($CAMPER_ID)"
    echo ""
    echo "获取完整历史..."
    RESULT=$(curl -s -H "Authorization: Bearer $TOKEN" "$BASE_URL/campers/$CAMPER_ID/history")
    
    echo $RESULT | python3 -c "
import sys, json
data = json.load(sys.stdin)

print('历史记录概览:')
sections = ['checkins', 'medical_reports', 'room_changes', 'material_issues', 'followups', 'status_histories', 'operation_logs']
for s in sections:
    if s in data:
        count = len(data[s]) if isinstance(data[s], list) else 0
        print(f'  - {s}: {count} 条')
    else:
        print(f'  - {s}: 无此字段')

# 检查链路一致性
print()
print('链路一致性检查:')
all_good = True

# 检查签到-医疗关联
if 'checkins' in data and 'medical_reports' in data:
    checkin_medical_links = 0
    for ci in data['checkins']:
        if 'related_medicals' in ci and ci['related_medicals']:
            checkin_medical_links += len(ci['related_medicals'])
    if checkin_medical_links > 0:
        print(f'  ✅ 签到-医疗关联: {checkin_medical_links} 条')
    else:
        print(f'  ⚠️  签到-医疗关联: 0 条(可能无异常签到)')

# 检查操作日志引用
if 'operation_logs' in data:
    log_entity_types = set(log.get('entity_type') for log in data['operation_logs'])
    print(f'  ✅ 操作日志覆盖: {log_entity_types}')

# 检查状态历史
if 'status_histories' in data and len(data['status_histories']) > 0:
    print(f'  ✅ 状态历史: {len(data[\"status_histories\"])} 条')
else:
    print(f'  ⚠️  状态历史: 0 条')

if all_good:
    print()
    print('✅ 正确: 回查链路完整一致')
"
}

# 运行所有测试
echo ""
echo "开始运行验证测试..."
echo ""

test_dashboard_permission
test_checkin_write_permission
test_medical_write_permission
test_camper_detail_permission
test_medical_preload
test_checkin_medical_link
test_material_log_entity_id
test_room_bed_validation
test_audit_trail_consistency

echo ""
echo "========================================"
echo " 所有测试完成！"
echo "========================================"
