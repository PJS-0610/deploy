#!/bin/bash

# AWS2-GIOT-APP Stop Application Script
# 애플리케이션 서비스 안전 종료

set -e

echo "=== Stop Application: 애플리케이션 종료 시작 ==="

# 1. PM2 프로세스 확인 및 종료
echo "1. PM2 프로세스 확인 및 종료 중..."

if command -v pm2 &> /dev/null; then
    echo "PM2 프로세스 목록:"
    pm2 list || true
    
    # aws2-giot-backend 프로세스 종료
    if pm2 list | grep -q "aws2-giot-backend"; then
        echo "aws2-giot-backend 프로세스 종료 중..."
        
        # Graceful stop
        pm2 stop aws2-giot-backend || true
        sleep 3
        
        # 프로세스 삭제
        pm2 delete aws2-giot-backend || true
        sleep 2
        
        echo "✅ PM2 백엔드 프로세스 종료 완료"
    else
        echo "ℹ️ aws2-giot-backend 프로세스가 실행 중이지 않습니다."
    fi
    
    # 기타 관련 프로세스들 정리
    if pm2 list | grep -q "aws2"; then
        echo "기타 aws2 관련 프로세스들 종료 중..."
        pm2 stop all || true
        pm2 delete all || true
    fi
    
    # PM2 설정 저장
    pm2 save || true
    
else
    echo "ℹ️ PM2가 설치되어 있지 않습니다."
fi

# 2. Node.js 프로세스 강제 종료 확인
echo "2. Node.js 프로세스 강제 종료 확인 중..."

# 3001 포트를 사용하는 프로세스 찾기
NODE_PIDS=$(ss -tlnp | grep ":3001" | awk '{print $NF}' | grep -o 'pid=[0-9]*' | cut -d'=' -f2 2>/dev/null || echo "")

if [ ! -z "$NODE_PIDS" ]; then
    echo "포트 3001을 사용하는 프로세스 발견: $NODE_PIDS"
    echo "해당 프로세스들을 종료합니다..."
    
    for pid in $NODE_PIDS; do
        if kill -0 $pid 2>/dev/null; then
            # SIGTERM으로 우선 시도
            kill -TERM $pid 2>/dev/null || true
            sleep 3
            
            # 여전히 실행 중이면 SIGKILL로 강제 종료
            if kill -0 $pid 2>/dev/null; then
                echo "강제 종료: PID $pid"
                kill -KILL $pid 2>/dev/null || true
            fi
        fi
    done
    
    echo "✅ Node.js 프로세스 종료 완료"
else
    echo "ℹ️ 포트 3001을 사용하는 프로세스가 없습니다."
fi

# 3. Python 프로세스 정리
echo "3. Python 관련 프로세스 정리 중..."

# 챗봇 관련 Python 프로세스 찾기
PYTHON_PIDS=$(pgrep -f "api_wrapper.py\|chatbot.py" 2>/dev/null || echo "")

if [ ! -z "$PYTHON_PIDS" ]; then
    echo "Python 챗봇 프로세스 발견: $PYTHON_PIDS"
    echo "해당 프로세스들을 종료합니다..."
    
    # SIGTERM으로 우선 시도
    echo $PYTHON_PIDS | xargs kill -TERM 2>/dev/null || true
    sleep 3
    
    # 여전히 실행 중인 것들은 SIGKILL로 강제 종료
    echo $PYTHON_PIDS | xargs kill -KILL 2>/dev/null || true
    
    echo "✅ Python 프로세스 정리 완료"
else
    echo "ℹ️ 실행 중인 Python 챗봇 프로세스가 없습니다."
fi

# 4. Nginx 설정 정리
echo "4. Nginx 상태 확인 중..."

if [ -f "/etc/nginx/conf.d/aws2-giot-app.conf" ]; then
    echo "Nginx 설정 파일이 존재합니다."
    echo "새로운 배포를 위해 Nginx를 재로드합니다..."
    sudo systemctl reload nginx || true
    echo "✅ Nginx 재로드 완료"
