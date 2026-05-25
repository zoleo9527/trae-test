#!/bin/bash

echo "🎭 地方剧院管理系统启动脚本"
echo "=============================="

# 检查是否已安装后端依赖
if [ ! -d "backend/__pycache__" ] && [ ! -f "backend/theater.db" ]; then
    echo "📦 安装后端依赖..."
    cd backend && pip install -r requirements.txt
    cd ..
fi

# 启动后端
echo "🚀 启动后端服务 (端口: 8000)..."
cd backend && python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

# 等待后端启动
sleep 3

# 初始化示例数据
echo "📊 初始化示例数据..."
curl -X POST http://localhost:8000/api/init-sample-data -s > /dev/null

# 检查前端依赖
if [ ! -d "frontend/node_modules" ]; then
    echo "📦 安装前端依赖..."
    cd frontend && npm install
    cd ..
fi

# 启动前端
echo "🚀 启动前端服务 (端口: 3000)..."
cd frontend && npm run dev &
FRONTEND_PID=$!

echo ""
echo "✅ 服务启动完成！"
echo ""
echo "📱 前端地址: http://localhost:3000"
echo "📡 后端地址: http://localhost:8000"
echo "📚 API 文档: http://localhost:8000/docs"
echo ""
echo "按 Ctrl+C 停止所有服务"

# 等待用户中断
trap "echo '🛑 正在停止服务...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT
wait
