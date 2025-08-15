#!/bin/bash

echo "=== 의존성 설치 시작 ==="

# 패키지 매니저 업데이트
echo "패키지 매니저 업데이트 중..."
dnf update -y

# Node.js와 npm 설치 (Amazon Linux 2023용)
echo "Node.js 및 npm 설치 중..."
dnf install -y nodejs npm
if ! command -v node &> /dev/null; then
    echo "Node.js 설치 실패. 다른 방법으로 시도..."
    curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -
    dnf install -y nodejs
fi

# nginx 설치 (Amazon Linux 2023용)
echo "nginx 설치 중..."
dnf install -y nginx
systemctl enable nginx
systemctl start nginx

# PM2 전역 설치
echo "PM2 설치 중..."
npm install -g pm2
# PM2 경로를 시스템 PATH에 추가
echo 'export PATH=$PATH:/usr/local/bin' >> /etc/profile
echo 'export PATH=$PATH:/usr/local/bin' >> /home/ec2-user/.bashrc
# 즉시 적용
export PATH=$PATH:/usr/local/bin

# 애플리케이션 디렉토리로 이동
cd /home/ec2-user/app

# package.json이 있으면 의존성 설치
if [ -f "package.json" ]; then
    echo "npm 의존성 설치 중..."
    npm install --production
else
    echo "package.json이 없습니다."
fi

# nginx 설정 구성
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
#        listen       [::]:80;\
#        server_name  _;\
#        root         /usr/share/nginx/html;\
#\
#        include /etc/nginx/default.d/*.conf;\
#\
#        error_page 404 /404.html;\
#        location = /404.html {\
#        }\
#\
#        error_page 500 502 503 504 /50x.html;\
#        location = /50x.html {\
#        }\
#    }' /etc/nginx/nginx.conf
fi

# nginx 설정 테스트
echo "nginx 설정 테스트 중..."
nginx -t
if [ $? -eq 0 ]; then
    echo "nginx 설정이 올바릅니다."
else
    echo "nginx 설정에 오류가 있습니다."
    exit 1
fi

# 권한 설정
chown -R ec2-user:ec2-user /home/ec2-user/app

echo "=== 의존성 설치 완료 ==="