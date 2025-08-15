#!/bin/bash

# AWS2-GIOT-APP Install Dependencies Script
# 애플리케이션 의존성 설치 및 빌드

# 스크립트 견고성 설정 (에러에 관대하게)
set -uo pipefail

# 에러 핸들러 함수
handle_error() {
    local exit_code=$?
    local line_number=$1
    echo "❌ Error at line $line_number (exit code: $exit_code)"
    echo "📋 Current directory: $(pwd)"
    echo "📋 Available disk space: $(df -h /opt)"
    # 에러가 발생해도 계속 진행
    return 0
}

# 에러 발생 시 handle_error 함수 호출
trap 'handle_error $LINENO' ERR

# 현재 스크립트에 실행 권한 부여 (안전장치)
chmod +x "$0" 2>/dev/null || true

# 로그 디렉토리 생성 및 권한 설정
sudo mkdir -p /var/log 2>/dev/null || true
sudo touch /var/log/codedeploy-install-dependencies.log 2>/dev/null || true
sudo chmod 666 /var/log/codedeploy-install-dependencies.log 2>/dev/null || true

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

# 4-1. 기존 Nginx 설정 분석
echo "기존 Nginx 설정 분석 중..."
NGINX_BACKUP_DIR="/opt/aws2-giot-app/nginx-backup"
sudo mkdir -p "$NGINX_BACKUP_DIR"

# 기존 설정 백업
if [ -f "/etc/nginx/nginx.conf" ]; then
    sudo cp /etc/nginx/nginx.conf "$NGINX_BACKUP_DIR/nginx.conf.backup.$(date +%Y%m%d-%H%M%S)"
    echo "✅ 기존 nginx.conf 백업 완료"
fi

# 기존 conf.d 디렉토리 백업
if [ -d "/etc/nginx/conf.d" ] && [ "$(ls -A /etc/nginx/conf.d)" ]; then
    sudo cp -r /etc/nginx/conf.d "$NGINX_BACKUP_DIR/conf.d.backup.$(date +%Y%m%d-%H%M%S)"
    echo "✅ 기존 conf.d 설정 백업 완료"
fi

# 4-2. 안전한 Nginx 설정 방법 - 기존 설정을 건드리지 않고 conf.d만 사용
echo "안전한 Nginx 설정 방법 사용 - 기존 nginx.conf 유지"

# 기존 nginx.conf를 수정하지 않고, conf.d에 default_server 설정만 추가
echo "기존 nginx.conf를 수정하지 않고 conf.d 사용"
echo "Nginx 설정 전략: 기존 설정 유지 + conf.d 추가"

# 기본 nginx.conf가 제대로 있는지만 확인
if [ ! -f "/etc/nginx/nginx.conf" ]; then
    echo "⚠️ nginx.conf가 없습니다. 기본 설정 생성 중..."
    sudo tee /etc/nginx/nginx.conf > /dev/null << 'EOF'
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log notice;
pid /run/nginx.pid;

