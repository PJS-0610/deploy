#!/bin/bash

echo "=== 애플리케이션 시작 중 ==="

# 애플리케이션 디렉토리로 이동
cd /home/ec2-user/app

# ecosystem.config.js가 있으면 PM2로 시작
if [ -f "ecosystem.config.js" ]; then
    echo "PM2로 애플리케이션 시작 중..."
    pm2 start ecosystem.config.js
elif [ -f "package.json" ]; then
    echo "npm start로 애플리케이션 시작 중..."
    pm2 start npm --name "app" -- start
else
    echo "시작 스크립트를 찾을 수 없습니다."
    exit 1
fi

# PM2 프로세스 저장
pm2 save

echo "=== 애플리케이션 시작 완료 ==="