#!/bin/bash
exec 1>/Users/zhangliu/Documents/private/model-test/trae-test-3/frontend/vite-output.log 2>&1
cd /Users/zhangliu/Documents/private/model-test/trae-test-3/frontend
echo "=== Starting Vite ==="
echo "CWD: $(pwd)"
echo "Node: $(node --version)"
echo "NPM: $(npm --version)"
npx vite --host &
VPID=$!
echo "Vite PID: $VPID"
sleep 10
echo "=== Checking port 3000 ==="
lsof -i :3000 || echo "Nothing on port 3000"
echo "=== Curl test ==="
curl -sI http://localhost:3000/ || echo "Curl failed"
echo "=== Done ==="
kill $VPID 2>/dev/null
