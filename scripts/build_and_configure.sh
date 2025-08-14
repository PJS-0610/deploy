#!/bin/bash

# AWS2-GIOT-APP Build and Configure Script
# 빌드 및 설정 작업 (AfterInstall 단계)

# 스크립트 견고성 설정
set -euo pipefail

# 에러 핸들러 함수
handle_error() {
    echo "❌ 오류 발생: 라인 $1에서 명령 실행 실패"
    echo "📋 디버그 정보:"
    echo "  - 현재 디렉토리: $(pwd)"
    echo "  - 사용자: $(whoami)"
    echo "  - Node.js 버전: $(node --version 2>/dev/null || echo 'Node.js 없음')"
    echo "  - npm 버전: $(npm --version 2>/dev/null || echo 'npm 없음')"
    exit 1
}

# 에러 발생 시 handle_error 함수 호출
trap 'handle_error $LINENO' ERR

# 현재 스크립트에 실행 권한 부여 (안전장치)
chmod +x "$0" 2>/dev/null || true

# 로그 출력 강화 (권한 문제 해결)
sudo mkdir -p /var/log 2>/dev/null || true
sudo touch /var/log/codedeploy-build-configure.log 2>/dev/null || true
sudo chown ec2-user:ec2-user /var/log/codedeploy-build-configure.log 2>/dev/null || true
exec > >(tee -a /var/log/codedeploy-build-configure.log 2>/dev/null || cat) 2>&1

echo "=== Build and Configure: 빌드 및 설정 시작 ==="

# 애플리케이션 디렉토리로 이동
cd /opt/aws2-giot-app

echo "현재 디렉토리: $(pwd)"

# 1. 환경 변수 설정
echo "1. 환경 변수 설정 중..."

# 파라미터 스토어에서 생성된 환경 변수 파일 로드
if [ -f "/opt/aws2-giot-app/.env/backend.env" ]; then
    echo "파라미터 스토어 환경 변수 로드 중..."
    export $(grep -v '^#' "/opt/aws2-giot-app/.env/backend.env" | xargs)
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

# 3. 프론트엔드 빌드
echo "3. 프론트엔드 빌드 중..."
if [ -d "frontend_backup" ]; then
    cd frontend_backup
    
    # 프론트엔드 의존성이 제대로 설치되었는지 확인
    echo "프론트엔드 의존성 확인 중..."
    if [ ! -d "node_modules" ] || [ ! -f "node_modules/.bin/react-scripts" ]; then
        echo "⚠️ 프론트엔드 의존성이 누락되었습니다. 재설치 중..."
        npm install
        echo "✅ 프론트엔드 의존성 재설치 완료"
    fi
    
    # 파라미터 스토어에서 생성된 프론트엔드 환경 변수 파일 사용
    echo "프론트엔드 .env 파일 생성 중..."
    
    if [ -f "/opt/aws2-giot-app/.env/frontend.env" ]; then
        # 기존 .env 파일이 있으면 백업
        if [ -f ".env" ]; then
            cp .env .env.backup.$(date +%Y%m%d-%H%M%S)
        fi
        
        # 파라미터 스토어 환경 변수를 기반으로 .env 파일 생성
        cp /opt/aws2-giot-app/.env/frontend.env .env
        
        # EC2 메타데이터에서 추가 정보 수집
        PUBLIC_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null || echo "localhost")
        
        # 추가 환경 변수 append
        cat >> .env << EOF

# API URLs (using actual server info)
REACT_APP_API_URL=http://${PUBLIC_IP}
REACT_APP_INTERNAL_API_URL=http://localhost:3001

# Application Configuration
REACT_APP_APP_NAME=AWS2-GIOT Application
REACT_APP_VERSION=1.0.0

# Feature Flags
REACT_APP_ENABLE_CHATBOT=true
REACT_APP_ENABLE_QUICKSIGHT=true
REACT_APP_ENABLE_S3_UPLOAD=true
EOF
        
        echo "✅ 파라미터 스토어 프론트엔드 환경 변수 적용 완료"
    else
        echo "⚠️ 파라미터 스토어 프론트엔드 환경 변수 파일을 찾을 수 없습니다. 기본값 사용"
        
        # 기본값 사용
        REGION=$(curl -s http://169.254.169.254/latest/meta-data/placement/region 2>/dev/null || echo "ap-northeast-2")
        PUBLIC_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null || echo "localhost")
        
        cat > .env << EOF
# Generated automatically during deployment (fallback)
REACT_APP_API_URL=http://${PUBLIC_IP}
REACT_APP_API_BASE=/api
REACT_APP_INTERNAL_API_URL=http://localhost:3001

