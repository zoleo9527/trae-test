#!/bin/bash
set -e

echo "=== 测试第二轮修复 ==="
echo ""

# 1. 登录获取token
echo "=== 1. 登录获取各角色Token ==="
MANAGER_TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"manager","password":"manager123"}' | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['token'])")
echo "Manager Token: ${MANAGER_TOKEN:0:30}..."

WORKER_TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"worker","password":"worker123"}' | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['token'])")
echo "Worker Token:  ${WORKER_TOKEN:0:30}..."

SALES_TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"sales","password":"sales123"}' | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['token'])")
echo "Sales Token:   ${SALES_TOKEN:0:30}..."
echo ""

# 2. 测试recentActivities按用户实体过滤
echo "=== 2. 测试recentActivities按用户实体过滤 ==="
# 先让养护员创建一条养护记录触发审计日志
PLOT_ID=$(curl -s http://localhost:3000/api/plots \
  -H "Authorization: Bearer $MANAGER_TOKEN" | python3 -c "import sys,json; print(json.load(sys.stdin)['data'][0]['id'])")
curl -s -X POST http://localhost:3000/api/maintenance \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $WORKER_TOKEN" \
  -H "x-idempotency-key: test-worker1-$(date +%s)" \
  -d "{\"plotId\":\"$PLOT_ID\",\"maintenanceDate\":\"2025-05-20\",\"type\":\"WATERING\",\"durationMinutes\":60}" > /dev/null
sleep 1

echo "经理查看recentActivities（应该所有实体都能看到）:"
curl -s http://localhost:3000/api/dashboard \
  -H "Authorization: Bearer $MANAGER_TOKEN" | python3 -c "
import sys, json
d = json.load(sys.stdin)
items = d['data']['recentActivities']
types = set(x['entityType'] for x in items)
users = set(x['user']['name'] for x in items)
print(f'   数量: {len(items)}, 实体类型: {types}, 涉及用户: {users}')
"

echo "养护员查看recentActivities（应该只能看到自己的实体）:"
curl -s http://localhost:3000/api/dashboard \
  -H "Authorization: Bearer $WORKER_TOKEN" | python3 -c "
import sys, json
d = json.load(sys.stdin)
items = d['data']['recentActivities']
types = set(x['entityType'] for x in items)
users = set(x['user']['name'] for x in items)
if all(u == '李养护' for u in users):
    print(f'✅ 仅能看到自己的记录！数量: {len(items)}, 类型: {types}, 用户: {users}')
else:
    print(f'❌ 能看到其他用户的记录！类型: {types}, 用户: {users}')
"

echo "销售查看recentActivities（应该只能看到自己的实体）:"
curl -s http://localhost:3000/api/dashboard \
  -H "Authorization: Bearer $SALES_TOKEN" | python3 -c "
import sys, json
d = json.load(sys.stdin)
items = d['data']['recentActivities']
types = set(x['entityType'] for x in items)
users = set(x['user']['name'] for x in items)
if all(u == '王销售' for u in users) if items else True:
    print(f'✅ 仅能看到自己的记录！数量: {len(items)}, 类型: {types}, 用户: {users}')
else:
    print(f'❌ 能看到其他用户的记录！类型: {types}, 用户: {users}')
"
echo ""

# 3. 测试待办完成幂等保护
echo "=== 3. 测试待办完成幂等保护 ==="
TODO_ID=$(curl -s "http://localhost:3000/api/dashboard/todos" \
  -H "Authorization: Bearer $MANAGER_TOKEN" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['data'][0]['id'])")
echo "待办ID: $TODO_ID"

echo "测试缺少幂等键（应该失败）:"
curl -s -X PATCH "http://localhost:3000/api/dashboard/todos/$TODO_ID/complete" \
  -H "Authorization: Bearer $MANAGER_TOKEN" | python3 -c "
