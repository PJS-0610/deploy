#!/bin/bash

echo "=== 애플리케이션 중지 중 ==="

# PM2 프로세스 중지
if command -v pm2 &> /dev/null; then
    echo "PM2로 애플리케이션 중지 중..."
    pm2 stop all || true
    pm2 delete all || true
fi

# Node.js 프로세스 강제 종료
echo "Node.js 프로세스 강제 종료 중..."
pkill -f "node" || true

echo "=== 애플리케이션 중지 완료 ==="