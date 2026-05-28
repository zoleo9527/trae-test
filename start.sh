#!/bin/bash

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "🚀 启动营地管理系统..."

echo ""
echo "📦 检查后端依赖..."
cd "$ROOT_DIR/backend"
if [ ! -f "camp-server" ]; then
    echo "🔨 编译后端..."
    go build -o camp-server ./cmd/main.go
fi

echo ""
echo "📦 检查前端依赖..."
cd "$ROOT_DIR/frontend"
if [ ! -d "node_modules" ]; then
    echo "🔨 安装前端依赖..."
    npm install
fi

echo ""
echo "🟢 启动后端服务器 (端口 3001)..."
cd "$ROOT_DIR/backend"
lsof -ti:3001 | xargs kill -9 2>/dev/null
./camp-server &
BACKEND_PID=$!
sleep 2

echo "🟢 启动前端开发服务器 (端口 5173)..."
cd "$ROOT_DIR/frontend"
lsof -ti:5173 | xargs kill -9 2>/dev/null
lsof -ti:5174 | xargs kill -9 2>/dev/null

npm run dev &
FRONTEND_PID=$!

echo ""
echo "✅ 系统启动完成！"
echo ""
echo "🌐 访问地址："
echo "   前端: http://localhost:5173 (或 http://localhost:5174)"
echo "   后端API: http://localhost:3001"
echo ""
echo "🔑 测试账号（密码均为 password123）："
echo "   director1  - 营地主任"
echo "   teacher1   - 班务老师"
echo "   logistics1 - 后勤协调"
echo ""
echo "⏹️  按 Ctrl+C 停止服务"

cleanup() {
    echo ""
    echo "⏹️  正在停止服务..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    exit 0
}

trap cleanup SIGINT SIGTERM

wait
