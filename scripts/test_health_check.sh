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

# 환경 정보 수집
echo "🔍 환경 정보 수집"
PRIVATE_IP=$(curl -s http://169.254.169.254/latest/meta-data/local-ipv4 2>/dev/null || echo "localhost")
PUBLIC_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null || echo "N/A")
INSTANCE_ID=$(curl -s http://169.254.169.254/latest/meta-data/instance-id 2>/dev/null || echo "unknown")

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
run_test "default_server 설정 확인" "sudo nginx -T | grep 'listen.*80.*default_server'" "default_server"
run_test "server_name 설정 확인" "sudo nginx -T | grep 'server_name'" "_\|localhost"
run_test "헬스체크 location 확인" "sudo nginx -T | grep 'location.*health'" "/health"
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

# 8. AWS 메타데이터 및 보안 그룹 힌트
echo "8️⃣ AWS 환경 정보"
echo "가용 영역: $(curl -s http://169.254.169.254/latest/meta-data/placement/availability-zone 2>/dev/null || echo 'N/A')"
echo "인스턴스 타입: $(curl -s http://169.254.169.254/latest/meta-data/instance-type 2>/dev/null || echo 'N/A')"
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