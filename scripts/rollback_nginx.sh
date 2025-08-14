#!/bin/bash

# AWS2-GIOT-APP Nginx Rollback Script
# Nginx 설정 문제 시 이전 상태로 복원하는 스크립트

# 스크립트 견고성 설정
set -euo pipefail

# 현재 스크립트에 실행 권한 부여 (안전장치)
chmod +x "$0" 2>/dev/null || true

# 로그 출력 강화
exec > >(tee -a /var/log/nginx-rollback.log) 2>&1

echo "=== Nginx 설정 롤백 시작 ==="
echo "롤백 시간: $(date)"
echo ""

# 백업 디렉토리 확인
NGINX_BACKUP_DIR="/opt/aws2-giot-app/nginx-backup"
if [ ! -d "$NGINX_BACKUP_DIR" ]; then
    echo "❌ 백업 디렉토리를 찾을 수 없습니다: $NGINX_BACKUP_DIR"
    echo "   수동으로 Nginx 설정을 복구해야 합니다."
    exit 1
fi

echo "📁 사용 가능한 백업 파일들:"
ls -la "$NGINX_BACKUP_DIR"
echo ""

# 롤백 옵션 선택
echo "🔄 롤백 옵션:"
echo "  1. 최신 백업으로 복원"
echo "  2. 특정 백업 파일 선택"
echo "  3. 시스템 기본 설정으로 복원"
echo "  4. 취소"
echo ""

# 인터랙티브 모드가 아닐 경우 자동으로 최신 백업 사용
if [ -t 0 ]; then
    read -p "선택하세요 (1-4): " choice
else
    choice="1"
    echo "비인터랙티브 모드: 최신 백업으로 자동 복원"
fi

case $choice in
    1)
        echo "최신 백업으로 복원 중..."
        
        # 최신 nginx.conf 백업 찾기
        LATEST_NGINX_BACKUP=$(ls -t "$NGINX_BACKUP_DIR"/nginx.conf.backup.* 2>/dev/null | head -1 || echo "")
        
        if [ -n "$LATEST_NGINX_BACKUP" ]; then
            echo "복원할 파일: $LATEST_NGINX_BACKUP"
            sudo cp "$LATEST_NGINX_BACKUP" /etc/nginx/nginx.conf
            echo "✅ nginx.conf 복원 완료"
        else
            echo "⚠️ nginx.conf 백업을 찾을 수 없습니다."
        fi
        
        # 최신 conf.d 백업 찾기
        LATEST_CONFD_BACKUP=$(ls -td "$NGINX_BACKUP_DIR"/conf.d.backup.* 2>/dev/null | head -1 || echo "")
        
        if [ -n "$LATEST_CONFD_BACKUP" ]; then
            echo "복원할 디렉토리: $LATEST_CONFD_BACKUP"
            sudo rm -rf /etc/nginx/conf.d/*
            sudo cp -r "$LATEST_CONFD_BACKUP"/* /etc/nginx/conf.d/
            echo "✅ conf.d 복원 완료"
        else
            echo "⚠️ conf.d 백업을 찾을 수 없습니다."
            # 우리가 만든 파일만 제거
            sudo rm -f /etc/nginx/conf.d/aws2-giot-app.conf
            echo "✅ 문제 설정 파일 제거 완료"
        fi
        ;;
        
    2)
        echo "사용 가능한 백업 파일들:"
        select backup_file in "$NGINX_BACKUP_DIR"/*; do
            if [ -n "$backup_file" ]; then
                echo "선택된 파일: $backup_file"
                
                if [[ "$backup_file" == *"nginx.conf"* ]]; then
                    sudo cp "$backup_file" /etc/nginx/nginx.conf
                    echo "✅ nginx.conf 복원 완료"
                elif [[ "$backup_file" == *"conf.d"* ]]; then
                    sudo rm -rf /etc/nginx/conf.d/*
                    sudo cp -r "$backup_file"/* /etc/nginx/conf.d/
                    echo "✅ conf.d 복원 완료"
                fi
                break
            else
                echo "올바른 선택을 해주세요."
            fi
        done
        ;;
        
    3)
        echo "시스템 기본 설정으로 복원 중..."
        
        # Nginx 재설치 (설정 파일 초기화)
        sudo yum reinstall nginx -y
        
        echo "✅ 시스템 기본 설정 복원 완료"
        ;;
        
    4)
        echo "롤백 취소됨"
        exit 0
        ;;
        
    *)
        echo "❌ 올바르지 않은 선택입니다."
        exit 1
        ;;
esac

echo ""
echo "🔍 설정 검증 중..."

# 설정 파일 문법 검사
if sudo nginx -t; then
    echo "✅ Nginx 설정 문법 검사 통과"
else
    echo "❌ 복원된 설정에도 문제가 있습니다."
    echo "   수동으로 설정을 확인하거나 시스템 기본 설정으로 복원하세요."
    exit 1
fi

# Nginx 재시작
echo "🔄 Nginx 재시작 중..."
sudo systemctl restart nginx

if sudo systemctl is-active --quiet nginx; then
    echo "✅ Nginx 서비스 정상 시작"
else
    echo "❌ Nginx 서비스 시작 실패"
    sudo systemctl status nginx --no-pager
    exit 1
fi

# 기본 연결 테스트
echo "🧪 기본 연결 테스트 중..."
if curl -s -o /dev/null -w "%{http_code}" http://localhost/ | grep -q "200\|404\|403"; then
    echo "✅ Nginx 기본 연결 정상"
else
    echo "⚠️ Nginx 연결에 문제가 있을 수 있습니다"
fi

echo ""
echo "=== 롤백 완료 ==="
echo "🎉 Nginx 설정이 성공적으로 복원되었습니다."
echo ""
echo "📋 다음 단계:"
echo "  1. 웹 애플리케이션이 정상 작동하는지 확인"
echo "  2. ALB health check 상태 확인"
echo "  3. 필요시 새로운 설정을 다시 적용"
echo ""
echo "🔧 유용한 명령어:"
echo "  - Nginx 상태: sudo systemctl status nginx"
echo "  - 설정 확인: sudo nginx -t"
echo "  - 로그 확인: sudo tail -f /var/log/nginx/error.log"
echo ""