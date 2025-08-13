#!/bin/bash

# AWS2-GIOT-APP Start Server Script
# 애플리케이션 서버 시작

# 스크립트 견고성 설정
set -euo pipefail

# 현재 스크립트에 실행 권한 부여 (안전장치)
chmod +x "$0" 2>/dev/null || true

# 로그 출력 강화
exec > >(tee -a /var/log/codedeploy-start-server.log) 2>&1

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
echo "3. 백엔드 빌드 확인 및 재빌드 중..."
cd aws2-api

# 기존 빌드 정리
echo "기존 빌드 정리 중..."
rm -rf dist node_modules/.cache 2>/dev/null || true

# 의존성 재설치
echo "의존성 재설치 중..."
npm ci --production=false

# NestJS 완전 재빌드
echo "NestJS 완전 재빌드 중..."
if npx nest build --webpack=false; then
    echo "✅ NestJS 빌드 성공"
elif npm run build 2>/dev/null; then
    echo "✅ npm run build 성공"
elif npx tsc --project tsconfig.json; then
    echo "✅ TypeScript 직접 컴파일 성공"
else
    echo "❌ 모든 빌드 실패, Node.js 직접 실행 모드로 전환..."
    
    # ts-node로 직접 실행하도록 ecosystem.config.js 수정
    cat > ../ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'aws2-giot-backend',
      script: 'npx',
      args: 'ts-node src/main.ts',
      cwd: '/opt/aws2-giot-app/aws2-api',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '2G',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
        TS_NODE_TRANSPILE_ONLY: 'true'
      },
      log_file: '/var/log/aws2-giot-app/backend.log',
      out_file: '/var/log/aws2-giot-app/backend-out.log',
      error_file: '/var/log/aws2-giot-app/backend-error.log'
    }
  ]
};
EOF
    
    # ts-node 설치
    npm install ts-node --save-dev
    echo "✅ ts-node 직접 실행 모드 설정 완료"
fi

# 빌드 결과 확인
if [ -f "dist/main.js" ]; then
    echo "✅ 빌드 파일 확인: dist/main.js 존재"
    echo "빌드 파일 크기: $(ls -lh dist/main.js | awk '{print $5}')"
else
    echo "⚠️ 빌드 파일이 없습니다. ts-node 모드로 실행됩니다."
fi

cd ..

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

# 8. 서비스 시작 대기 (단축)
echo "8. 서비스 시작 대기 중..."
sleep 5

# 9. 서비스 상태 확인 (빠른 실패 처리)
echo "9. 서비스 상태 확인 중..."

# PM2 프로세스 확인 (더 빠른 실패 처리)
BACKEND_RETRY_COUNT=0
MAX_BACKEND_RETRIES=6
BACKEND_STARTED=false

while [ $BACKEND_RETRY_COUNT -lt $MAX_BACKEND_RETRIES ]; do
    if pm2 list | grep -q "online.*aws2-giot-backend"; then
        echo "✅ 백엔드 PM2 프로세스가 정상 실행 중입니다."
        BACKEND_STARTED=true
        break
    else
        echo "⏳ 백엔드 프로세스 시작 대기 중... (시도 $((BACKEND_RETRY_COUNT + 1))/$MAX_BACKEND_RETRIES)"
        BACKEND_RETRY_COUNT=$((BACKEND_RETRY_COUNT + 1))
        sleep 5
    fi
done

if [ "$BACKEND_STARTED" = "false" ]; then
    echo "❌ 백엔드 프로세스 시작 실패 - 30초 타임아웃"
    echo "PM2 로그 확인:"
    pm2 logs aws2-giot-backend --lines 20 || true
    echo "PM2 프로세스 상태:"
    pm2 list || true
    
    echo "⚠️ 백엔드 시작 실패로 인해 스크립트를 조기 종료합니다."
    echo "🔧 문제 해결을 위해 다음을 확인하세요:"
    echo "  1. NestJS 의존성: npm install 상태"
    echo "  2. TypeScript 컴파일: npx tsc --noEmit"
    echo "  3. 환경 변수: .env 파일 설정"
    echo "  4. 포트 충돌: lsof -i :3001"
    exit 1
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
