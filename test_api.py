import requests
import json

BASE_URL = "http://localhost:3000/api"

# 1. 登录
print("=== 1. 登录测试 ===")
login_data = {"username": "owner", "password": "123456"}
response = requests.post(f"{BASE_URL}/auth/login", json=login_data)
print(f"登录状态: {response.status_code}")
if response.status_code == 201:
    token = response.json()["accessToken"]
    user = response.json()["user"]
    print(f"登录用户: {user['name']} ({user['role']})")
    print(f"Token长度: {len(token)}")
else:
    print(f"错误: {response.text}")
    exit(1)

headers = {"Authorization": f"Bearer {token}"}

# 2. 获取工单统计
print("\n=== 2. 工单统计 ===")
response = requests.get(f"{BASE_URL}/work-orders/stats", headers=headers)
stats = response.json()
print(f"总工单: {stats['total']}")
print(f"按状态: {json.dumps(stats['byStatus'], ensure_ascii=False)}")
print(f"按问题: {json.dumps(stats['byProblemType'], ensure_ascii=False)}")

# 3. 获取工单列表
print("\n=== 3. 工单列表 ===")
response = requests.get(f"{BASE_URL}/work-orders", headers=headers)
work_orders = response.json()
print(f"获取到 {len(work_orders)} 条工单")
for wo in work_orders[:3]:
    print(f"  {wo['orderNumber']}: {wo['title']} [{wo['status']}]")

# 4. 获取工单详情（胶卷混号案例）
print("\n=== 4. 工单详情（胶卷混号案例） ===")
mixed_wo = next(w for w in work_orders if w["problemType"] == "mixed_roll")
response = requests.get(f"{BASE_URL}/work-orders/{mixed_wo['id']}", headers=headers)
wo = response.json()
print(f"工单号: {wo['orderNumber']}")
print(f"客户: {wo['filmRoll']['customerName']}")
print(f"胶卷: {wo['filmRoll']['rollNumber']}")
print(f"混号标记: {wo['filmRoll']['isMixed']}")
print(f"混号说明: {wo['filmRoll']['mixedNote']}")
print(f"状态日志数: {len(wo['statusLogs'])}")
print(f"备注数: {len(wo['notes'])}")
print(f"赔付金额: {wo['compensation']['amount'] if wo.get('compensation') else '无'}")

print("\n状态流转:")
for log in wo['statusLogs']:
    print(f"  {log['createdAt'][:19]}: {log['fromStatus']:>12} → {log['toStatus']:<12}  [{log['operatorName']}] - {log['remark']}")

print("\n备注记录:")
for note in wo['notes'][:3]:
    ptype = '🔒私有' if note['isPrivate'] else '🌐公开'
    print(f"  [{note['type']:<10}] {ptype} {note['creatorName']}: {note['content'][:50]}...")

print("\n✅ 所有 API 测试通过！")
