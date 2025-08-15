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

# nginx 재시작 (프록시 설정 적용)
echo "nginx 재시작 중..."
systemctl restart nginx
if [ $? -eq 0 ]; then
    echo "nginx가 성공적으로 재시작되었습니다."
else
    echo "nginx 재시작에 실패했습니다."
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