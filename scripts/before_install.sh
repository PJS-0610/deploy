#!/bin/bash

echo "=== BeforeInstall: 기존 파일 정리 ==="

# 기존 애플리케이션 디렉토리 정리
if [ -d "/home/ec2-user/app" ]; then
    echo "기존 애플리케이션 파일들 정리 중... (강력한 덮어쓰기 모드)"
    
    # ⚠️ 강력한 덮어쓰기 모드: 모든 파일 강제 제거
    echo "강력한 정리 모드 실행 중..."
    rm -rf /home/ec2-user/app/* 2>/dev/null || true
    
    # 숨김 파일들도 안전하게 제거 (. 및 .. 디렉토리 제외)
    find /home/ec2-user/app -name ".*" -not -name "." -not -name ".." -delete 2>/dev/null || true
    
    echo "기존 파일 정리 완료 (강력한 전체 삭제 모드)"
    echo "⚠️ 모든 파일 및 디렉토리 완전 삭제됨:"
    echo "- 모든 일반 파일들 (rm -rf /home/ec2-user/app/*)"
    echo "- 모든 숨김 파일들 (.gitignore, .env, .eslintrc, nest-cli.json 등)"
    echo "- 모든 설정 디렉토리들 (.idea/, .vscode/, node_modules/ 등)"
    echo "- 모든 빌드 산출물 (dist/, build/, .cache/ 등)"
    echo "- 모든 문서 파일들 (README*, *.md 등)"
    echo "- 모든 패키지 파일들 (package.json, yarn.lock 등)"
    echo "✅ 완전히 깨끗한 배포 환경 준비 완료!"
else
    echo "새로운 배포: 애플리케이션 디렉토리 생성"
    mkdir -p /home/ec2-user/app
fi

# 디렉토리 권한 설정
chown -R ec2-user:ec2-user /home/ec2-user/app
chmod -R 755 /home/ec2-user/app

echo "=== BeforeInstall 완료 ==="