#!/bin/bash

# AWS2-GIOT-APP Before Install Script for Amazon Linux 2023
# 시스템 환경 준비 및 필요한 소프트웨어 설치

set -e

echo "=== Before Install: Amazon Linux 2023 환경 준비 시작 ==="

# 패키지 업데이트
echo "패키지 목록 업데이트 중..."
dnf update -y

# Node.js 20.x 설치 (Amazon Linux 2023 최적화)
if ! command -v node &> /dev/null; then
    echo "Node.js 20.x 설치 중..."
    # NodeSource 리포지토리 추가
    curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -
    dnf install -y nodejs
else
    CURRENT_VERSION=$(node --version | sed 's/v//' | cut -d. -f1)
    if [ "$CURRENT_VERSION" -lt 20 ]; then
        echo "Node.js 버전이 낮습니다. 업데이트 중... (현재: $(node --version))"
        dnf remove -y nodejs npm || true
        curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -
        dnf install -y nodejs
    fi
fi

echo "✅ Node.js 버전: $(node --version)"
echo "✅ npm 버전: $(npm --version)"

# Python 3.11+ 및 pip 설치
echo "Python 환경 확인 중..."
if ! command -v python3 &> /dev/null; then
    echo "Python3 설치 중..."
    dnf install -y python3 python3-pip
else
    echo "Python3 버전: $(python3 --version)"
fi

# pip3 설치 확인
if ! command -v pip3 &> /dev/null; then
    echo "pip3 설치 중..."
    dnf install -y python3-pip
fi

echo "✅ Python3 버전: $(python3 --version)"
echo "✅ pip3 버전: $(pip3 --version)"

# PM2 전역 설치
if ! command -v pm2 &> /dev/null; then
    echo "PM2 설치 중..."
    npm install -g pm2
else
    echo "PM2 버전: $(pm2 --version)"
fi

# 필요한 시스템 패키지 설치
echo "시스템 패키지 설치 중..."
dnf install -y git wget unzip htop nginx

# curl 설치 확인 (이미 있을 가능성이 높음)
if ! command -v curl &> /dev/null; then
    echo "curl 설치 중..."
    dnf install -y curl
fi

# 기존 애플리케이션 백업 및 정리
if [ -d "/opt/aws2-giot-app" ]; then
    echo "기존 애플리케이션 백업 중..."
    BACKUP_DIR="/opt/backup/aws2-giot-app-$(date +%Y%m%d-%H%M%S)"
    mkdir -p /opt/backup
    mv /opt/aws2-giot-app $BACKUP_DIR
    echo "기존 애플리케이션을 $BACKUP_DIR 로 백업했습니다."
fi

# 애플리케이션 디렉토리 생성
echo "애플리케이션 디렉토리 생성 중..."
mkdir -p /opt/aws2-giot-app
chown ec2-user:ec2-user /opt/aws2-giot-app

# 로그 디렉토리 생성
echo "로그 디렉토리 생성 중..."
mkdir -p /var/log/aws2-giot-app
chown ec2-user:ec2-user /var/log/aws2-giot-app

# Nginx 설정 디렉토리 준비
mkdir -p /etc/nginx/conf.d

# systemctl 서비스 활성화
systemctl enable nginx
systemctl enable amazon-ssm-agent

# 환경 변수 파일 생성을 위한 디렉토리
mkdir -p /opt/aws2-giot-app/.env

# AWS Systems Manager 파라미터 스토어에서 환경 변수 가져오기
echo "AWS Systems Manager 파라미터 스토어에서 환경 변수 가져오는 중..."

# AWS CLI 설치 (필요한 경우)
if ! command -v aws &> /dev/null; then
    echo "AWS CLI 설치 중..."
    curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
    unzip awscliv2.zip
    ./aws/install
    rm -f awscliv2.zip
    rm -rf aws
fi

# 파라미터 스토어에서 환경 변수 가져오기 함수
get_parameter() {
    local param_name=$1
    aws ssm get-parameter --name "$param_name" --with-decryption --query 'Parameter.Value' --output text 2>/dev/null || echo ""
}

# 백엔드 환경 변수 가져오기
echo "백엔드 환경 변수 가져오는 중..."
AWS_ACCESS_KEY_ID=$(get_parameter "/test_pjs/backend/AWS_ACCESS_KEY_ID")
AWS_ACCOUNT_ID=$(get_parameter "/test_pjs/backend/AWS_ACCOUNT_ID")
AWS_REGION=$(get_parameter "/test_pjs/backend/AWS_REGION")
AWS_SECRET_ACCESS_KEY=$(get_parameter "/test_pjs/backend/AWS_SECRET_ACCESS_KEY")
QUICKSIGHT_NAMESPACE=$(get_parameter "/test_pjs/backend/QUICKSIGHT_NAMESPACE")
S3_BUCKET_NAME=$(get_parameter "/test_pjs/backend/S3_BUCKET_NAME")

# 프론트엔드 환경 변수 가져오기
echo "프론트엔드 환경 변수 가져오는 중..."
FRONTEND_PORT=$(get_parameter "/test_pjs/frontend/PORT")
REACT_APP_API_BASE=$(get_parameter "/test_pjs/frontend/REACT_APP_API_BASE")

# 백엔드용 .env 파일 생성
cat > /opt/aws2-giot-app/.env/backend.env << EOF
# AWS Configuration from Parameter Store
AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID}
AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY}
AWS_ACCOUNT_ID=${AWS_ACCOUNT_ID}
AWS_REGION=${AWS_REGION}
S3_BUCKET_NAME=${S3_BUCKET_NAME}
QUICKSIGHT_NAMESPACE=${QUICKSIGHT_NAMESPACE}

# Application Configuration
NODE_ENV=production
PORT=3001

# Generated timestamp
DEPLOYMENT_TIME=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
EOF

# 프론트엔드용 .env 파일 생성
cat > /opt/aws2-giot-app/.env/frontend.env << EOF
# Frontend Configuration from Parameter Store
PORT=${FRONTEND_PORT}
REACT_APP_API_BASE=${REACT_APP_API_BASE}

# AWS Configuration
REACT_APP_AWS_REGION=${AWS_REGION}

# Build Configuration
GENERATE_SOURCEMAP=false
DISABLE_ESLINT_PLUGIN=true

# Generated timestamp
REACT_APP_BUILD_TIME=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
EOF

# 환경 변수 파일 권한 설정
chown -R ec2-user:ec2-user /opt/aws2-giot-app/.env
chmod 600 /opt/aws2-giot-app/.env/*.env

echo "✅ 파라미터 스토어에서 환경 변수 가져오기 완료"

echo "=== Before Install 완료 ==="
echo "✅ Node.js: $(node --version)"
echo "✅ Python: $(python3 --version)"
echo "✅ PM2: $(pm2 --version)"
echo "✅ Nginx: $(nginx -v 2>&1)"
echo "✅ 파라미터 스토어 환경 변수: 설정 완료"