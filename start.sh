#!/bin/bash

echo "============================================="
echo "  桶装水配送管理系统 - 启动脚本"
echo "============================================="
echo ""

echo "[1/3] 检查 Python 环境..."
python3 --version

echo ""
echo "[2/3] 启动后端服务 (端口 8000)..."
cd backend
pip install -r requirements.txt > /dev/null 2>&1
python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!

sleep 3

if curl -s http://localhost:8000/ > /dev/null 2>&1; then
    echo "✓ 后端服务已启动: http://localhost:8000"
    echo "✓ API 文档: http://localhost:8000/docs"
else
    echo "✗ 后端服务启动失败，请检查端口是否被占用"
    exit 1
fi

echo ""
echo "[3/3] 启动前端服务 (端口 3000)..."
cd ../frontend
npm install > /dev/null 2>&1
npm run dev -- --port 3000 &
FRONTEND_PID=$!

sleep 5

echo ""
echo "============================================="
echo "  服务启动完成！"
echo "============================================="
echo "前端地址: http://localhost:3000"
echo "后端地址: http://localhost:8000"
echo "API 文档: http://localhost:8000/docs"
echo ""
echo "测试账号:"
echo "  站长: admin / admin123"
echo "  司机: driver1 / 123456"
echo "  客服: cs1 / 123456"
echo ""
echo "按 Ctrl+C 停止所有服务"
echo "============================================="

trap "kill $BACKEND_PID $FRONTEND_PID; exit" INT

wait
