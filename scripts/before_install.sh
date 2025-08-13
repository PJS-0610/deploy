#!/bin/bash

# AWS2-GIOT-FULL Before Install Script
# 시스템 환경 준비 및 필요한 소프트웨어 설치

set -e

echo "=== Before Install: 시스템 환경 준비 시작 ==="

# 패키지 업데이트
echo "패키지 목록 업데이트 중..."
if command -v dnf &> /dev/null; then
    echo "Amazon Linux 2023 감지 - dnf 사용"
    dnf update -y
else
    echo "Amazon Linux 2 감지 - yum 사용" 
    yum update -y
fi

# Node.js 20.x 설치 (패키지 호환성을 위해)
if ! command -v node &> /dev/null; then
    echo "Node.js 설치 중..."
    # Amazon Linux 2023의 경우 NodeSource 리포지토리 사용 (최신 버전 위해)
    if command -v dnf &> /dev/null; then
        echo "Amazon Linux 2023에서 NodeSource 리포지토리 사용..."
        if command -v curl &> /dev/null; then
            curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -
            dnf install -y nodejs
        else
            echo "⚠️  curl을 찾을 수 없어 wget 사용 시도..."
            wget -qO- https://rpm.nodesource.com/setup_20.x | bash -
            dnf install -y nodejs
        fi
    else
        # Amazon Linux 2의 경우 nodesource 리포지토리 사용
        echo "Amazon Linux 2에서 NodeSource 리포지토리 사용..."
        if command -v curl &> /dev/null; then
            curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -
            yum install -y nodejs
        else
            echo "⚠️  curl을 찾을 수 없어 wget 사용 시도..."
            wget -qO- https://rpm.nodesource.com/setup_20.x | bash -
            yum install -y nodejs
        fi
    fi
else
    CURRENT_VERSION=$(node --version)
    echo "Node.js가 이미 설치되어 있습니다: $CURRENT_VERSION"
    
    # Node.js 버전이 20 미만이면 강제 업데이트
    MAJOR_VERSION=$(echo $CURRENT_VERSION | sed 's/v//' | cut -d. -f1)
    if [ "$MAJOR_VERSION" -lt 20 ]; then
        echo "⚠️  Node.js 버전이 v20 미만입니다 (현재: $CURRENT_VERSION). 강제 업데이트를 시도합니다..."
        
        # 기존 Node.js 제거
        if command -v dnf &> /dev/null; then
            echo "기존 Node.js 패키지 제거 중..."
            dnf remove -y nodejs npm || true
            
            echo "NodeSource 리포지토리 설정 중..."
            if command -v curl &> /dev/null; then
                curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -
            else
                wget -qO- https://rpm.nodesource.com/setup_20.x | bash -
            fi
            
            echo "Node.js 20.x 설치 중..."
            dnf install -y nodejs
        else
            echo "기존 Node.js 패키지 제거 중..."
            yum remove -y nodejs npm || true
            
            echo "NodeSource 리포지토리 설정 중..."
            if command -v curl &> /dev/null; then
                curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -
            else
                wget -qO- https://rpm.nodesource.com/setup_20.x | bash -
            fi
            
            echo "Node.js 20.x 설치 중..."
            yum install -y nodejs
        fi
        
        echo "업데이트 후 Node.js 버전: $(node --version)"
        echo "npm 버전: $(npm --version)"
    else
        echo "✅ Node.js 버전이 v20 이상입니다: $CURRENT_VERSION"
    fi
fi

# Python 3.11+ 확인 및 pip 설치
echo "Python 환경 확인 중..."
if ! command -v python3 &> /dev/null; then
    echo "Python3 설치 중..."
    if command -v dnf &> /dev/null; then
        dnf install -y python3 python3-pip
    else
        yum install -y python3 python3-pip
    fi
else
    echo "Python3가 이미 설치되어 있습니다: $(python3 --version)"
fi

# pip3 설치 확인 및 설치
if ! command -v pip3 &> /dev/null; then
    echo "pip3 설치 중..."
    if command -v dnf &> /dev/null; then
        dnf install -y python3-pip
    else
        yum install -y python3-pip
    fi
    
    # 여전히 pip3가 없다면 ensurepip 사용
    if ! command -v pip3 &> /dev/null; then
        echo "ensurepip를 사용하여 pip 설치 중..."
        python3 -m ensurepip --default-pip
    fi
fi

# pip 버전 확인 (업그레이드 생략 - Amazon Linux rpm 패키지 충돌 방지)
if command -v pip3 &> /dev/null; then
    echo "현재 pip3 버전: $(pip3 --version)"
    echo "ℹ️  Amazon Linux rpm 패키지 버전 사용 (업그레이드 생략)"
else
    echo "현재 pip 버전: $(python3 -m pip --version 2>/dev/null || echo 'pip를 찾을 수 없음')"
fi

# PM2 전역 설치 (프로덕션 프로세스 관리용)
if ! command -v pm2 &> /dev/null; then
    echo "PM2 설치 중..."
    npm install -g pm2
else
    echo "PM2가 이미 설치되어 있습니다: $(pm2 --version)"
fi

# 필요한 시스템 패키지 설치
echo "추가 시스템 패키지 설치 중..."
if command -v dnf &> /dev/null; then
    # curl이 이미 설치되어 있을 수 있으므로 개별적으로 설치 시도
    dnf install -y git wget unzip htop nginx
    
    # curl 별도 설치 (충돌 방지)
    if ! command -v curl &> /dev/null; then
        echo "curl 설치 시도 중..."
        dnf install -y --allowerasing curl || echo "⚠️  curl 설치 실패 (이미 curl-minimal이 있을 수 있음)"
    else
        echo "curl이 이미 설치되어 있습니다: $(curl --version | head -1)"
    fi
else
    yum install -y git wget unzip htop nginx
    
    # curl 별도 설치
    if ! command -v curl &> /dev/null; then
        echo "curl 설치 시도 중..."
        yum install -y curl || echo "⚠️  curl 설치 실패"
    else
        echo "curl이 이미 설치되어 있습니다: $(curl --version | head -1)"
    fi
fi

# 기존 애플리케이션 디렉토리 백업 및 정리
if [ -d "/opt/aws2-giot-full" ]; then
    echo "기존 애플리케이션 백업 중..."
    BACKUP_DIR="/opt/backup/aws2-giot-full-$(date +%Y%m%d-%H%M%S)"
    mkdir -p /opt/backup
    mv /opt/aws2-giot-full $BACKUP_DIR
    echo "기존 애플리케이션을 $BACKUP_DIR 로 백업했습니다."
fi

# 애플리케이션 디렉토리 생성
echo "애플리케이션 디렉토리 생성 중..."
mkdir -p /opt/aws2-giot-full
chown ec2-user:ec2-user /opt/aws2-giot-full

# 로그 디렉토리 생성
echo "로그 디렉토리 생성 중..."
mkdir -p /var/log/aws2-giot-full
chown ec2-user:ec2-user /var/log/aws2-giot-full

# Nginx 설정을 위한 디렉토리 준비
mkdir -p /etc/nginx/conf.d

echo "=== Before Install 완료 ==="