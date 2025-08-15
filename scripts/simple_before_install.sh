#!/bin/bash

# 단순한 Before Install 스크립트 - 디버깅용 (개선된 버전)
set -u

# 로그 파일 생성 (개선된 에러 처리)
mkdir -p /var/log 2>/dev/null || true
touch /var/log/codedeploy-simple.log 2>/dev/null || true
chmod 666 /var/log/codedeploy-simple.log 2>/dev/null || true

# 로그 출력 설정
exec > >(tee -a /var/log/codedeploy-simple.log) 2>&1

echo "=== Simple Before Install 시작 $(date) ==="
echo "사용자: $(whoami)"
echo "현재 디렉토리: $(pwd)"
echo "시스템: $(uname -r)"

# CodeDeploy 에이전트 상태 확인
echo "CodeDeploy 에이전트 상태 확인..."
if systemctl is-active --quiet codedeploy-agent; then
    echo "✅ CodeDeploy 에이전트 실행 중"
else
    echo "⚠️ CodeDeploy 에이전트 상태 이상"
    systemctl status codedeploy-agent --no-pager || true
fi

# 기본 시스템 확인
echo "기본 시스템 확인..."
echo "디스크 사용량: $(df -h / | tail -1)"
echo "메모리 사용량: $(free -h | head -2)"

# 패키지 관리자 확인
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

# 기존 애플리케이션 정리
echo "기존 애플리케이션 정리..."
if [ -d "/opt/aws2-giot-app" ]; then
    echo "기존 애플리케이션 디렉토리 백업..."
    mv /opt/aws2-giot-app /opt/aws2-giot-app.backup.$(date +%Y%m%d-%H%M%S) 2>/dev/null || true
fi

# 애플리케이션 디렉토리 생성
echo "애플리케이션 디렉토리 생성..."
mkdir -p /opt/aws2-giot-app
chown ec2-user:ec2-user /opt/aws2-giot-app
chmod 755 /opt/aws2-giot-app

# 로그 디렉토리 생성
echo "로그 디렉토리 생성..."
mkdir -p /var/log/aws2-giot-app
chown ec2-user:ec2-user /var/log/aws2-giot-app
chmod 755 /var/log/aws2-giot-app

# 필수 도구 설치
echo "필수 도구 설치 확인..."
$PKG_MGR install -y curl wget unzip || echo "일부 도구 설치 실패"

echo "=== Simple Before Install 완료 $(date) ==="