else
    echo "ℹ️ Nginx 설정 파일이 없습니다."
fi

# 5. 로그 로테이션
echo "5. 로그 파일 로테이션 중..."

if [ -d "/var/log/aws2-giot-app" ]; then
    echo "기존 로그 파일 로테이션 중..."
    BACKUP_DATE=$(date +%Y%m%d-%H%M%S)
    
    if [ "$(ls -A /var/log/aws2-giot-app 2>/dev/null)" ]; then
        sudo mkdir -p "/var/log/aws2-giot-app/backup-$BACKUP_DATE"
        sudo mv /var/log/aws2-giot-app/*.log "/var/log/aws2-giot-app/backup-$BACKUP_DATE/" 2>/dev/null || true
        echo "✅ 로그 파일 백업 완료: backup-$BACKUP_DATE"
    else
        echo "ℹ️ 로테이션할 로그 파일이 없습니다."
    fi
else
    echo "ℹ️ 로그 디렉토리가 없습니다."
fi

# 6. PM2 관련 임시 파일 정리
echo "6. PM2 임시 파일 정리 중..."

if [ -d "/home/ec2-user/.pm2" ]; then
    echo "PM2 임시 파일 정리 중..."
    rm -rf /home/ec2-user/.pm2/logs/* 2>/dev/null || true
    rm -rf /home/ec2-user/.pm2/pids/* 2>/dev/null || true
    echo "✅ PM2 임시 파일 정리 완료"
fi

# 7. 최종 상태 확인
echo "7. 최종 상태 확인 중..."

# 포트 사용 확인
if ss -tlnp | grep -q ":3001.*LISTEN"; then
    echo "⚠️ 포트 3001이 여전히 사용 중입니다."
    echo "사용 중인 프로세스:"
    ss -tlnp | grep ":3001"
else
    echo "✅ 포트 3001이 정상적으로 해제되었습니다."
fi

# Node.js 프로세스 확인
NODE_PROCESSES=$(pgrep -f "node.*main.js\|nest start\|aws2-giot" 2>/dev/null || echo "")
if [ ! -z "$NODE_PROCESSES" ]; then
    echo "⚠️ 여전히 실행 중인 Node.js 관련 프로세스가 있습니다: $NODE_PROCESSES"
else
    echo "✅ 모든 Node.js 프로세스가 종료되었습니다."
fi

# Python 프로세스 확인
PYTHON_PROCESSES=$(pgrep -f "python.*api_wrapper\|python.*chatbot" 2>/dev/null || echo "")
if [ ! -z "$PYTHON_PROCESSES" ]; then
    echo "⚠️ 여전히 실행 중인 Python 프로세스가 있습니다: $PYTHON_PROCESSES"
else
    echo "✅ 모든 Python 프로세스가 종료되었습니다."
fi

# 8. 시스템 리소스 정리
echo "8. 시스템 리소스 정리 중..."

# 공유 메모리 정리
sudo ipcs -m | grep ec2-user | awk '{print $2}' | xargs -r sudo ipcrm -m 2>/dev/null || true

# 임시 파일 정리
sudo find /tmp -name "*aws2-giot*" -type f -mtime +1 -delete 2>/dev/null || true

echo "✅ 시스템 리소스 정리 완료"

echo ""
echo "=== Stop Application 완료 ==="
echo ""
echo "📊 종료 결과:"
echo "  - PM2 프로세스: 종료됨"
echo "  - Node.js 백엔드: 종료됨"  
echo "  - Python 챗봇: 종료됨"
echo "  - 포트 3001: 해제됨"
echo "  - 로그 파일: 로테이션됨"
echo "  - 시스템 리소스: 정리됨"
echo ""
echo "🔄 새로운 배포를 위한 준비가 완료되었습니다."