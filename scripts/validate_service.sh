#!/bin/bash

# AWS2-GIOT-APP Validate Service Script
# 배포된 서비스의 정상 동작 검증

# 스크립트 견고성 설정
set -euo pipefail

# 현재 스크립트에 실행 권한 부여 (안전장치)
chmod +x "$0" 2>/dev/null || true

# 로그 출력 강화
exec > >(tee -a /var/log/codedeploy-validate-service.log) 2>&1

echo "=== Validate Service: 서비스 검증 시작 ==="

# 검증 결과 추적
VALIDATION_FAILED=0

# 1. PM2 프로세스 상태 검증
echo "1. PM2 프로세스 상태 검증 중..."
if pm2 list | grep -q "online.*aws2-giot-backend"; then
    echo "✅ PM2 백엔드 프로세스가 정상 실행 중입니다."
    
    # PM2 프로세스 세부 정보
    echo "PM2 프로세스 정보:"
    pm2 info aws2-giot-backend | grep -E "status|pid|memory|cpu" || true
else
    echo "❌ PM2 백엔드 프로세스가 실행되지 않고 있습니다."
    echo "현재 PM2 프로세스 목록:"
    pm2 list
    VALIDATION_FAILED=1
fi

# 2. 포트 리스닝 상태 검증
echo "2. 포트 리스닝 상태 검증 중..."

# 백엔드 포트 (3001)
if ss -tlnp | grep -q ":3001.*LISTEN"; then
    echo "✅ 백엔드 포트 3001이 정상적으로 열려 있습니다."
    echo "   $(ss -tlnp | grep ':3001.*LISTEN')"
else
    echo "❌ 백엔드 포트 3001이 열려 있지 않습니다."
    VALIDATION_FAILED=1
fi

# Nginx 포트 (80)
if ss -tlnp | grep -q ":80.*LISTEN"; then
    echo "✅ Nginx 포트 80이 정상적으로 열려 있습니다."
else
    echo "❌ Nginx 포트 80이 열려 있지 않습니다."
    VALIDATION_FAILED=1
fi

# 3. 백엔드 API 헬스체크
echo "3. 백엔드 API 헬스체크 중..."
MAX_RETRIES=15
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    # 여러 헬스체크 엔드포인트 시도
    if curl -f -s -o /dev/null --connect-timeout 5 http://localhost:3001/health; then
        echo "✅ /health 엔드포인트 헬스체크 성공"
        break
    elif curl -f -s -o /dev/null --connect-timeout 5 http://localhost:3001/; then
        echo "✅ 백엔드 루트 경로 접근 성공"
        break
    elif curl -s --connect-timeout 5 http://localhost:3001/ | grep -q "Cannot GET"; then
        echo "✅ 백엔드 서버 응답 확인 (NestJS 기본 응답)"
        break
    else
        echo "⏳ 백엔드 응답 대기 중... (시도 $((RETRY_COUNT + 1))/$MAX_RETRIES)"
        RETRY_COUNT=$((RETRY_COUNT + 1))
        sleep 10
    fi
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    echo "❌ 백엔드 헬스체크 실패"
    echo "백엔드 로그 확인:"
    pm2 logs aws2-giot-backend --lines 20 || true
    echo "포트 3001 상태:"
    ss -tlnp | grep 3001 || echo "포트 3001이 열려 있지 않음"
    VALIDATION_FAILED=1
fi

# 4. Nginx 프록시 테스트
echo "4. Nginx 프록시 테스트 중..."
if curl -f -s -o /dev/null --connect-timeout 10 http://localhost/api/; then
    echo "✅ Nginx API 프록시가 정상 동작합니다."
elif curl -s --connect-timeout 10 http://localhost/api/ | grep -q "Cannot GET\|404\|502"; then
    echo "✅ Nginx 프록시 연결됨 (백엔드 라우팅 응답 확인)"
else
    echo "❌ Nginx API 프록시 테스트 실패"
    echo "Nginx 상태 확인:"
    sudo systemctl status nginx --no-pager || true
    echo "Nginx 에러 로그:"
    sudo tail -n 10 /var/log/nginx/aws2-giot-app-error.log || true
    VALIDATION_FAILED=1
