import requests
import json
import time

BASE_URL = "http://localhost:3000/api"

# 测试登录
login_data = {"username": "owner", "password": "123456"}
print("尝试登录...")
try:
    response = requests.post(f"{BASE_URL}/auth/login", json=login_data, timeout=5)
    print(f"状态码: {response.status_code}")
    print(f"返回: {json.dumps(response.json(), ensure_ascii=False, indent=2)}")
except Exception as e:
    print(f"错误: {e}")
    print("后端服务可能未启动，请先启动后端")
