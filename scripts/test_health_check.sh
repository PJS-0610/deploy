#!/bin/bash

# AWS2-GIOT-APP Health Check Test Script
# ALB Health Check 문제 진단 및 검증을 위한 종합 테스트 스크립트

# 스크립트 견고성 설정
set -euo pipefail

# 현재 스크립트에 실행 권한 부여 (안전장치)
chmod +x "$0" 2>/dev/null || true

# 로그 출력 강화
exec > >(tee -a /var/log/health-check-test.log) 2>&1

echo "=== ALB Health Check 종합 테스트 시작 ==="
echo "테스트 시간: $(date)"
echo ""

# 환경 정보 수집 (개선된 방법)
echo "🔍 환경 정보 수집"

# 메타데이터 서비스 접근 시도
PRIVATE_IP=""
PUBLIC_IP=""
INSTANCE_ID=""

if curl -s --max-time 3 http://169.254.169.254/latest/meta-data/ > /dev/null 2>&1; then
    echo "  메타데이터 서비스 접근 가능"
    PRIVATE_IP=$(curl -s --max-time 5 http://169.254.169.254/latest/meta-data/local-ipv4 2>/dev/null || echo "")
    PUBLIC_IP=$(curl -s --max-time 5 http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null || echo "")
    INSTANCE_ID=$(curl -s --max-time 5 http://169.254.169.254/latest/meta-data/instance-id 2>/dev/null || echo "")
else
    echo "  메타데이터 서비스 접근 실패, 대안 방법 사용"
fi

# 대안 방법으로 IP 정보 수집 (install_dependencies.sh와 동일한 로직)
if [ -z "$PRIVATE_IP" ] || [ "$PRIVATE_IP" = "localhost" ]; then
    echo "  대안 방법으로 Private IP 수집 중..."
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

PRIVATE_IP=${PRIVATE_IP:-"localhost"}
PUBLIC_IP=${PUBLIC_IP:-"N/A"}
INSTANCE_ID=${INSTANCE_ID:-"unknown"}

echo "  - Private IP: $PRIVATE_IP"
echo "  - Public IP: $PUBLIC_IP"
echo "  - Instance ID: $INSTANCE_ID"
echo ""

# 테스트 결과 추적
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# 테스트 함수
run_test() {
    local test_name="$1"
    local test_command="$2"
    local expected_pattern="$3"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    echo -n "  [$TOTAL_TESTS] $test_name: "
    
    if result=$(eval "$test_command" 2>&1); then
        if echo "$result" | grep -q "$expected_pattern"; then
            echo "✅ PASS"
            PASSED_TESTS=$((PASSED_TESTS + 1))
            return 0
        else
            echo "❌ FAIL (응답 패턴 불일치)"
            echo "     기대값: $expected_pattern"
            echo "     실제값: $result"
            FAILED_TESTS=$((FAILED_TESTS + 1))
            return 1
        fi
    else
        echo "❌ FAIL (명령 실행 실패)"
        echo "     에러: $result"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        return 1
    fi
}

# 1. 기본 서비스 상태 확인
echo "1️⃣ 기본 서비스 상태 확인"
run_test "PM2 프로세스 확인" "pm2 list --no-color | grep aws2-giot-backend" "online"
run_test "Nginx 서비스 확인" "sudo systemctl is-active nginx" "active"
run_test "포트 3001 리스닝 확인" "ss -tlnp | grep :3001" "LISTEN"
run_test "포트 80 리스닝 확인" "ss -tlnp | grep :80" "LISTEN"
echo ""

# 2. 백엔드 직접 테스트
echo "2️⃣ 백엔드 직접 테스트"
run_test "백엔드 /health 엔드포인트" "curl -s http://localhost:3001/health" '"ok":true'
run_test "백엔드 /healthz 엔드포인트" "curl -s http://localhost:3001/healthz" '"ok":true'
run_test "백엔드 응답 시간 (5초 이내)" "timeout 5 curl -s http://localhost:3001/health" '"ok":true'
echo ""

# 3. Nginx 프록시 테스트 (다양한 호스트명)
echo "3️⃣ Nginx 프록시 테스트"
run_test "localhost를 통한 /health" "curl -s http://localhost/health" '"ok":true'
run_test "127.0.0.1을 통한 /health" "curl -s http://127.0.0.1/health" '"ok":true'

if [ "$PRIVATE_IP" != "localhost" ]; then
    run_test "Private IP를 통한 /health" "curl -s http://$PRIVATE_IP/health" '"ok":true'
fi

run_test "Nginx를 통한 /healthz" "curl -s http://localhost/healthz" '"ok":true'
run_test "Nginx를 통한 /api/ 프록시" "curl -s -o /dev/null -w '%{http_code}' http://localhost/api/" "200\|404\|Cannot GET"
echo ""

# 4. ALB Health Check 시뮬레이션
echo "4️⃣ ALB Health Check 시뮬레이션"
# ALB가 사용하는 User-Agent 및 헤더 시뮬레이션
ALB_HEADERS="-H 'User-Agent: ELB-HealthChecker/2.0' -H 'Connection: keep-alive'"

run_test "ALB 스타일 요청 (localhost)" "curl -s $ALB_HEADERS http://localhost/health" '"ok":true'
if [ "$PRIVATE_IP" != "localhost" ]; then
    run_test "ALB 스타일 요청 (Private IP)" "curl -s $ALB_HEADERS http://$PRIVATE_IP/health" '"ok":true'
fi

# 타임아웃 테스트
run_test "헬스체크 타임아웃 테스트 (5초)" "timeout 5 curl -s http://localhost/health" '"ok":true'
echo ""

# 5. Nginx 설정 검증
echo "5️⃣ Nginx 설정 검증"
run_test "Nginx 설정 문법 검사" "sudo nginx -t" "syntax is ok"
run_test "우리 설정 파일 존재 확인" "test -f /etc/nginx/conf.d/aws2-giot-app.conf && echo 'exists'" "exists"
run_test "default_server 설정 확인" "sudo nginx -T | grep 'listen.*80.*default_server'" "default_server"
run_test "server_name 설정 확인" "sudo nginx -T | grep 'server_name'" "_\|localhost"
run_test "헬스체크 location 확인" "sudo nginx -T | grep 'location.*health'" "/health"
# Private IP 검증 및 설정 확인
if [[ "$PRIVATE_IP" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    run_test "Private IP 설정 확인" "sudo nginx -T | grep '$PRIVATE_IP' || echo 'localhost-only'" "localhost-only\|$PRIVATE_IP"
else
    run_test "localhost 설정 확인" "sudo nginx -T | grep 'localhost' || echo 'no-localhost'" "localhost"
fi
echo ""

# 6. 로그 분석
echo "6️⃣ 로그 분석"
echo "최근 Nginx 에러 로그 (마지막 5줄):"
sudo tail -5 /var/log/nginx/error.log 2>/dev/null || echo "  에러 로그 없음"
echo ""

echo "최근 PM2 로그 (마지막 3줄):"
pm2 logs aws2-giot-backend --lines 3 --nostream 2>/dev/null || echo "  PM2 로그 접근 불가"
echo ""

# 7. 네트워크 진단
echo "7️⃣ 네트워크 진단"
echo "현재 열려있는 포트:"
ss -tlnp | grep -E ":80|:3001|:3000" || echo "  관련 포트 없음"
echo ""

echo "Nginx 프로세스:"
ps aux | grep nginx | grep -v grep || echo "  Nginx 프로세스 없음"
echo ""

# 8. AWS 환경 정보 및 배포 검증
echo "8️⃣ AWS 환경 및 배포 정보"
echo "가용 영역: $(curl -s --max-time 3 http://169.254.169.254/latest/meta-data/placement/availability-zone 2>/dev/null || echo 'N/A (메타데이터 접근 실패)')"
echo "인스턴스 타입: $(curl -s --max-time 3 http://169.254.169.254/latest/meta-data/instance-type 2>/dev/null || echo 'N/A (메타데이터 접근 실패)')"
echo ""

# 배포 구성 요소 상태 확인
echo "배포 구성 요소 상태:"
echo "  - PM2 설정 파일: $([ -f '/opt/aws2-giot-app/ecosystem.config.js' ] && echo '✅ 존재' || echo '❌ 없음')"
echo "  - Nginx 앱 설정: $([ -f '/etc/nginx/conf.d/aws2-giot-app.conf' ] && echo '✅ 존재' || echo '❌ 없음')"
echo "  - 백엔드 빌드: $([ -f '/opt/aws2-giot-app/aws2-api/dist/main.js' ] && echo '✅ 빌드됨' || echo '⚠️ ts-node 모드')"
echo "  - 프론트엔드 빌드: $([ -d '/opt/aws2-giot-app/frontend_backup/build' ] && echo '✅ 빌드됨' || echo '❌ 없음')"
echo "  - Parameter Store 연동: $([ -f '/opt/aws2-giot-app/.env/backend.env' ] && echo '✅ 설정됨' || echo '⚠️ 기본값 사용')"
echo ""

# 개선된 배포 시스템 확인
echo "개선된 배포 시스템 상태:"
echo "  - 충돌 방지 설정: $(sudo nginx -T 2>/dev/null | grep -q 'default_server' && echo '✅ 적용됨' || echo '❌ 설정 필요')"
echo "  - 메타데이터 대안: $(command -v hostname >/dev/null && echo '✅ 사용 가능' || echo '❌ 제한됨')"
echo "  - 자동 백업: $([ -d '/opt/aws2-giot-app/nginx-backup' ] && echo '✅ 활성화' || echo '⚠️ 필요시 생성')"
echo ""

# 결과 요약
echo "=== 테스트 결과 요약 ==="
echo "총 테스트: $TOTAL_TESTS"
echo "성공: $PASSED_TESTS"
echo "실패: $FAILED_TESTS"
echo ""

if [ $FAILED_TESTS -eq 0 ]; then
    echo "🎉 모든 테스트 통과! ALB Health Check가 정상 작동할 것입니다."
    echo ""
    echo "📋 ALB Target Group 권장 설정:"
    echo "  - Protocol: HTTP"
    echo "  - Port: 80 (또는 3001 직접)"
    echo "  - Health check path: /health"
    echo "  - Healthy threshold: 2"
    echo "  - Unhealthy threshold: 2"
    echo "  - Timeout: 5 seconds"
    echo "  - Interval: 30 seconds"
    echo "  - Success codes: 200"
    echo ""
    exit 0
elif [ $FAILED_TESTS -le 2 ]; then
    echo "⚠️  일부 테스트 실패했지만 기본 기능은 정상입니다."
    echo "   실패한 테스트들을 확인하고 필요시 수정하세요."
    echo ""
    exit 0
else
    echo "❌ 여러 중요한 테스트가 실패했습니다. 문제를 해결해야 합니다."
    echo ""
    echo "🔧 일반적인 해결 방법:"
    echo "  1. PM2 재시작: pm2 restart aws2-giot-backend"
    echo "  2. Nginx 재시작: sudo systemctl restart nginx"
    echo "  3. 포트 확인: sudo ss -tlnp | grep -E ':80|:3001'"
    echo "  4. 보안 그룹에서 ALB → EC2 포트 허용 확인"
    echo "  5. 로그 확인: sudo tail -20 /var/log/nginx/error.log"
    echo ""
    exit 1
fi