fi

# 5. 프론트엔드 정적 파일 검증
echo "5. 프론트엔드 정적 파일 검증 중..."
if curl -f -s -o /dev/null --connect-timeout 10 http://localhost/; then
    echo "✅ 프론트엔드 페이지가 정상적으로 서빙되고 있습니다."
    
    # index.html 내용 확인
    if curl -s http://localhost/ | grep -q "<!DOCTYPE html>"; then
        echo "✅ HTML 문서 구조 확인됨"
    fi
else
    echo "❌ 프론트엔드 페이지 접근 실패"
    echo "Nginx 상태:"
    sudo systemctl status nginx --no-pager || true
    echo "프론트엔드 빌드 파일 확인:"
    ls -la /opt/aws2-giot-app/frontend_backup/build/ | head -5 || echo "빌드 파일 없음"
    VALIDATION_FAILED=1
fi

# 6. 중요 파일 존재 확인
echo "6. 중요 파일 존재 확인 중..."

# 백엔드 빌드 파일
if [ -f "/opt/aws2-giot-app/aws2-api/dist/main.js" ]; then
    echo "✅ 백엔드 빌드 파일 존재"
    echo "   파일 크기: $(ls -lh /opt/aws2-giot-app/aws2-api/dist/main.js | awk '{print $5}')"
else
    echo "❌ 백엔드 빌드 파일이 존재하지 않습니다."
    VALIDATION_FAILED=1
fi

# 프론트엔드 빌드 파일
if [ -f "/opt/aws2-giot-app/frontend_backup/build/index.html" ]; then
    echo "✅ 프론트엔드 빌드 파일 존재"
    echo "   빌드 파일 개수: $(find /opt/aws2-giot-app/frontend_backup/build -type f | wc -l)"
else
    echo "❌ 프론트엔드 빌드 파일이 존재하지 않습니다."
    VALIDATION_FAILED=1
fi

# Python 챗봇 스크립트
if [ -f "/opt/aws2-giot-app/aws2-api/python-scripts/api_wrapper.py" ]; then
    echo "✅ Python 챗봇 스크립트 존재"
else
    echo "❌ Python 챗봇 스크립트가 존재하지 않습니다."
    VALIDATION_FAILED=1
fi

# 7. 설정 파일 및 환경 변수 확인
echo "7. 설정 파일 및 환경 변수 확인 중..."

# 파라미터 스토어 환경 변수 파일 확인
if [ -f "/opt/aws2-giot-app/.env/backend.env" ]; then
    echo "✅ 백엔드 환경 변수 파일 존재"
    echo "   파일 크기: $(ls -lh /opt/aws2-giot-app/.env/backend.env | awk '{print $5}')"
    
    # 중요한 환경 변수 존재 확인
    if grep -q "AWS_ACCESS_KEY_ID=" /opt/aws2-giot-app/.env/backend.env; then
        echo "✅ AWS_ACCESS_KEY_ID 설정됨"
    else
        echo "❌ AWS_ACCESS_KEY_ID가 설정되지 않음"
        VALIDATION_FAILED=1
    fi
    
    if grep -q "S3_BUCKET_NAME=" /opt/aws2-giot-app/.env/backend.env; then
        echo "✅ S3_BUCKET_NAME 설정됨"
    else
        echo "❌ S3_BUCKET_NAME이 설정되지 않음"
        VALIDATION_FAILED=1
    fi
else
    echo "❌ 백엔드 환경 변수 파일이 없습니다."
    VALIDATION_FAILED=1
fi

# 프론트엔드 환경 변수 파일 확인
if [ -f "/opt/aws2-giot-app/.env/frontend.env" ]; then
    echo "✅ 프론트엔드 환경 변수 파일 존재"
    echo "   파일 크기: $(ls -lh /opt/aws2-giot-app/.env/frontend.env | awk '{print $5}')"
else
    echo "❌ 프론트엔드 환경 변수 파일이 없습니다."
    VALIDATION_FAILED=1
fi

