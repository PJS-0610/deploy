#!/bin/bash

echo "=== 애플리케이션 시작 중 ==="

# 애플리케이션 디렉토리로 이동
cd /home/ec2-user/app

# 완전한 시스템 준비 (Amazon Linux 2023)
echo "시스템 완전 설정 중..."

# 패키지 매니저 업데이트
dnf update -y

# 필수 시스템 도구 설치
dnf install -y curl wget git tar gzip unzip

# Node.js 및 npm 설치 (NodeSource 저장소 사용 - 더 안정적)
echo "Node.js 설치 중..."
curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -
dnf install -y nodejs

# Python (일부 npm 패키지 빌드용)
dnf install -y python3 python3-pip

# Build tools (네이티브 모듈 컴파일용)
dnf install -y gcc-c++ make

# nginx 설치 및 시작
echo "nginx 설치 중..."
dnf install -y nginx
systemctl enable nginx
systemctl start nginx

# nginx 설치 확인
if ! systemctl is-active --quiet nginx; then
    echo "nginx 서비스 시작 실패. 수동으로 시작 시도..."
    /usr/sbin/nginx
fi

if ! command -v nginx &> /dev/null; then
    echo "nginx 설치 실패"
    exit 1
fi

# PATH 환경변수 설정
export PATH=$PATH:/usr/local/bin:/usr/bin

# PM2 전역 설치
echo "PM2 설치 중..."
npm install -g pm2

# 로그 디렉토리 생성
mkdir -p /var/log/aws2-giot-app
chown -R ec2-user:ec2-user /var/log/aws2-giot-app

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
export HOME=/home/ec2-user
su - ec2-user -c "pm2 kill" 2>/dev/null || true

# 백엔드 의존성 설치 및 빌드
if [ -d "aws2-api" ] && [ -f "aws2-api/package.json" ]; then
    echo "백엔드 의존성 설치 및 빌드 중..."
    cd aws2-api
    chown -R ec2-user:ec2-user .
    
    # devDependencies 포함하여 설치 (빌드에 필요)
    echo "백엔드 전체 의존성 설치 중..."
    su - ec2-user -c "cd /home/ec2-user/app/aws2-api && npm install"
    
    # NestJS CLI 전역 설치
    npm install -g @nestjs/cli
    
    # 빌드 실행
    echo "백엔드 빌드 실행 중..."
    su - ec2-user -c "cd /home/ec2-user/app/aws2-api && npm run build"
    
    # 빌드 결과 확인
    if [ ! -f "dist/main.js" ]; then
        echo "빌드 실패: dist/main.js 파일이 생성되지 않았습니다."
        echo "빌드 디렉토리 내용:"
        ls -la dist/ || echo "dist 디렉토리가 존재하지 않습니다."
        exit 1
    fi
    
    cd ..
fi

# 프론트엔드 의존성 설치
if [ -d "frontend_backup" ] && [ -f "frontend_backup/package.json" ]; then
    echo "프론트엔드 의존성 설치 중..."
    cd frontend_backup
    chown -R ec2-user:ec2-user .
    su - ec2-user -c "cd /home/ec2-user/app/frontend_backup && npm install"
    cd ..
fi

# nginx 프록시 설정
echo "nginx 프록시 설정 중..."
cat > /etc/nginx/conf.d/app.conf << 'EOF'
server {
    listen 80;
    server_name _;

    location /health {
        proxy_pass http://127.0.0.1:3001/health;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:3001/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        proxy_pass http://127.0.0.1:3000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

# 기본 nginx server 블록 비활성화
if grep -q "server {" /etc/nginx/nginx.conf; then
    echo "기본 nginx server 블록 비활성화 중..."
    sed -i '/^    server {/,/^    }$/c\
#    server {\
#        listen       80;\
#        server_name  _;\
#        root         /usr/share/nginx/html;\
#        include /etc/nginx/default.d/*.conf;\
#        error_page 404 /404.html;\
#        location = /404.html {\
#        }\
#        error_page 500 502 503 504 /50x.html;\
#        location = /50x.html {\
#        }\
#    }' /etc/nginx/nginx.conf
fi

# ecosystem.config.js 확인 및 PM2 시작
echo "애플리케이션 시작 중..."
export HOME=/home/ec2-user

if [ -f "ecosystem.config.js" ]; then
    echo "ecosystem.config.js로 PM2 시작..."
    su - ec2-user -c "cd /home/ec2-user/app && pm2 start ecosystem.config.js" || {
        echo "ecosystem.config.js 시작 실패. package.json으로 시도..."
        su - ec2-user -c "cd /home/ec2-user/app && pm2 start npm --name 'app' -- start"
    }
else
    echo "ecosystem.config.js가 없습니다. package.json으로 시작..."
    su - ec2-user -c "cd /home/ec2-user/app && pm2 start npm --name 'app' -- start"
fi

# PM2 프로세스 저장
su - ec2-user -c "pm2 save"

# nginx 설정 테스트 및 재시작
echo "nginx 설정 테스트 및 재시작 중..."
nginx -t
if [ $? -ne 0 ]; then
    echo "nginx 설정에 오류가 있습니다."
    exit 1
fi

systemctl restart nginx
if systemctl is-active --quiet nginx; then
    echo "nginx가 성공적으로 재시작되었습니다."
else
    echo "nginx 재시작에 실패했습니다. 직접 시작 시도..."
    /usr/sbin/nginx
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