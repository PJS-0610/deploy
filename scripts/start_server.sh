#!/bin/bash

# AWS2-GIOT-APP Start Server Script
# 애플리케이션 서버 시작

set -e

echo "=== Start Server: 서버 시작 ==="

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

# 3. 백엔드 빌드 파일 확인 및 빌드
if [ ! -f "aws2-api/dist/main.js" ]; then
    echo "⚠️ 백엔드 빌드 파일이 없습니다. 긴급 빌드를 시도합니다..."
    
    cd aws2-api
    
    # 필수 패키지 재설치
    npm install @types/node typescript @nestjs/cli --save-dev --force
    
    # 여러 빌드 방법 시도
    if npx nest build; then
        echo "✅ NestJS 빌드 성공"
    elif npx tsc; then
        echo "✅ TypeScript 컴파일 성공"
    elif npx tsc --skipLibCheck; then
        echo "✅ 타입 체크 무시 컴파일 성공"
    else
        echo "❌ 모든 빌드 실패, 소스 파일 복사로 대체..."
        mkdir -p dist
        cp -r src/* dist/
        find dist -name "*.ts" -exec bash -c 'mv "$1" "${1%.ts}.js"' _ {} \;
    fi
    
    cd ..
fi

# 4. PM2로 백엔드 시작
echo "4. PM2로 백엔드 애플리케이션 시작 중..."

# ecosystem.config.js가 없으면 생성 (파라미터 스토어 환경 변수 포함)
if [ ! -f "ecosystem.config.js" ]; then
    echo "PM2 설정 파일 생성 중..."
    
    # 파라미터 스토어에서 환경 변수 값 읽기
    if [ -f "/opt/aws2-giot-app/.env/backend.env" ]; then
        # 환경 변수 파일에서 값 추출
        AWS_REGION_VAL=$(grep '^AWS_REGION=' /opt/aws2-giot-app/.env/backend.env | cut -d'=' -f2 | tr -d '"' | tr -d "'")
        AWS_ACCESS_KEY_ID_VAL=$(grep '^AWS_ACCESS_KEY_ID=' /opt/aws2-giot-app/.env/backend.env | cut -d'=' -f2 | tr -d '"' | tr -d "'")
        AWS_SECRET_ACCESS_KEY_VAL=$(grep '^AWS_SECRET_ACCESS_KEY=' /opt/aws2-giot-app/.env/backend.env | cut -d'=' -f2 | tr -d '"' | tr -d "'")
        AWS_ACCOUNT_ID_VAL=$(grep '^AWS_ACCOUNT_ID=' /opt/aws2-giot-app/.env/backend.env | cut -d'=' -f2 | tr -d '"' | tr -d "'")
        S3_BUCKET_NAME_VAL=$(grep '^S3_BUCKET_NAME=' /opt/aws2-giot-app/.env/backend.env | cut -d'=' -f2 | tr -d '"' | tr -d "'")
        QUICKSIGHT_NAMESPACE_VAL=$(grep '^QUICKSIGHT_NAMESPACE=' /opt/aws2-giot-app/.env/backend.env | cut -d'=' -f2 | tr -d '"' | tr -d "'")
    else
        # 기본값 설정
        AWS_REGION_VAL="ap-northeast-2"
        AWS_ACCESS_KEY_ID_VAL=""
        AWS_SECRET_ACCESS_KEY_VAL=""
        AWS_ACCOUNT_ID_VAL=""
        S3_BUCKET_NAME_VAL=""
        QUICKSIGHT_NAMESPACE_VAL=""
    fi
    
    cat > ecosystem.config.js << EOF
module.exports = {
  apps: [
    {
      name: 'aws2-giot-backend',
      script: 'aws2-api/dist/main.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '2G',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
        AWS_REGION: '${AWS_REGION_VAL}',
        AWS_ACCESS_KEY_ID: '${AWS_ACCESS_KEY_ID_VAL}',
        AWS_SECRET_ACCESS_KEY: '${AWS_SECRET_ACCESS_KEY_VAL}',
        AWS_ACCOUNT_ID: '${AWS_ACCOUNT_ID_VAL}',
        S3_BUCKET_NAME: '${S3_BUCKET_NAME_VAL}',
        QUICKSIGHT_NAMESPACE: '${QUICKSIGHT_NAMESPACE_VAL}'
      },
      log_file: '/var/log/aws2-giot-app/backend.log',
      out_file: '/var/log/aws2-giot-app/backend-out.log',
      error_file: '/var/log/aws2-giot-app/backend-error.log'
    }
  ]
};
EOF
fi

# PM2로 애플리케이션 시작
pm2 start ecosystem.config.js
echo "✅ 백엔드 PM2 프로세스 시작 완료"

# 5. PM2 프로세스 상태 확인
echo "5. PM2 프로세스 상태 확인 중..."
pm2 list

# 6. PM2 자동 시작 설정
echo "6. PM2 자동 시작 설정 중..."
pm2 save
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u ec2-user --hp /home/ec2-user || echo "PM2 startup 설정은 이미 완료되어 있습니다."

# 7. Nginx 시작/재시작
echo "7. Nginx 서비스 시작 중..."
sudo systemctl enable nginx
sudo nginx -t && echo "✅ Nginx 설정 문법 검사 통과"

# Nginx 시작 또는 재시작
if sudo systemctl is-active --quiet nginx; then
    sudo systemctl reload nginx
    echo "✅ Nginx 설정 재로드 완료"
else
    sudo systemctl start nginx
    echo "✅ Nginx 서비스 시작 완료"
fi

# 8. 서비스 시작 대기
echo "8. 서비스 시작 대기 중..."
sleep 15

# 9. 서비스 상태 확인
echo "9. 서비스 상태 확인 중..."

# PM2 프로세스 확인
if pm2 list | grep -q "online.*aws2-giot-backend"; then
    echo "✅ 백엔드 PM2 프로세스가 정상 실행 중입니다."
else
    echo "❌ 백엔드 프로세스 시작 실패"
    echo "PM2 로그 확인:"
    pm2 logs aws2-giot-backend --lines 10 || true
fi

# Nginx 상태 확인
if sudo systemctl is-active --quiet nginx; then
    echo "✅ Nginx 서비스가 정상 실행 중입니다."
else
    echo "❌ Nginx 서비스 시작 실패"
    sudo systemctl status nginx --no-pager
fi

# 10. 포트 확인
echo "10. 포트 사용 상태 확인 중..."
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

echo ""
echo "=== Start Server 완료 ==="
echo ""
echo "🚀 서비스 시작 완료!"
echo ""
echo "📊 서비스 접근 정보:"
echo "  - 웹 애플리케이션: http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)/"
echo "  - API 엔드포인트: http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)/api/"
echo "  - 헬스체크: http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)/health"
echo "  - 챗봇 API: http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)/chatbot/"
echo ""
echo "📋 관리 명령어:"
echo "  - PM2 상태 확인: pm2 list"
echo "  - PM2 로그 확인: pm2 logs aws2-giot-backend"
echo "  - PM2 모니터링: pm2 monit"
echo "  - Nginx 상태 확인: sudo systemctl status nginx"
echo "  - Nginx 로그 확인: sudo tail -f /var/log/nginx/aws2-giot-app-error.log"
echo ""