#!/bin/bash

# AWS2-GIOT-FULL Start Server Script
# 애플리케이션 서버 시작

set -e

echo "=== Start Server: 서버 시작 ==="

# 애플리케이션 디렉토리로 이동
cd /opt/aws2-giot-full

echo "현재 디렉토리: $(pwd)"

# 1. 기존 PM2 프로세스 정리 (있다면)
echo "1. 기존 PM2 프로세스 확인 및 정리 중..."
if pm2 list | grep -q "aws2-api-backend"; then
    echo "기존 백엔드 프로세스 중지 중..."
    pm2 stop aws2-api-backend || true
    pm2 delete aws2-api-backend || true
fi

# 2. 환경 변수 설정
echo "2. 환경 변수 설정 중..."
export NODE_ENV=production
export PORT=3001

# AWS 자격증명은 EC2 IAM Role 사용
# export AWS_REGION=ap-northeast-2  # 필요시 명시적으로 설정

# 3. PM2로 백엔드 시작
echo "3. PM2로 백엔드 애플리케이션 시작 중..."

# ecosystem.config.js 파일이 없으면 생성
if [ ! -f "ecosystem.config.js" ]; then
    echo "ecosystem.config.js 파일을 생성 중..."
    cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'aws2-api-backend',
      script: 'aws2-api/dist/main.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      log_file: '/var/log/aws2-giot-full/backend.log',
      out_file: '/var/log/aws2-giot-full/backend-out.log',
      error_file: '/var/log/aws2-giot-full/backend-error.log'
    }
  ]
};
EOF
    echo "✅ ecosystem.config.js 파일 생성 완료"
fi

# 백엔드 빌드 파일 존재 확인 및 빌드
if [ ! -f "aws2-api/dist/main.js" ]; then
    echo "⚠️  백엔드 빌드 파일을 찾을 수 없습니다. 빌드를 시작합니다..."
    
    cd aws2-api
    echo "백엔드 디렉토리로 이동: $(pwd)"
    
    # Node.js 의존성 확인 및 설치
    if [ ! -d "node_modules" ] || [ ! "$(ls -A node_modules)" ]; then
        echo "Node.js 의존성 설치 중..."
        npm install
    fi
    
    # NestJS 빌드 시도 - npx 사용으로 전역 설치 불필요
    echo "NestJS 애플리케이션 빌드 중..."
    
    # Node.js 버전 확인
    NODE_VERSION=$(node --version)
    echo "현재 Node.js 버전: $NODE_VERSION"
    
    # 필수 TypeScript 타입 패키지 확인 및 강제 재설치
    echo "TypeScript 타입 패키지 강제 재설치 중..."
    npm install @types/node@latest --save-dev --force
    npm install typescript@latest --save-dev --force
    npm install @nestjs/cli@latest --save-dev --force
    
    # TypeScript 설정 파일 확인 및 수정
    echo "TypeScript 설정 파일 확인 중..."
    if [ -f "tsconfig.json" ]; then
        echo "기존 tsconfig.json 내용:"
        cat tsconfig.json | head -20
        
        # tsconfig.json에 Node.js 타입 강제 추가
        echo "tsconfig.json에 Node.js 타입 설정 추가 중..."
        
        # 백업 생성
        cp tsconfig.json tsconfig.json.backup
        
        # 새로운 tsconfig.json 생성 (Node.js 타입 포함)
        cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "module": "commonjs",
    "declaration": true,
    "removeComments": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "allowSyntheticDefaultImports": true,
    "target": "ES2020",
    "sourceMap": true,
    "outDir": "./dist",
    "baseUrl": "./",
    "incremental": true,
    "skipLibCheck": true,
    "strictNullChecks": false,
    "noImplicitAny": false,
    "strictBindCallApply": false,
    "forceConsistentCasingInFileNames": false,
    "noFallthroughCasesInSwitch": false,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "types": ["node"]
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
EOF
        echo "✅ tsconfig.json 업데이트 완료"
    else
        echo "❌ tsconfig.json을 찾을 수 없습니다."
        exit 1
    fi
    
    # 여러 빌드 방법 시도
    echo "빌드 방법을 시도 중..."
    
    # 1. npx 사용 시도
    echo "1. npx @nestjs/cli build 시도 중..."
    BUILD_CMD="npx @nestjs/cli build"
    
    if $BUILD_CMD; then
        echo "✅ npx 빌드 성공"
    else
        echo "❌ npx 빌드 실패. 다른 방법 시도 중..."
        
        # 2. 로컬 바이너리 직접 실행 시도
        echo "2. 로컬 바이너리 직접 실행 시도 중..."
        if [ -f "node_modules/.bin/nest" ]; then
            BUILD_CMD="./node_modules/.bin/nest build"
            echo "빌드 명령어: $BUILD_CMD"
            if $BUILD_CMD; then
                echo "✅ 로컬 바이너리 빌드 성공"
            else
                echo "❌ 로컬 바이너리 빌드도 실패"
                
                # 3. TypeScript 컴파일러 직접 사용
                echo "3. TypeScript 컴파일러 직접 사용 시도 중..."
                if npx tsc -p tsconfig.build.json; then
                    echo "✅ TypeScript 컴파일 성공"
                else
                    echo "❌ tsconfig.build.json 컴파일 실패. 기본 tsconfig.json으로 시도..."
                    
                    # 4. 기본 TypeScript 설정으로 컴파일 시도
                    if npx tsc; then
                        echo "✅ 기본 TypeScript 컴파일 성공"
                    else
                        echo "❌ TypeScript 컴파일도 실패. 타입 체크 무시하고 컴파일 시도..."
                        
                        # 5. 타입 체크 무시하고 강제 컴파일
                        if npx tsc --noEmit false --skipLibCheck; then
                            echo "✅ 강제 TypeScript 컴파일 성공"
                        else
                            echo "❌ 모든 빌드 방법 실패"
                            echo "Node.js 버전: $(node --version)"
                            echo "npm 버전: $(npm --version)"
                            echo "@types/node 설치 확인:"
                            ls -la node_modules/@types/ | grep node || echo "@types/node가 설치되지 않음"
                            
                            echo "TypeScript 설정 확인:"
                            cat tsconfig.json | head -10
                            
                            echo "마지막 에러 로그:"
                            npx tsc --noEmit false --skipLibCheck 2>&1 | tail -20
                            cd ..
                            exit 1
                        fi
                    fi
                fi
            fi
        else
            echo "❌ 로컬 nest 바이너리를 찾을 수 없습니다."
            cd ..
            exit 1
        fi
    fi
    
    # 빌드 결과 확인
    if [ -f "dist/main.js" ]; then
        echo "✅ 빌드 파일 확인 완료: dist/main.js"
        ls -la dist/main.js
    else
        echo "❌ 빌드 후에도 main.js 파일을 찾을 수 없습니다."
        echo "dist 디렉토리 내용:"
        ls -la dist/ || echo "dist 디렉토리가 존재하지 않습니다."
        cd ..
        exit 1
    fi
    
    cd ..
    echo "루트 디렉토리로 복귀: $(pwd)"
