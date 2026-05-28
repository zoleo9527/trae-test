#!/bin/bash

echo "🎁 礼品定制-客户报价与审批留痕系统"
echo "======================================"

echo ""
echo "🔧 初始化数据库..."
cd backend
if [ ! -d "node_modules" ]; then
  echo "📦 安装后端依赖..."
  npm install
fi

if [ ! -f "data/gift-quote.db" ]; then
  echo "🗄️ 创建数据库表结构..."
  node src/scripts/initDB.js
  echo "📊 导入示例数据..."
  node src/scripts/seedData.js
fi

echo ""
echo "🚀 启动后端服务 (端口 3001)..."
gnome-terminal -- bash -c "cd backend && npm start" 2>/dev/null || \
xterm -e "cd backend && npm start" 2>/dev/null || \
osascript -e "tell app \"Terminal\" to do script \"cd $(pwd)/backend && npm start\"" 2>/dev/null &

sleep 2

echo ""
echo "🌐 启动前端服务 (端口 3000)..."
cd ../frontend
if [ ! -d "node_modules" ]; then
  echo "📦 安装前端依赖..."
  npm install
fi

gnome-terminal -- bash -c "cd frontend && npm run dev" 2>/dev/null || \
xterm -e "cd frontend && npm run dev" 2>/dev/null || \
osascript -e "tell app \"Terminal\" to do script \"cd $(pwd)/frontend && npm run dev\"" 2>/dev/null &

sleep 3

echo ""
echo "✅ 系统启动完成！"
echo "📱 前端访问: http://localhost:3000"
echo "🔧 后端API:  http://localhost:3001"
echo ""
echo "📋 示例账号说明："
echo "   - 张三 (商务部) - 项目商务，创建报价"
echo "   - 李四 (打样部) - 打样执行"
echo "   - 王五 (仓配部) - 仓配复核"
echo "   - 赵六 (审批部) - 价格审批"
echo "   - 钱七 (客服部) - 售后退款"
