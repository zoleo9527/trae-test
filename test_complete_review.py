import urllib.request
import json

BASE_URL = "http://localhost:3001/api"

# Manager User ID from seed data
token = "00000000-0000-0000-0000-000000000001"
print(f"✅ 使用 Manager Token: {token[:20]}...")
headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

# 1. 获取商品当前状态
req = urllib.request.Request(f"{BASE_URL}/products/20000000-0000-0000-0000-000000000005", headers=headers)
res = urllib.request.urlopen(req)
product = json.loads(res.read())["product"]
print(f"✅ 商品: {product['name']}, 状态: {product['status']}")

# 2. 完成复盘
data = json.dumps({"reviewNote": "复盘完成，所有问题已跟进"}).encode()
req = urllib.request.Request(f"{BASE_URL}/products/20000000-0000-0000-0000-000000000005/complete-review", data=data, headers=headers, method="POST")
res = urllib.request.urlopen(req)
result = json.loads(res.read())
print(f"✅ 完成复盘，新状态: {result['status']}")

# 3. 再次获取商品状态
req = urllib.request.Request(f"{BASE_URL}/products/20000000-0000-0000-0000-000000000005", headers=headers)
res = urllib.request.urlopen(req)
product = json.loads(res.read())["product"]
print(f"✅ 验证商品: {product['name']}, 最终状态: {product['status']}")

print("\n🎉 复盘完成链路测试通过！")
