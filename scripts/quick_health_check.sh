#!/bin/bash

# Quick Health Check Script
# 배포 후 즉시 ALB Health Check 상태를 확인하는 간단한 스크립트

echo "🏥 Quick Health Check 시작"

# 기본 health check
echo -n "1. /health 엔드포인트 테스트: "
if curl -s http://localhost/health | grep -q '"ok":true'; then
    echo "✅ 성공"
else
    echo "❌ 실패"
    exit 1
fi

# healthz 엔드포인트
echo -n "2. /healthz 엔드포인트 테스트: "
if curl -s http://localhost/healthz | grep -q '"ok":true'; then
    echo "✅ 성공"
else
    echo "❌ 실패"
    exit 1
fi

# Private IP 테스트 (가능한 경우)
PRIVATE_IP=$(hostname -I | awk '{print $1}' 2>/dev/null || echo "")
if [[ "$PRIVATE_IP" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    echo -n "3. Private IP($PRIVATE_IP) 테스트: "
    if curl -s "http://$PRIVATE_IP/health" | grep -q '"ok":true'; then
        echo "✅ 성공"
    else
        echo "❌ 실패"
        exit 1
    fi
else
    echo "3. Private IP 테스트: ⏭️ 건너뜀"
fi

# 서비스 상태 확인
echo -n "4. PM2 백엔드 상태: "
if pm2 list | grep -q "aws2-giot-backend.*online"; then
    echo "✅ 온라인"
else
    echo "❌ 오프라인"
    exit 1
fi

echo -n "5. Nginx 서비스 상태: "
if systemctl is-active --quiet nginx; then
    echo "✅ 실행 중"
else
    echo "❌ 중지됨"
    exit 1
fi

echo ""
echo "🎉 모든 Health Check 통과!"
echo "🔗 ALB Health Check가 성공할 것입니다."
echo ""

exit 0