#!/bin/bash

# 단순한 Install 스크립트 - 디버깅용 (개선된 버전)
set -u

# 로그 파일에 출력
exec > >(tee -a /var/log/codedeploy-simple.log) 2>&1

echo "=== Simple Install 시작 $(date) ==="

# 애플리케이션 디렉토리 확인 및 이동
if [ -d "/opt/aws2-giot-app" ]; then
    echo "✅ 애플리케이션 디렉토리 존재"
    cd /opt/aws2-giot-app
    echo "현재 디렉토리: $(pwd)"
    echo "디렉토리 내용:"
    ls -la
    
    # 파일 권한 확인
    echo "파일 권한 상태:"
    ls -ld /opt/aws2-giot-app
    ls -ld /opt/aws2-giot-app/scripts/ 2>/dev/null || echo "scripts 디렉토리 없음"
    
    # 디렉토리 구조 확인
    echo "디렉토리 구조:"
    find /opt/aws2-giot-app -type d -maxdepth 2 | head -10
    
    # 중요 파일 확인
    echo "중요 파일 확인:"
    [ -f "package.json" ] && echo "✅ package.json 존재" || echo "❌ package.json 없음"
    [ -d "aws2-api" ] && echo "✅ aws2-api 디렉토리 존재" || echo "❌ aws2-api 디렉토리 없음"
    [ -d "frontend_backup" ] && echo "✅ frontend_backup 디렉토리 존재" || echo "❌ frontend_backup 디렉토리 없음"
else
    echo "❌ 애플리케이션 디렉토리 없음"
    exit 1
fi

# Node.js 상태 확인
echo "Node.js 환경 확인..."
if command -v node &> /dev/null; then
    echo "✅ Node.js: $(node --version)"
    echo "✅ npm: $(npm --version)"
    
    # npm 글로벌 패키지 확인
    echo "npm 글로벌 패키지:"
    npm list -g --depth=0 2>/dev/null | head -5 || echo "글로벌 패키지 목록 확인 실패"
else
    echo "❌ Node.js 없음 - 설치 시도"
    
    # 패키지 관리자로 Node.js 설치 시도
    if command -v dnf &> /dev/null; then
        dnf install -y nodejs npm || echo "Node.js 설치 실패"
    elif command -v yum &> /dev/null; then
        yum install -y nodejs npm || echo "Node.js 설치 실패"
    fi
fi

# 시스템 리소스 확인
echo "시스템 리소스 상태:"
echo "디스크: $(df -h /opt | tail -1)"
echo "메모리: $(free -h | grep Mem)"

# CodeDeploy 배포 상태 확인
echo "CodeDeploy 상태:"
if [ -f "/opt/codedeploy-agent/deployment-root/deployment-instructions" ]; then
    echo "✅ CodeDeploy 배포 진행 중"
else
    echo "⚠️ CodeDeploy 배포 상태 불명"
fi

echo "=== Simple Install 완료 $(date) ==="