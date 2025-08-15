#!/bin/bash

echo "=== 애플리케이션 시작 중 ==="

# 애플리케이션 디렉토리로 이동
cd /home/ec2-user/app

# 완전한 의존성 재설치 (견고성을 위해)
echo "의존성 확인 및 설치 중..."

# Node.js 및 npm 강제 설치
dnf install -y nodejs npm

# PATH 환경변수 설정
export PATH=$PATH:/usr/local/bin:/usr/bin

# PM2 전역 설치
npm install -g pm2

# 설치 확인
if ! command -v node &> /dev/null; then
    echo "Node.js 설치 실패"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "npm 설치 실패"
    exit 1
fi

if ! command -v pm2 &> /dev/null; then
    echo "PM2 설치 실패"
    exit 1
fi

echo "모든 의존성이 준비되었습니다."
echo "Node.js 버전: $(node --version)"
echo "npm 버전: $(npm --version)"
echo "PM2 버전: $(pm2 --version)"

# 기존 PM2 프로세스 정리
echo "기존 PM2 프로세스 정리 중..."
sudo -u ec2-user bash -c "pm2 kill" 2>/dev/null || true

# ecosystem.config.js가 있으면 PM2로 시작
if [ -f "ecosystem.config.js" ]; then
    echo "PM2로 애플리케이션 시작 중..."
    sudo -u ec2-user bash -c "cd /home/ec2-user/app && PATH=$PATH:/usr/local/bin pm2 start ecosystem.config.js"
elif [ -f "package.json" ]; then
    echo "npm start로 애플리케이션 시작 중..."
    sudo -u ec2-user bash -c "cd /home/ec2-user/app && PATH=$PATH:/usr/local/bin pm2 start npm --name 'app' -- start"
else
    echo "시작 스크립트를 찾을 수 없습니다."
    exit 1
fi

# PM2 프로세스 저장
sudo -u ec2-user bash -c "PATH=$PATH:/usr/local/bin pm2 save"

# nginx 상태 확인 및 재시작
echo "nginx 상태 확인 및 재시작 중..."
if systemctl is-active --quiet nginx; then
    echo "nginx가 실행 중입니다. 재시작합니다..."
    systemctl restart nginx
else
    echo "nginx가 실행되지 않고 있습니다. 시작합니다..."
    systemctl start nginx
fi

if systemctl is-active --quiet nginx; then
    echo "nginx가 성공적으로 실행되었습니다."
else
    echo "nginx 시작에 실패했습니다."
    systemctl status nginx --no-pager
    exit 1
fi

# 서비스 상태 확인
echo "서비스 상태 확인 중..."
sleep 5

# PM2 상태 확인
echo "PM2 프로세스 상태:"
pm2 list

# nginx 상태 확인
echo "nginx 상태:"
systemctl status nginx --no-pager

# Health check 테스트
echo "Health check 테스트 중..."
if curl -f http://localhost/health > /dev/null 2>&1; then
    echo "✅ Health check 성공"
else
    echo "❌ Health check 실패"
    echo "로컬 애플리케이션 상태 확인:"
    curl -s http://localhost:3001/health || echo "백엔드 직접 접근 실패"
    curl -s http://localhost:3000 > /dev/null && echo "프론트엔드 직접 접근 성공" || echo "프론트엔드 직접 접근 실패"
fi

echo "=== 애플리케이션 시작 완료 ==="