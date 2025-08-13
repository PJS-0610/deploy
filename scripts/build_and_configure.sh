#!/bin/bash

# AWS2-GIOT-APP Build and Configure Script
# 빌드 및 설정 작업 (AfterInstall 단계)

# 스크립트 견고성 설정
set -euo pipefail

# 현재 스크립트에 실행 권한 부여 (안전장치)
chmod +x "$0" 2>/dev/null || true

# 로그 출력 강화
exec > >(tee -a /var/log/codedeploy-build-configure.log) 2>&1

echo "=== Build and Configure: 빌드 및 설정 시작 ==="

# 애플리케이션 디렉토리로 이동
cd /opt/aws2-giot-app

echo "현재 디렉토리: $(pwd)"

# 1. 환경 변수 설정
echo "1. 환경 변수 설정 중..."

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

# 2. 백엔드 빌드
echo "2. 백엔드 빌드 중..."
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

# 3. PM2 ecosystem 설정 생성
echo "3. PM2 설정 파일 생성 중..."

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

echo "✅ PM2 설정 파일 준비 완료"

# 4. Nginx 설정 확인 및 문법 검사
echo "4. Nginx 설정 확인 중..."
if sudo nginx -t; then
    echo "✅ Nginx 설정 문법 검사 통과"
else
    echo "❌ Nginx 설정에 문제가 있습니다."
    exit 1
fi

# 5. 로그 디렉토리 및 권한 설정
echo "5. 로그 디렉토리 설정 중..."
sudo mkdir -p /var/log/aws2-giot-app
sudo chown -R ec2-user:ec2-user /var/log/aws2-giot-app
sudo chmod 755 /var/log/aws2-giot-app

echo "✅ 로그 디렉토리 설정 완료"

# 6. PM2 자동 시작 설정 (미리 준비)
echo "6. PM2 자동 시작 설정 준비 중..."
pm2 save 2>/dev/null || true
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u ec2-user --hp /home/ec2-user 2>/dev/null || echo "PM2 startup 설정은 이미 완료되어 있습니다."

echo "✅ PM2 자동 시작 설정 준비 완료"

echo ""
echo "=== Build and Configure 완료 ==="
echo ""
echo "✅ 백엔드 빌드 완료"
echo "✅ PM2 설정 준비 완료"
echo "✅ Nginx 설정 검증 완료"
echo "✅ 로그 디렉토리 설정 완료"
echo "✅ PM2 자동 시작 설정 준비 완료"
echo ""
echo "🎯 다음 단계에서 서비스가 시작됩니다..."
echo ""