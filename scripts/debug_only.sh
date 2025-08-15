#!/bin/bash

# 최소한의 디버그 스크립트
echo "=== DEBUG ONLY SCRIPT START $(date) ==="

# 로그 파일 설정
LOG_FILE="/var/log/codedeploy-debug.log"
exec > >(tee -a "$LOG_FILE") 2>&1

echo "스크립트 시작: $(date)"
echo "실행 사용자: $(whoami)"
echo "현재 디렉토리: $(pwd)"

# 기본 시스템 정보
echo "=== 시스템 정보 ==="
echo "OS: $(cat /etc/os-release | grep PRETTY_NAME)"
echo "Kernel: $(uname -r)"
echo "Memory: $(free -h | head -2)"
echo "Disk: $(df -h / | tail -1)"

# CodeDeploy 에이전트 확인
echo "=== CodeDeploy 에이전트 ==="
systemctl status codedeploy-agent --no-pager || echo "CodeDeploy 에이전트 상태 확인 실패"

# 네트워크 연결 확인
echo "=== 네트워크 연결 ==="
ping -c 1 8.8.8.8 >/dev/null && echo "✅ 인터넷 연결 OK" || echo "❌ 인터넷 연결 실패"

# AWS CLI 확인
echo "=== AWS CLI ==="
if command -v aws >/dev/null; then
    echo "✅ AWS CLI 설치됨: $(aws --version)"
    
    # AWS 자격증명 확인 (보안상 결과만 표시)
    aws sts get-caller-identity >/dev/null 2>&1 && echo "✅ AWS 자격증명 OK" || echo "❌ AWS 자격증명 실패"
else
    echo "❌ AWS CLI 없음"
fi

# SSM Parameter Store 접근 테스트
echo "=== SSM Parameter Store 접근 테스트 ==="
aws ssm get-parameter --name "/aws2-giot-app/test" --region ap-northeast-2 >/dev/null 2>&1 && echo "✅ SSM 접근 가능" || echo "❌ SSM 접근 실패 (권한 부족일 수 있음)"

# 파일시스템 권한 확인
echo "=== 파일시스템 권한 ==="
echo "/opt 권한: $(ls -ld /opt)"
mkdir -p /opt/test-write 2>/dev/null && echo "✅ /opt 쓰기 가능" || echo "❌ /opt 쓰기 불가"
rm -rf /opt/test-write 2>/dev/null

# 애플리케이션 디렉토리 확인
echo "=== 애플리케이션 디렉토리 ==="
if [ -d "/opt/aws2-giot-app" ]; then
    echo "✅ /opt/aws2-giot-app 존재"
    echo "디렉토리 권한: $(ls -ld /opt/aws2-giot-app)"
    echo "파일 개수: $(find /opt/aws2-giot-app -type f | wc -l)"
else
    echo "❌ /opt/aws2-giot-app 없음"
fi

# 최종 상태
echo "=== 최종 상태 ==="
echo "스크립트 종료: $(date)"
echo "종료 코드: 0 (성공)"

echo "=== DEBUG ONLY SCRIPT END $(date) ==="
exit 0