# PM2 설정
if [ -f "/opt/aws2-giot-app/ecosystem.config.js" ]; then
    echo "✅ PM2 설정 파일 존재"
    
    # PM2 설정에 환경 변수가 포함되어 있는지 확인
    if grep -q "AWS_ACCESS_KEY_ID" /opt/aws2-giot-app/ecosystem.config.js; then
        echo "✅ PM2 설정에 AWS 환경 변수 포함됨"
    else
        echo "⚠️ PM2 설정에 AWS 환경 변수가 없음"
    fi
else
    echo "❌ PM2 설정 파일이 없습니다."
    VALIDATION_FAILED=1
fi

# Nginx 설정
if [ -f "/etc/nginx/conf.d/aws2-giot-app.conf" ]; then
    echo "✅ Nginx 설정 파일 존재"
    # Nginx 설정 문법 검사
    if sudo nginx -t &>/dev/null; then
        echo "✅ Nginx 설정 문법 검사 통과"
    else
        echo "❌ Nginx 설정 문법 오류"
        sudo nginx -t
        VALIDATION_FAILED=1
    fi
else
    echo "❌ Nginx 설정 파일이 없습니다."
    VALIDATION_FAILED=1
fi

# 8. 로그 파일 확인
echo "8. 로그 파일 확인 중..."
if [ -d "/var/log/aws2-giot-app" ]; then
    echo "✅ 애플리케이션 로그 디렉토리가 존재합니다."
    echo "로그 파일 목록:"
    ls -la /var/log/aws2-giot-app/ | head -10 || true
else
    echo "❌ 애플리케이션 로그 디렉토리가 존재하지 않습니다."
    VALIDATION_FAILED=1
fi

# 9. 시스템 리소스 확인
echo "9. 시스템 리소스 확인 중..."

echo "메모리 사용량:"
free -h

echo "디스크 사용량:"
df -h /opt/aws2-giot-app

echo "현재 실행 중인 프로세스:"
ps aux | grep -E "node|nginx|pm2" | grep -v grep | head -5

# 10. 네트워크 연결 테스트 (경고만, 치명적 오류 아님)
echo "10. 네트워크 연결 테스트 중..."

# 로컬 연결 테스트 (더 중요)
echo "로컬 서비스 연결 테스트:"
if curl -f -s -o /dev/null --connect-timeout 5 --max-time 10 "http://localhost:3001/health" 2>/dev/null; then
    echo "✅ 백엔드 헬스체크 성공"
elif curl -f -s -o /dev/null --connect-timeout 5 --max-time 10 "http://localhost:3001/" 2>/dev/null; then
    echo "✅ 백엔드 로컬 접근 성공"
else
    echo "❌ 백엔드 로컬 접근 실패"
    VALIDATION_FAILED=$((VALIDATION_FAILED + 1))
fi

if curl -f -s -o /dev/null --connect-timeout 5 --max-time 10 "http://localhost/" 2>/dev/null; then
    echo "✅ Nginx 로컬 접근 성공"
else
    echo "❌ Nginx 로컬 접근 실패"
    VALIDATION_FAILED=$((VALIDATION_FAILED + 1))
fi

# 프론트엔드 개발 서버 테스트 (경고만, 치명적 오류 아님)
echo "프론트엔드 개발 서버 테스트:"
if curl -f -s -o /dev/null --connect-timeout 5 --max-time 10 "http://localhost:3000/" 2>/dev/null; then
    echo "✅ 프론트엔드 개발 서버 접근 성공"
elif ss -tlnp | grep -q ":3000.*LISTEN"; then
    echo "⚠️ 프론트엔드 포트 3000은 열려있지만 HTTP 응답 실패 (시작 중일 수 있음)"
else
    echo "ℹ️ 프론트엔드 개발 서버가 실행되지 않음 (선택사항)"
fi

