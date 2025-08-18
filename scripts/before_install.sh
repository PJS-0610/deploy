#!/bin/bash

echo "=== BeforeInstall: 기존 파일 정리 ==="

# 기존 애플리케이션 디렉토리 정리
if [ -d "/home/ec2-user/app" ]; then
    echo "기존 애플리케이션 파일들 정리 중..."
    
    # .env.example 파일들 명시적으로 제거
    rm -f /home/ec2-user/app/.env.example
    rm -f /home/ec2-user/app/aws2-api/.env.example
    rm -f /home/ec2-user/app/frontend_backup/.env.example
    
    # 기타 충돌 가능한 파일들 제거
    rm -f /home/ec2-user/app/package.json
    rm -f /home/ec2-user/app/package-lock.json
    rm -f /home/ec2-user/app/ecosystem.config.js
    rm -f /home/ec2-user/app/appspec.yml
    
    # 스크립트 디렉토리 정리
    rm -rf /home/ec2-user/app/scripts
    
    echo "기존 파일 정리 완료"
else
    echo "새로운 배포: 애플리케이션 디렉토리 생성"
    mkdir -p /home/ec2-user/app
fi

# 디렉토리 권한 설정
chown -R ec2-user:ec2-user /home/ec2-user/app
chmod -R 755 /home/ec2-user/app

echo "=== BeforeInstall 완료 ==="