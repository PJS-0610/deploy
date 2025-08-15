#!/bin/bash

echo "=== 의존성 설치 시작 ==="

# Node.js와 npm 설치 (Amazon Linux 2023용)
if ! command -v node &> /dev/null; then
    echo "Node.js 설치 중..."
    dnf install -y nodejs npm
fi

# PM2 전역 설치
if ! command -v pm2 &> /dev/null; then
    echo "PM2 설치 중..."
    npm install -g pm2
fi

# 애플리케이션 디렉토리로 이동
cd /home/ec2-user/app

# package.json이 있으면 의존성 설치
if [ -f "package.json" ]; then
    echo "npm 의존성 설치 중..."
    npm install --production
else
    echo "package.json이 없습니다."
fi

# 권한 설정
chown -R ec2-user:ec2-user /home/ec2-user/app

echo "=== 의존성 설치 완료 ==="