include /usr/share/nginx/modules/*.conf;

events {
    worker_connections 1024;
}

http {
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;

    sendfile on;
    tcp_nopush on;
    keepalive_timeout 65;
    types_hash_max_size 4096;

    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    include /etc/nginx/conf.d/*.conf;
}
EOF
    echo "✅ 기본 nginx.conf 생성 완료"
else
    echo "✅ 기존 nginx.conf 살아있음, 수정하지 않음"
fi

# 4-3. EC2 메타데이터에서 IP 정보 수집 (대안 방법 포함)
echo "EC2 환경 정보 수집 중..."

# 메타데이터 서비스 접근 시도
PRIVATE_IP=""
PUBLIC_IP=""
INSTANCE_ID=""

echo "메타데이터 서비스 접근 시도 중..."
if curl -s --max-time 3 http://169.254.169.254/latest/meta-data/ > /dev/null 2>&1; then
    echo "✅ 메타데이터 서비스 접근 가능"
    PRIVATE_IP=$(curl -s --max-time 5 http://169.254.169.254/latest/meta-data/local-ipv4 2>/dev/null || echo "")
    PUBLIC_IP=$(curl -s --max-time 5 http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null || echo "")
    INSTANCE_ID=$(curl -s --max-time 5 http://169.254.169.254/latest/meta-data/instance-id 2>/dev/null || echo "")
else
    echo "⚠️ 메타데이터 서비스 접근 실패, 대안 방법 사용"
fi

# 대안 방법으로 IP 정보 수집
if [ -z "$PRIVATE_IP" ] || [ "$PRIVATE_IP" = "localhost" ]; then
    echo "대안 방법으로 Private IP 수집 중..."
    # hostname -I를 사용한 IP 정보 수집
    PRIVATE_IP=$(hostname -I | awk '{print $1}' 2>/dev/null || echo "")
    if [ -z "$PRIVATE_IP" ]; then
        # ip route를 사용한 IP 정보 수집
        PRIVATE_IP=$(ip route get 8.8.8.8 | grep -oP 'src \K\S+' 2>/dev/null || echo "")
    fi
    if [ -z "$PRIVATE_IP" ]; then
        # ifconfig을 사용한 IP 정보 수집 (마지막 수단)
        PRIVATE_IP=$(ifconfig | grep -A 1 'eth0' | tail -1 | cut -d ':' -f 2 | cut -d ' ' -f 1 2>/dev/null || echo "localhost")
    fi
fi

# 기본값 설정
PRIVATE_IP=${PRIVATE_IP:-"localhost"}
PUBLIC_IP=${PUBLIC_IP:-""}
INSTANCE_ID=${INSTANCE_ID:-"unknown"}

echo "✅ IP 정보 수집 완료:"
echo "  - Private IP: $PRIVATE_IP"
echo "  - Public IP: $PUBLIC_IP"
echo "  - Instance ID: $INSTANCE_ID"

# IP 정보가 올바른지 검증
if [[ "$PRIVATE_IP" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    echo "✅ Private IP 검증 성공: $PRIVATE_IP"
else
    echo "⚠️ Private IP 형식이 올바르지 않음: $PRIVATE_IP, localhost로 대체"
    PRIVATE_IP="localhost"
fi

# 4-4. 안전한 Nginx 설정 파일 생성 (기존 설정과 충돌 방지)
echo "안전한 Nginx 설정 파일 생성 중..."

# 기존 conf.d 설정 파일들 백업
if [ -d "/etc/nginx/conf.d" ] && [ "$(ls -A /etc/nginx/conf.d 2>/dev/null)" ]; then
    echo "기존 conf.d 설정 백업 중..."
    sudo mkdir -p "$NGINX_BACKUP_DIR/conf.d.$(date +%Y%m%d-%H%M%S)"
    sudo cp -r /etc/nginx/conf.d/* "$NGINX_BACKUP_DIR/conf.d.$(date +%Y%m%d-%H%M%S)/" 2>/dev/null || true
fi

# 기존 default 설정 비활성화 (안전한 방법)
if [ -f "/etc/nginx/conf.d/default.conf" ]; then
    echo "기존 default.conf 비활성화 중..."
    sudo mv /etc/nginx/conf.d/default.conf /etc/nginx/conf.d/default.conf.disabled
fi

# 안전한 방법으로 Nginx 설정 파일 생성 (변수 치환 문제 해결)
cat > /tmp/nginx_config_template << 'TEMPLATE'
# AWS2-GIOT-APP Nginx Configuration
# Generated at: __DATE__
# Private IP: __PRIVATE_IP__ | Public IP: __PUBLIC_IP__ | Instance: __INSTANCE_ID__

server {
    listen 80 default_server;
    listen [::]:80 default_server;
    
    # 다양한 호스트 이름 지원 (ALB, IP, localhost, 도메인)
    server_name _ localhost __PRIVATE_IP__ __PUBLIC_IP__ *.amazonaws.com;
    
    # 보안 헤더
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Nginx-Server "AWS2-GIOT-Application" always;
    
    # 헬스체크 엔드포인트 (최우선 처리)
    location = /health {
        proxy_pass http://localhost:3001/health;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # 헬스체크 최적화
        proxy_connect_timeout 5s;
        proxy_read_timeout 5s;
        proxy_send_timeout 5s;
        
        # 캐시 방지
        add_header Cache-Control "no-cache, no-store, must-revalidate" always;
        add_header Pragma "no-cache" always;
        add_header Expires "0" always;
        
        # 로그에 헬스체크 표시
        access_log /var/log/nginx/aws2-giot-app-health.log;
    }
    
    # healthz 엔드포인트 (기존 호환성)
    location = /healthz {
        proxy_pass http://localhost:3001/healthz;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        proxy_connect_timeout 5s;
        proxy_read_timeout 5s;
        proxy_send_timeout 5s;
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
        
        # 백엔드 응답 시간 모니터링
        add_header X-Response-Time $request_time always;
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
    
    # React 정적 파일 서빙
    location / {
        root /opt/aws2-giot-app/frontend_backup/build;
        index index.html index.htm;
        try_files $uri $uri/ /index.html;
        
        # 정적 파일 캐시 설정
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable" always;
            add_header X-Static-File "true" always;
        }
        
        # HTML 파일은 캐시하지 않음
        location ~* \.html$ {
            add_header Cache-Control "no-cache, no-store, must-revalidate" always;
            add_header Pragma "no-cache" always;
            add_header Expires "0" always;
        }
    }
    
    # 상세한 로그 설정
    access_log /var/log/nginx/aws2-giot-app-access.log combined;
    error_log /var/log/nginx/aws2-giot-app-error.log warn;
}
TEMPLATE

# 변수 치환 및 설정 파일 생성
sed -e "s/__DATE__/$(date)/" \
    -e "s/__PRIVATE_IP__/$PRIVATE_IP/" \
    -e "s/__PUBLIC_IP__/$PUBLIC_IP/" \
    -e "s/__INSTANCE_ID__/$INSTANCE_ID/" \
    /tmp/nginx_config_template | sudo tee /etc/nginx/conf.d/aws2-giot-app.conf > /dev/null

# 임시 파일 정리
rm -f /tmp/nginx_config_template

echo "✅ Nginx 설정 완료"

# 4-5. Nginx 설정 검증 및 테스트 (개선된 에러 처리)
echo "4-5. Nginx 설정 검증 중..."

# 설정 파일 문법 검사
echo "Nginx 설정 문법 검사 중..."
if sudo nginx -t 2>/dev/null; then
    echo "✅ Nginx 설정 문법 검사 통과"
else
    echo "❌ Nginx 설정 문법 오류 발생 - 자동 복구 시도"
    
    # 오류 상세 내용 표시
    echo "에러 내용:"
    sudo nginx -t
    
    echo "생성된 설정 파일 내용:"
    sudo cat /etc/nginx/conf.d/aws2-giot-app.conf
    
    # 기초적인 대체 설정 생성 (안전한 방법)
    echo "기초적인 대체 설정 생성 중..."
    cat > /tmp/nginx_fallback_config << 'FALLBACK_TEMPLATE'
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _ localhost *.amazonaws.com;
    
    location = /health {
        proxy_pass http://localhost:3001/health;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_connect_timeout 5s;
        proxy_read_timeout 5s;
    }
    
    location = /healthz {
        proxy_pass http://localhost:3001/healthz;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_connect_timeout 5s;
        proxy_read_timeout 5s;
    }
    
    location /api/ {
        proxy_pass http://localhost:3001/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    location / {
        root /opt/aws2-giot-app/frontend_backup/build;
        index index.html;
        try_files $uri $uri/ /index.html;
    }
}
FALLBACK_TEMPLATE
    
    sudo cp /tmp/nginx_fallback_config /etc/nginx/conf.d/aws2-giot-app.conf
    rm -f /tmp/nginx_fallback_config
    
    # 대체 설정으로 재검사
    if sudo nginx -t 2>/dev/null; then
        echo "✅ 대체 설정으로 문법 검사 통과"
    else
        echo "❌ 대체 설정도 실패, 수동 수정 필요"
        exit 1
    fi
fi

# Nginx 서비스 안전 재시작
echo "Nginx 서비스 안전 재시작 중..."

# 현재 Nginx 상태 확인
if sudo systemctl is-active --quiet nginx; then
    echo "Nginx 서비스 reload 시도 중..."
    if sudo nginx -s reload 2>/dev/null; then
        echo "✅ Nginx reload 성공"
    else
        echo "Nginx reload 실패, 전체 재시작 시도"
        sudo systemctl restart nginx
    fi
else
    echo "Nginx 서비스 시작 중..."
    sudo systemctl start nginx
fi

# 재시작 후 상태 확인
if sudo systemctl is-active --quiet nginx; then
    echo "✅ Nginx 서비스 정상 시작"
else
    echo "❌ Nginx 서비스 시작 실패"
    exit 1
fi

# 최종 상태 확인 및 디버그 정보
echo "최종 Nginx 상태 확인 중..."
if sudo systemctl is-active --quiet nginx; then
    echo "✅ Nginx 서비스 정상 시작"
    # 기본 연결 테스트
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/ 2>/dev/null || echo "000")
    echo "Nginx 기본 연결 테스트: HTTP $HTTP_CODE"
else
    echo "❌ Nginx 서비스 시작 실패"
    echo "Nginx 상태 정보:"
    sudo systemctl status nginx --no-pager --lines=10
    echo ""
    echo "Nginx 에러 로그 (마지막 10줄):"
    sudo tail -10 /var/log/nginx/error.log 2>/dev/null || echo "에러 로그 없음"
    exit 1
fi

# 4-6. 종합적인 배포 검증 테스트
echo "4-6. 종합적인 배포 검증 중..."

# 기본 연결 테스트
echo "기본 연결 테스트 중..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/ 2>/dev/null || echo "000")
if echo "$HTTP_CODE" | grep -q "200\|404\|403"; then
    echo "✅ Nginx 기본 연결 정상 (HTTP $HTTP_CODE)"
else
    echo "❌ Nginx 기본 연결 실패 (HTTP $HTTP_CODE)"
    exit 1
fi

# 설정 파일 검증
echo "생성된 설정 파일 검증 중..."
if [ -f "/etc/nginx/conf.d/aws2-giot-app.conf" ]; then
    echo "✅ Nginx 설정 파일 생성 완료"
    
    # 설정 파일 내용 검증
    if grep -q "location = /health" /etc/nginx/conf.d/aws2-giot-app.conf; then
        echo "✅ Health check 경로 설정 확인"
    else
        echo "❌ Health check 경로 설정 누락"
        exit 1
    fi
    
    if grep -q "proxy_pass.*3001" /etc/nginx/conf.d/aws2-giot-app.conf; then
        echo "✅ 백엔드 프록시 설정 확인"
    else
        echo "❌ 백엔드 프록시 설정 누락"
        exit 1
    fi
    
    if grep -q "$PRIVATE_IP" /etc/nginx/conf.d/aws2-giot-app.conf; then
        echo "✅ Private IP ($PRIVATE_IP) 설정 확인"
    else
        echo "⚠️ Private IP 설정 없음, localhost만 사용"
    fi
else
    echo "❌ Nginx 설정 파일이 생성되지 않음"
    exit 1
fi

# Nginx 프로세스 확인
echo "Nginx 프로세스 상태 확인 중..."
if pgrep nginx > /dev/null; then
    echo "✅ Nginx 프로세스 실행 중"
else
    echo "❌ Nginx 프로세스가 실행되지 않음"
    exit 1
fi

# 포트 리스닝 확인
echo "포트 리스닝 상태 확인 중..."
if ss -tlnp | grep -q ":80.*LISTEN"; then
    echo "✅ 포트 80 리스닝 확인"
else
    echo "❌ 포트 80이 리스닝되지 않음"
    exit 1
fi

# 최종 상태 로그
echo ""
echo "📋 배포 완료 상태 요약:"
echo "  - Nginx 설정 파일: /etc/nginx/conf.d/aws2-giot-app.conf"
echo "  - 백업 디렉토리: $NGINX_BACKUP_DIR"
echo "  - Private IP: $PRIVATE_IP"
echo "  - 지원되는 Health Check 경로: /health, /healthz"
echo "  - 예상 ALB Target Group 설정:"
echo "    * Protocol: HTTP"
echo "    * Port: 80"
echo "    * Health check path: /health"
echo ""

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
