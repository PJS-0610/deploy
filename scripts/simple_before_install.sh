#!/bin/bash

# 단순한 Before Install 스크립트 - 디버깅용
echo "=== Simple Before Install 시작 ==="

# 로그 파일 생성
sudo mkdir -p /var/log 2>/dev/null || true
sudo touch /var/log/codedeploy-simple.log 2>/dev/null || true
sudo chmod 666 /var/log/codedeploy-simple.log 2>/dev/null || true

# 모든 출력을 로그로 기록
exec > >(tee -a /var/log/codedeploy-simple.log) 2>&1

echo "시작 시간: $(date)"
echo "사용자: $(whoami)"
echo "현재 디렉토리: $(pwd)"
echo "시스템 정보: $(uname -a)"

# 기본 패키지 관리자 확인
if command -v dnf &> /dev/null; then
    echo "✅ dnf 사용 가능"
    PKG_MGR="dnf"
elif command -v yum &> /dev/null; then
    echo "✅ yum 사용 가능"
    PKG_MGR="yum"
else
    echo "❌ 패키지 매니저를 찾을 수 없음"
    exit 1
fi

# Node.js 확인
if command -v node &> /dev/null; then
    echo "✅ Node.js 이미 설치됨: $(node --version)"
else
    echo "⚠️ Node.js 미설치, 기본 설치 시도..."
    $PKG_MGR install -y nodejs npm || echo "Node.js 설치 실패"
fi

# 애플리케이션 디렉토리 생성
echo "애플리케이션 디렉토리 생성..."
sudo mkdir -p /opt/aws2-giot-app
sudo chown ec2-user:ec2-user /opt/aws2-giot-app

# 로그 디렉토리 생성
sudo mkdir -p /var/log/aws2-giot-app
sudo chown ec2-user:ec2-user /var/log/aws2-giot-app

echo "=== Simple Before Install 완료 ==="
echo "완료 시간: $(date)"