import sys, json
d = json.load(sys.stdin)
if not d['success'] and '幂等键' in d.get('error',''):
    print(f'✅ 幂等保护生效：{d[\"error\"]}')
else:
    print(f'❌ 幂等保护失败：{d}')
"
echo ""

# 4. 测试收紧的协商状态流转
echo "=== 4. 测试收紧的协商状态流转 ==="
# 获取一个DRAFT状态的协商
NEG_ID=$(curl -s http://localhost:3000/api/negotiations \
  -H "Authorization: Bearer $MANAGER_TOKEN" | python3 -c "
import sys,json
d=json.load(sys.stdin)
for n in d['data']:
    if n['status'] == 'DRAFT':
        print(n['id'])
        break
")
echo "DRAFT状态协商ID: $NEG_ID"

echo "销售尝试通过状态接口直接进入MANAGER_REVIEW（绕过submit，应该失败）:"
curl -s -X PATCH "http://localhost:3000/api/negotiations/$NEG_ID/status" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SALES_TOKEN" \
  -H "x-idempotency-key: test-bypass-submit-$(date +%s)" \
  -d '{"newStatus":"MANAGER_REVIEW"}' | python3 -c "
import sys, json
d = json.load(sys.stdin)
if not d['success']:
    print(f'✅ 流转限制生效：{d.get(\"error\", \"操作被禁止\")}')
else:
    print(f'❌ 流转限制失败！可以绕过submit接口')
"

echo "销售尝试通过状态接口退回DRAFT（应该失败）:"
curl -s -X PATCH "http://localhost:3000/api/negotiations/$NEG_ID/status" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SALES_TOKEN" \
  -H "x-idempotency-key: test-back-to-draft-$(date +%s)" \
  -d '{"newStatus":"DRAFT"}' | python3 -c "
import sys, json
d = json.load(sys.stdin)
if not d['success']:
    print(f'✅ 退回草稿被禁止：{d.get(\"error\", \"操作被禁止\")}')
else:
    print(f'❌ 可以退回草稿！')
"

echo "获取一个MANAGER_REVIEW状态的协商测试经理操作:"
NEG_REVIEW_ID=$(curl -s http://localhost:3000/api/negotiations \
  -H "Authorization: Bearer $MANAGER_TOKEN" | python3 -c "
import sys,json
d=json.load(sys.stdin)
for n in d['data']:
    if n['status'] == 'MANAGER_REVIEW':
        print(n['id'])
        break
")
echo "MANAGER_REVIEW状态协商ID: $NEG_REVIEW_ID"

echo "经理尝试REJECTED（应该成功）:"
curl -s -X PATCH "http://localhost:3000/api/negotiations/$NEG_REVIEW_ID/status" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $MANAGER_TOKEN" \
  -H "x-idempotency-key: test-manager-reject-$(date +%s)" \
  -d '{"newStatus":"REJECTED","rejectionReason":"测试驳回"}' | python3 -c "
import sys, json
d = json.load(sys.stdin)
if d['success']:
    print(f'✅ 经理驳回成功！状态: {d[\"data\"][\"status\"]}')
else:
    print(f'❌ 经理驳回失败：{d.get(\"error\", \"未知错误\")}')
"

echo "REJECTED状态协商尝试退回DRAFT（应该失败，只能REWORK_REQUIRED）:"
curl -s -X PATCH "http://localhost:3000/api/negotiations/$NEG_REVIEW_ID/status" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $MANAGER_TOKEN" \
  -H "x-idempotency-key: test-rejected-to-draft-$(date +%s)" \
  -d '{"newStatus":"DRAFT"}' | python3 -c "
import sys, json
d = json.load(sys.stdin)
if not d['success']:
    print(f'✅ REJECTED不能退回草稿，流转限制生效：{d.get(\"error\", \"操作被禁止\")}')
else:
    print(f'❌ REJECTED可以退回草稿！')
"

echo ""
echo "=== 所有测试完成 ==="
