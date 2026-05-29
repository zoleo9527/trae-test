#!/bin/bash

echo "======================================"
echo "  汽配商行管理系统 - 快速启动脚本"
echo "======================================"

echo ""
echo "检查依赖..."

if ! command -v node &> /dev/null; then
    echo "❌ 请先安装 Node.js"
    exit 1
fi

if ! command -v python3 &> /dev/null; then
    echo "❌ 请先安装 Python 3"
    exit 1
fi

echo "✅ Node.js: $(node -v)"
echo "✅ Python: $(python3 --version)"

echo ""
echo "安装前端依赖..."
cd frontend
if [ ! -d "node_modules" ]; then
    npm install
fi

echo ""
echo "安装后端依赖..."
cd ../backend
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi
source venv/bin/activate
pip install -q -r requirements.txt

echo ""
echo "======================================"
echo "  启动服务..."
echo "======================================"
echo ""
echo "📊 后端服务将运行在: http://localhost:8080"
echo "🌐 前端服务将运行在: http://localhost:5173"
echo ""
echo "请分别在两个终端中运行以下命令:"
echo ""
echo "终端1 (后端):"
echo "  cd backend && source venv/bin/activate && python main.py"
echo ""
echo "终端2 (前端):"
echo "  cd frontend && npm run dev"
echo ""
echo "或使用 Electron 模式:"
echo "  cd frontend && npm run electron"
echo ""
