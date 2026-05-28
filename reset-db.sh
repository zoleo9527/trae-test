#!/bin/bash

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "🔄 重置数据库..."

cd "$ROOT_DIR/backend"

if [ -f "camp.db" ]; then
    echo "🗑️  删除旧数据库..."
    rm -f camp.db
fi

echo "✅ 数据库已重置，下次启动时将自动重新初始化种子数据"
