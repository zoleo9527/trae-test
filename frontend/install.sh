#!/bin/bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
cd /Users/zhangliu/Documents/private/model-test/trae-test-3/frontend
npm install > /Users/zhangliu/Documents/private/model-test/trae-test-3/frontend/install_result.txt 2>&1
echo "EXIT_CODE=$?" >> /Users/zhangliu/Documents/private/model-test/trae-test-3/frontend/install_result.txt
