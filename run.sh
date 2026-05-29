#!/bin/bash

echo "========================================"
echo "  展会搭建进场证件与人员签到系统"
echo "========================================"
echo ""

case "$1" in
  up)
    echo "启动 PostgreSQL 数据库..."
    docker-compose up -d postgres
    echo "等待数据库就绪..."
    sleep 5
    echo "数据库已启动"
    ;;
    
  down)
    echo "停止 PostgreSQL 数据库..."
    docker-compose down
    echo "数据库已停止"
    ;;
    
  install)
    echo "安装依赖..."
    npm install
    echo "依赖安装完成"
    ;;
    
  dev)
    echo "启动开发服务器..."
    npm run start:dev
    ;;
    
  seed)
    echo "导入测试数据..."
    npm run seed
    echo "测试数据导入完成"
    ;;
    
  all)
    echo "一键启动完整环境..."
    docker-compose up -d postgres
    echo "等待数据库启动..."
    sleep 5
    echo "安装依赖..."
    npm install
    echo "导入测试数据..."
    npm run seed
    echo "启动服务..."
    npm run start:dev
    ;;
    
  *)
    echo "使用方法:"
    echo "  ./run.sh up      - 启动数据库"
    echo "  ./run.sh down    - 停止数据库"
    echo "  ./run.sh install - 安装依赖"
    echo "  ./run.sh dev     - 启动开发服务"
    echo "  ./run.sh seed    - 导入测试数据"
    echo "  ./run.sh all     - 一键启动完整环境"
    echo ""
    echo "访问地址:"
    echo "  API 文档: http://localhost:3000/api/docs"
    echo "  项目看板: http://localhost:3000/api/projects/{id}/dashboard"
    ;;
esac
