#!/usr/bin/env python3
import json
from fastapi.testclient import TestClient
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from app.main import app

client = TestClient(app)
response = client.get("/openapi.json")
spec = response.json()
print("Security Schemes:", json.dumps(spec.get("components", {}).get("securitySchemes", {}), indent=2, ensure_ascii=False))