else
    echo "✅ 백엔드 빌드 파일이 존재합니다: aws2-api/dist/main.js"
fi

# PM2로 애플리케이션 시작
pm2 start ecosystem.config.js
echo "✅ 백엔드 PM2 프로세스 시작 완료"

# 4. PM2 프로세스 상태 확인
echo "4. PM2 프로세스 상태 확인 중..."
pm2 list

# 5. PM2 자동 시작 설정 (시스템 재부팅시)
echo "5. PM2 자동 시작 설정 중..."
pm2 save
sudo pm2 startup systemd -u ec2-user --hp /home/ec2-user || echo "PM2 startup 설정 실패 (이미 설정되어 있을 수 있음)"

# 6. Nginx 시작/재시작
echo "6. Nginx 서비스 시작 중..."
sudo systemctl enable nginx
sudo systemctl start nginx || sudo systemctl restart nginx

# Nginx 상태 확인
if sudo systemctl is-active --quiet nginx; then
    echo "✅ Nginx 서비스 실행 중"
else
    echo "❌ Nginx 서비스 시작 실패"
    sudo systemctl status nginx
    exit 1
fi

# 7. 로그 파일 권한 설정
echo "7. 로그 파일 권한 설정 중..."
sudo chown -R ec2-user:ec2-user /var/log/aws2-giot-full
chmod 755 /var/log/aws2-giot-full

# 8. 서비스 시작 대기
echo "8. 서비스 시작 대기 중..."
sleep 10

# 9. 백엔드 서비스 상태 확인
echo "9. 백엔드 서비스 상태 확인 중..."
if pm2 list | grep -q "online.*aws2-api-backend"; then
    echo "✅ 백엔드 서비스가 정상적으로 실행 중입니다."
else
    echo "❌ 백엔드 서비스 시작 실패"
    echo "PM2 로그 확인:"
    pm2 logs aws2-api-backend --lines 20 || true
    exit 1
fi

# 10. 포트 확인
echo "10. 포트 사용 상태 확인 중..."
if netstat -tlnp | grep -q ":3001.*LISTEN"; then
    echo "✅ 백엔드 포트 3001이 정상적으로 열려 있습니다."
else
    echo "⚠️  백엔드 포트 3001이 아직 열리지 않았습니다."
fi

if netstat -tlnp | grep -q ":80.*LISTEN"; then
    echo "✅ Nginx 포트 80이 정상적으로 열려 있습니다."
else
    echo "⚠️  Nginx 포트 80이 아직 열리지 않았습니다."
fi

echo "=== Start Server 완료 ==="
echo ""
echo "🚀 서비스 시작 완료!"
echo "📊 서비스 상태:"
echo "  - 백엔드 API: http://localhost:3001"
echo "  - 프론트엔드: http://localhost (Nginx를 통해 서빙)"
echo "  - 챗봇 API: http://localhost/chatbot/ask"
echo ""
echo "📋 관리 명령어:"
echo "  - PM2 상태 확인: pm2 list"
echo "  - PM2 로그 확인: pm2 logs"
echo "  - Nginx 상태 확인: sudo systemctl status nginx"
echo "  - Nginx 로그 확인: sudo tail -f /var/log/nginx/aws2-giot-full-error.log"