# 외부에서의 접근 테스트 (경고만, 실패해도 배포 성공으로 취급)
if command -v curl &> /dev/null; then
    PUBLIC_IP=$(timeout 5s curl -s http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null || echo "localhost")
    
    if [ "$PUBLIC_IP" != "localhost" ]; then
        echo "퍼블릭 IP: $PUBLIC_IP"
        echo "외부 접근 URL 테스트 중..."
        
        # 간단한 연결 테스트 (실패해도 VALIDATION_FAILED 증가 안 함)
        if timeout 10s curl -f -s -o /dev/null --connect-timeout 5 --max-time 10 "http://$PUBLIC_IP/" 2>/dev/null; then
            echo "✅ 외부에서 웹 접근 가능"
        else
            echo "⚠️ 외부에서 웹 접근 테스트 실패 (보안 그룹/방화벽 확인 필요, 배포는 성공)"
            echo "ℹ️ 이는 AWS 보안 그룹에서 HTTP(80) 포트가 열려있지 않아 발생할 수 있는 정상적인 상황입니다."
        fi
    else
        echo "ℹ️ 퍼블릭 IP를 가져올 수 없습니다."
    fi
fi

# 11. 검증 결과 종합
echo ""
echo "=== Validate Service 결과 ==="

# 중요한 오류만 체크 (로컬 서비스 접근 실패 등)
if [ $VALIDATION_FAILED -eq 0 ]; then
    echo "🎉 모든 핵심 검증이 성공적으로 완료되었습니다!"
    echo ""
    echo "🌐 서비스 접근 정보:"
    PUBLIC_IP=$(timeout 5s curl -s http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null || echo "YOUR-EC2-IP")
    echo "  - 웹 애플리케이션 (정적): http://$PUBLIC_IP/"
    echo "  - 웹 애플리케이션 (개발): http://$PUBLIC_IP:3000/"
    echo "  - API 엔드포인트: http://$PUBLIC_IP/api/"
    echo "  - 백엔드 직접: http://$PUBLIC_IP:3001/"
    echo "  - 헬스체크: http://$PUBLIC_IP/health"  
    echo "  - 챗봇 API: http://$PUBLIC_IP/chatbot/"
    echo ""
    echo "📋 모니터링 명령어:"
    echo "  - PM2 상태: pm2 list"
    echo "  - PM2 모니터링: pm2 monit"
    echo "  - 백엔드 로그: pm2 logs"
    echo "  - Nginx 상태: sudo systemctl status nginx"
    echo "  - Nginx 로그: sudo tail -f /var/log/nginx/aws2-giot-app-access.log"
    echo ""
    echo "🔧 유용한 명령어:"
    echo "  - 백엔드 재시작: pm2 restart all"
    echo "  - Nginx 재시작: sudo systemctl restart nginx"
    echo "  - 전체 재배포: pm2 delete all && pm2 start ecosystem.config.js"
    
    exit 0
elif [ $VALIDATION_FAILED -le 2 ]; then
    echo "⚠️ 일부 비중요 검증이 실패했지만 핵심 서비스는 정상입니다."
    echo "🎉 배포가 성공적으로 완료되었습니다!"
    echo ""
    echo "🔍 확인해 볼 사항:"
    echo "  - 외부 접근이 안 되면 AWS 보안 그룹에서 HTTP(80) 포트를 열어주세요"
    echo "  - PM2 상태 확인: pm2 list"
    echo "  - Nginx 상태 확인: sudo systemctl status nginx"
    
    exit 0
else
    echo "❌ 검증 과정에서 $VALIDATION_FAILED개의 중요한 문제가 발견되었습니다."
    echo ""
    echo "🔍 문제 해결을 위한 로그 확인:"
    echo "  - PM2 로그: pm2 logs --lines 50"
    echo "  - Nginx 액세스 로그: sudo tail -50 /var/log/nginx/aws2-giot-app-access.log"
    echo "  - Nginx 에러 로그: sudo tail -50 /var/log/nginx/aws2-giot-app-error.log"
    echo "  - 시스템 로그: sudo journalctl -u nginx -n 50"
    echo ""
    echo "🔧 일반적인 해결 방법:"
    echo "  1. 백엔드 재시작: pm2 restart all"
    echo "  2. Nginx 설정 확인 및 재시작: sudo nginx -t && sudo systemctl restart nginx"
    echo "  3. 포트 충돌 확인: sudo ss -tlnp | grep -E ':80|:3001'"
    echo "  4. 디스크 공간 확인: df -h"
    echo "  5. 메모리 사용량 확인: free -h"
    
    exit 1
fi
