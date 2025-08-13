#!/bin/bash

# AWS2-GIOT-APP Start Server Script
# 애플리케이션 서버 시작 (가벼운 서비스 시작만 담당)

# 스크립트 견고성 설정
set -euo pipefail

# 현재 스크립트에 실행 권한 부여 (안전장치)
chmod +x "$0" 2>/dev/null || true

# 로그 출력 강화
exec > >(tee -a /var/log/codedeploy-start-server.log) 2>&1

echo "=== Start Server: 서비스 시작 ==="

# 애플리케이션 디렉토리로 이동
cd /opt/aws2-giot-app

echo "현재 디렉토리: $(pwd)"

# 1. 기존 PM2 프로세스 정리
echo "1. 기존 PM2 프로세스 확인 및 정리 중..."
if pm2 list | grep -q "aws2-giot-backend"; then
    echo "기존 백엔드 프로세스 중지 중..."
    pm2 stop aws2-giot-backend || true
    pm2 delete aws2-giot-backend || true
fi

# 2. 환경 변수 설정
echo "2. 환경 변수 설정 중..."

# 파라미터 스토어에서 생성된 환경 변수 파일 로드
if [ -f "/opt/aws2-giot-app/.env/backend.env" ]; then
    echo "파라미터 스토어 환경 변수 로드 중..."
    export $(grep -v '^#' /opt/aws2-giot-app/.env/backend.env | xargs)
    echo "✅ 파라미터 스토어 환경 변수 적용 완료"
else
    echo "⚠️ 파라미터 스토어 환경 변수 파일을 찾을 수 없습니다. 기본값 사용"
    export NODE_ENV=production
    export PORT=3001
    export AWS_REGION=ap-northeast-2
fi

# 3. PM2로 백엔드 시작
echo "3. PM2로 백엔드 애플리케이션 시작 중..."

# ecosystem.config.js 파일 확인
if [ ! -f "ecosystem.config.js" ]; then
    echo "❌ ecosystem.config.js 파일이 없습니다. 빌드 단계에서 생성되어야 합니다."
    exit 1
fi

# PM2로 애플리케이션 시작
echo "PM2로 백엔드 시작 중..."
pm2 start ecosystem.config.js
echo "✅ 백엔드 PM2 프로세스 시작 완료"

# 4. Nginx 시작/재시작
echo "4. Nginx 서비스 시작 중..."
sudo systemctl enable nginx

# Nginx 시작 또는 재시작
if sudo systemctl is-active --quiet nginx; then
    sudo systemctl reload nginx
    echo "✅ Nginx 설정 재로드 완료"
else
    sudo systemctl start nginx
    echo "✅ Nginx 서비스 시작 완료"
fi

# 5. 서비스 시작 대기
echo "5. 서비스 시작 대기 중..."
sleep 3

# 6. 서비스 상태 확인
echo "6. 서비스 상태 확인 중..."

# PM2 프로세스 확인
BACKEND_RETRY_COUNT=0
MAX_BACKEND_RETRIES=10
BACKEND_STARTED=false

while [ $BACKEND_RETRY_COUNT -lt $MAX_BACKEND_RETRIES ]; do
    if pm2 list | grep -q "online.*aws2-giot-backend"; then
        echo "✅ 백엔드 PM2 프로세스가 정상 실행 중입니다."
        BACKEND_STARTED=true
        break
    else
        echo "⏳ 백엔드 프로세스 시작 대기 중... (시도 $((BACKEND_RETRY_COUNT + 1))/$MAX_BACKEND_RETRIES)"
        BACKEND_RETRY_COUNT=$((BACKEND_RETRY_COUNT + 1))
        sleep 3
    fi
done

if [ "$BACKEND_STARTED" = "false" ]; then
    echo "❌ 백엔드 프로세스 시작 실패 - 30초 타임아웃"
    echo "PM2 로그 확인:"
    pm2 logs aws2-giot-backend --lines 20 || true
    echo "PM2 프로세스 상태:"
    pm2 list || true
    
    echo "⚠️ 백엔드 시작 실패로 인해 스크립트를 조기 종료합니다."
    echo "🔧 문제 해결을 위해 빌드 단계를 확인하세요."
    exit 1
fi

# Nginx 상태 확인
if sudo systemctl is-active --quiet nginx; then
    echo "✅ Nginx 서비스가 정상 실행 중입니다."
else
    echo "❌ Nginx 서비스 시작 실패"
    sudo systemctl status nginx --no-pager
fi

# 7. 포트 확인
echo "7. 포트 사용 상태 확인 중..."
if ss -tlnp | grep -q ":3001.*LISTEN"; then
    echo "✅ 백엔드 포트 3001이 정상적으로 열려 있습니다."
else
    echo "⚠️ 백엔드 포트 3001이 아직 열리지 않았습니다."
fi

if ss -tlnp | grep -q ":80.*LISTEN"; then
    echo "✅ Nginx 포트 80이 정상적으로 열려 있습니다."
else
    echo "⚠️ Nginx 포트 80이 아직 열리지 않았습니다."
fi

# 8. PM2 상태 표시
echo "8. PM2 프로세스 상태:"
pm2 list

echo ""
echo "=== Start Server 완료 ==="
echo ""
echo "🚀 서비스 시작 완료!"
echo ""
echo "📊 서비스 접근 정보:"
# Get public IP with timeout to prevent hanging
PUBLIC_IP=$(curl -s --max-time 5 http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null || echo "localhost")
echo "  - 웹 애플리케이션: http://${PUBLIC_IP}/"
echo "  - API 엔드포인트: http://${PUBLIC_IP}/api/"
echo "  - 헬스체크: http://${PUBLIC_IP}/health"
echo "  - 챗봇 API: http://${PUBLIC_IP}/chatbot/"
echo ""
echo "📋 관리 명령어:"
echo "  - PM2 상태 확인: pm2 list"
echo "  - PM2 로그 확인: pm2 logs aws2-giot-backend"
echo "  - PM2 모니터링: pm2 monit"
echo "  - Nginx 상태 확인: sudo systemctl status nginx"
echo "  - Nginx 로그 확인: sudo tail -f /var/log/nginx/aws2-giot-app-error.log"
echo ""
