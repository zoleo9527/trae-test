#!/bin/bash
set -e

echo "=== 测试修复 ==="
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

# 2. 测试审计日志落库
echo "=== 2. 测试审计日志落库 ==="
# 获取一个真实的plotId
PLOT_ID=$(curl -s http://localhost:3000/api/plots \
  -H "Authorization: Bearer $MANAGER_TOKEN" | python3 -c "import sys,json; print(json.load(sys.stdin)['data'][0]['id'])")
echo "Plot ID: $PLOT_ID"

# 创建养护记录（会触发审计日志）
echo "创建养护记录..."
curl -s -X POST http://localhost:3000/api/maintenance \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $WORKER_TOKEN" \
  -H "x-idempotency-key: test-maintenance-$(date +%s)" \
  -d "{\"plotId\":\"$PLOT_ID\",\"maintenanceDate\":\"2025-05-20\",\"type\":\"WATERING\",\"durationMinutes\":60}" > /dev/null
sleep 1

# 检查审计日志
echo "检查审计日志..."
curl -s "http://localhost:3000/api/dashboard/audit-logs" \
  -H "Authorization: Bearer $MANAGER_TOKEN" | python3 -c "
import sys, json
d = json.load(sys.stdin)
items = d['data']
if len(items) > 0:
    print(f'✅ 审计日志落库成功！共 {len(items)} 条')
    print(f'   最新: {items[0][\"action\"]} - {items[0][\"entityType\"]} - {items[0][\"user\"][\"name\"]}')
else:
    print('❌ 审计日志为空')
"
echo ""

# 3. 测试协商状态越权校验
echo "=== 3. 测试协商状态越权校验 ==="
# 获取一个协商ID
NEG_ID=$(curl -s http://localhost:3000/api/negotiations \
  -H "Authorization: Bearer $MANAGER_TOKEN" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['data'][0]['id'])")
echo "协商ID: $NEG_ID"

# 测试销售越权审核
echo "销售尝试审核协商（应该失败）..."
curl -s -X PATCH "http://localhost:3000/api/negotiations/$NEG_ID/status" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SALES_TOKEN" \
  -H "x-idempotency-key: test-sales-approve-$(date +%s)" \
  -d '{"newStatus":"APPROVED","changeReason":"测试越权"}' | python3 -c "
import sys, json
d = json.load(sys.stdin)
if not d['success'] and '权限不足' in d.get('error',''):
    print(f'✅ 越权校验生效：{d[\"error\"]}')
else:
    print(f'❌ 越权校验失败：{d}')
"

# 测试养护越权审核
echo "养护尝试审核协商（应该失败）..."
curl -s -X PATCH "http://localhost:3000/api/negotiations/$NEG_ID/status" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $WORKER_TOKEN" \
  -H "x-idempotency-key: test-worker-approve-$(date +%s)" \
  -d '{"newStatus":"APPROVED","changeReason":"测试越权"}' | python3 -c "
import sys, json
d = json.load(sys.stdin)
if not d['success'] and '权限不足' in d.get('error',''):
    print(f'✅ 越权校验生效：{d[\"error\"]}')
else:
    print(f'❌ 越权校验失败：{d}')
"
echo ""

# 4. 测试仪表盘recentActivities角色过滤
echo "=== 4. 测试仪表盘recentActivities角色过滤 ==="
echo "经理查看recentActivities（应该所有类型）:"
curl -s http://localhost:3000/api/dashboard \
  -H "Authorization: Bearer $MANAGER_TOKEN" | python3 -c "
import sys, json
d = json.load(sys.stdin)
items = d['data']['recentActivities']
types = set(x['entityType'] for x in items)
print(f'   数量: {len(items)}, 包含类型: {types}')
"

echo "养护查看recentActivities（应该只有养护相关）:"
curl -s http://localhost:3000/api/dashboard \
  -H "Authorization: Bearer $WORKER_TOKEN" | python3 -c "
import sys, json
d = json.load(sys.stdin)
items = d['data']['recentActivities']
types = set(x['entityType'] for x in items)
allowed = {'MaintenanceRecord', 'DiseaseReport', 'HarvestRecord', 'TodoItem'}
if types.issubset(allowed):
    print(f'✅ 角色过滤生效！数量: {len(items)}, 类型: {types}')
else:
    print(f'❌ 角色过滤失败！包含不允许的类型: {types - allowed}')
"

echo "销售查看recentActivities（应该只有销售相关）:"
curl -s http://localhost:3000/api/dashboard \
  -H "Authorization: Bearer $SALES_TOKEN" | python3 -c "
import sys, json
d = json.load(sys.stdin)
items = d['data']['recentActivities']
types = set(x['entityType'] for x in items)
allowed = {'CustomerVisit', 'ReseedNegotiation', 'TodoItem'}
if types.issubset(allowed):
    print(f'✅ 角色过滤生效！数量: {len(items)}, 类型: {types}')
else:
    print(f'❌ 角色过滤失败！包含不允许的类型: {types - allowed}')
"
echo ""

# 5. 测试幂等保护
echo "=== 5. 测试幂等保护 ==="
echo "测试状态更新缺少幂等键（应该失败）:"
curl -s -X PATCH "http://localhost:3000/api/negotiations/$NEG_ID/status" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $MANAGER_TOKEN" \
  -d '{"newStatus":"REJECTED","rejectionReason":"测试缺少幂等键"}' | python3 -c "
import sys, json
d = json.load(sys.stdin)
if not d['success'] and '幂等键' in d.get('error',''):
    print(f'✅ 幂等保护生效：{d[\"error\"]}')
else:
    print(f'❌ 幂等保护失败：{d}')
"

echo "测试提交审核缺少幂等键（应该失败）:"
curl -s -X POST "http://localhost:3000/api/negotiations/$NEG_ID/submit" \
  -H "Authorization: Bearer $SALES_TOKEN" | python3 -c "
import sys, json
d = json.load(sys.stdin)
if not d['success'] and '幂等键' in d.get('error',''):
    print(f'✅ 幂等保护生效：{d[\"error\"]}')
else:
    print(f'❌ 幂等保护失败：{d}')
"
echo ""

echo "=== 所有测试完成 ==="
