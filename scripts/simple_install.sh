#!/bin/bash

# 단순한 Install 스크립트 - 디버깅용
echo "=== Simple Install 시작 ==="

# 로그 파일에 출력
exec > >(tee -a /var/log/codedeploy-simple.log) 2>&1

echo "Install 시작 시간: $(date)"

# 기본 디렉토리 확인
if [ -d "/opt/aws2-giot-app" ]; then
    echo "✅ 애플리케이션 디렉토리 존재"
    cd /opt/aws2-giot-app
    echo "현재 디렉토리: $(pwd)"
    echo "디렉토리 내용:"
    ls -la
else
    echo "❌ 애플리케이션 디렉토리 없음"
fi

# Node.js 확인
if command -v node &> /dev/null; then
    echo "✅ Node.js: $(node --version)"
    echo "✅ npm: $(npm --version)"
else
    echo "❌ Node.js 없음"
fi

echo "=== Simple Install 완료 ==="
echo "Install 완료 시간: $(date)"