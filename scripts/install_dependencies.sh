#!/bin/bash

# AWS2-GIOT-APP Install Dependencies Script
# 애플리케이션 의존성 설치 및 빌드

# 스크립트 견고성 설정
set -euo pipefail

# 현재 스크립트에 실행 권한 부여 (안전장치)
chmod +x "$0" 2>/dev/null || true

# 로그 출력 강화
exec > >(tee -a /var/log/codedeploy-install-dependencies.log) 2>&1

echo "=== Install Dependencies: 의존성 설치 시작 ==="

# 애플리케이션 디렉토리로 이동
cd /opt/aws2-giot-app

echo "현재 디렉토리: $(pwd)"
echo "파일 목록:"
ls -la

# 0. AWS CLI 설치 확인 및 설치
echo "0. AWS CLI 설치 확인 중..."
if ! command -v aws &> /dev/null; then
    echo "AWS CLI가 설치되지 않았습니다. 설치 중..."
    
    # Amazon Linux 2023에서는 yum 대신 dnf 사용
    if command -v dnf &> /dev/null; then
        sudo dnf update -y
        sudo dnf install -y awscli
    elif command -v yum &> /dev/null; then
        sudo yum update -y
        sudo yum install -y awscli
    else
        echo "패키지 매니저를 찾을 수 없습니다. AWS CLI를 수동 설치합니다..."
        curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
        unzip awscliv2.zip
        sudo ./aws/install
        rm -rf awscliv2.zip aws/
    fi
    
    echo "✅ AWS CLI 설치 완료"
else
    echo "✅ AWS CLI가 이미 설치되어 있습니다."
    aws --version
fi

# 1. 루트 의존성 설치 (concurrently 등)
if [ -f "package.json" ]; then
    echo "1. 루트 의존성 설치 중..."
    npm install
    echo "✅ 루트 의존성 설치 완료"
else
    echo "⚠️ 루트 package.json이 없습니다."
fi

# 2. 백엔드 의존성 설치 (빌드는 제외)
if [ -d "aws2-api" ]; then
    echo "2. 백엔드 의존성 설치 중..."
    cd aws2-api
    
    # npm 의존성 설치
    echo "npm 의존성 설치 중..."
    npm install
    
    # 필수 TypeScript 패키지 강제 설치
    echo "필수 빌드 패키지 설치 중..."
    npm install @types/node typescript @nestjs/cli --save-dev
    
    # Python 의존성 설치
    if [ -f "python-scripts/requirements.txt" ]; then
        echo "Python 의존성 설치 중..."
        pip3 install -r python-scripts/requirements.txt --user
        echo "✅ Python 의존성 설치 완료"
    fi
    
    cd ..
    echo "✅ 백엔드 의존성 설치 완료"
else
    echo "❌ aws2-api 디렉토리를 찾을 수 없습니다."
    exit 1
fi

# 3. 프론트엔드 의존성 설치 (빌드는 제외)
if [ -d "frontend_backup" ]; then
    echo "3. 프론트엔드 의존성 설치 중..."
    cd frontend_backup
    
    # 프론트엔드 의존성 설치
    npm install
    
    cd ..
    echo "✅ 프론트엔드 의존성 설치 완료"
else
    echo "❌ frontend_backup 디렉토리를 찾을 수 없습니다."
    exit 1
fi

# 4. Nginx 설정 파일 생성
echo "4. Nginx 설정 파일 생성 중..."
sudo tee /etc/nginx/conf.d/aws2-giot-app.conf > /dev/null << 'EOF'
# AWS2-GIOT-APP Nginx Configuration
server {
    listen 80;
    server_name _;
    
    # 보안 헤더
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    
    # React 정적 파일 서빙
    location / {
        root /opt/aws2-giot-app/frontend_backup/build;
        index index.html index.htm;
        try_files $uri $uri/ /index.html;
        
        # 정적 파일 캐시 설정
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # API 프록시 (백엔드)
    location /api/ {
        proxy_pass http://localhost:3001/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }
    
    # 헬스체크 엔드포인트
    location /health {
        proxy_pass http://localhost:3001/health;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # 챗봇 API 직접 접근
    location /chatbot/ {
        proxy_pass http://localhost:3001/chatbot/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }
    
    # 프론트엔드 개발 서버 프록시 (포트 3000)
    location /dev/ {
        proxy_pass http://localhost:3000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
        
        # 개발 서버용 추가 헤더
        proxy_set_header Accept-Encoding "";
        add_header X-Dev-Server "React Development Server" always;
    }
    
    # 로그 설정
    access_log /var/log/nginx/aws2-giot-app-access.log;
    error_log /var/log/nginx/aws2-giot-app-error.log;
}
EOF

echo "✅ Nginx 설정 완료"

# 5. 권한 설정
echo "5. 파일 권한 설정 중..."
chown -R ec2-user:ec2-user /opt/aws2-giot-app
chmod -R 755 /opt/aws2-giot-app

# 실행 파일 권한 설정
find /opt/aws2-giot-app -name "*.sh" -exec chmod +x {} \;

echo "=== Install Dependencies 완료 ==="
echo "✅ 백엔드 의존성 설치 완료"
echo "✅ 프론트엔드 의존성 설치 완료"
echo "✅ Nginx 설정 완료"
echo "✅ 권한 설정 완료"