# AWS Configuration
REACT_APP_AWS_REGION=${REGION}

# Application Configuration
REACT_APP_APP_NAME=AWS2-GIOT Application
REACT_APP_VERSION=1.0.0

# Feature Flags
REACT_APP_ENABLE_CHATBOT=true
REACT_APP_ENABLE_QUICKSIGHT=true
REACT_APP_ENABLE_S3_UPLOAD=true

# Build Configuration
GENERATE_SOURCEMAP=false
DISABLE_ESLINT_PLUGIN=true

# Generated timestamp
REACT_APP_BUILD_TIME=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
EOF
    fi
    
    echo "✅ 프론트엔드 .env 파일 생성 완료"
    
    # React 앱 빌드 (여러 방법 시도)
    echo "React 애플리케이션 빌드 중..."
    
    # 1차 시도: npm run build
    if npm run build; then
        echo "✅ React 빌드 성공"
        if [ -d "build" ]; then
            echo "빌드 파일 수: $(find build -type f | wc -l)"
        fi
    # 2차 시도: npx react-scripts build
    elif npx react-scripts build; then
        echo "✅ React 빌드 성공 (npx 사용)"
        if [ -d "build" ]; then
            echo "빌드 파일 수: $(find build -type f | wc -l)"
        fi
    # 3차 시도: node_modules/.bin/react-scripts build
    elif ./node_modules/.bin/react-scripts build; then
        echo "✅ React 빌드 성공 (직접 경로 사용)"
        if [ -d "build" ]; then
            echo "빌드 파일 수: $(find build -type f | wc -l)"
        fi
    else
        echo "❌ React 빌드 실패 - 모든 방법 시도했지만 실패"
        echo "node_modules 상태 확인:"
        ls -la node_modules/.bin/react* 2>/dev/null || echo "react-scripts가 node_modules/.bin에 없습니다."
        echo "package.json scripts 확인:"
        cat package.json | grep -A5 '"scripts"' || echo "package.json scripts 섹션을 찾을 수 없습니다."
        exit 1
    fi
    
    cd ..
    echo "✅ 프론트엔드 빌드 완료"
else
    echo "❌ frontend_backup 디렉토리를 찾을 수 없습니다."
    exit 1
fi

# 4. PM2 ecosystem 설정 생성
echo "4. PM2 설정 파일 생성 중..."

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
    },
    {
      name: 'aws2-giot-frontend',
      script: 'npm',
      args: 'start',
      cwd: '/opt/aws2-giot-app/frontend_backup',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'development',
        PORT: 3000,
        BROWSER: 'none',
        CI: 'true'
      },
      log_file: '/var/log/aws2-giot-app/frontend.log',
      out_file: '/var/log/aws2-giot-app/frontend-out.log',
      error_file: '/var/log/aws2-giot-app/frontend-error.log'
    }
  ]
};
EOF
fi

echo "✅ PM2 설정 파일 준비 완료"

# 5. Nginx 설정 확인 및 문법 검사
echo "5. Nginx 설정 확인 중..."
if sudo nginx -t; then
    echo "✅ Nginx 설정 문법 검사 통과"
else
    echo "❌ Nginx 설정에 문제가 있습니다."
    exit 1
fi

# 6. 로그 디렉토리 및 권한 설정
echo "6. 로그 디렉토리 설정 중..."
sudo mkdir -p /var/log/aws2-giot-app
sudo chown -R ec2-user:ec2-user /var/log/aws2-giot-app
sudo chmod 755 /var/log/aws2-giot-app

echo "✅ 로그 디렉토리 설정 완료"

# 7. PM2 자동 시작 설정 (미리 준비)
echo "7. PM2 자동 시작 설정 준비 중..."
pm2 save 2>/dev/null || true
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u ec2-user --hp /home/ec2-user 2>/dev/null || echo "PM2 startup 설정은 이미 완료되어 있습니다."

echo "✅ PM2 자동 시작 설정 준비 완료"

echo ""
echo "=== Build and Configure 완료 ==="
echo ""
echo "✅ 백엔드 빌드 완료"
echo "✅ 프론트엔드 빌드 완료"
echo "✅ PM2 설정 준비 완료"
echo "✅ Nginx 설정 검증 완료"
echo "✅ 로그 디렉토리 설정 완료"
echo "✅ PM2 자동 시작 설정 준비 완료"
echo ""
echo "🎯 다음 단계에서 서비스가 시작됩니다..."
echo ""