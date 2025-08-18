#!/bin/bash

echo "=== BeforeInstall: 기존 파일 정리 ==="

# 기존 애플리케이션 디렉토리 정리
if [ -d "/home/ec2-user/app" ]; then
    echo "기존 애플리케이션 파일들 정리 중..."
    
    # Git 관련 파일들 제거 (충돌 방지) - 모든 하위 디렉토리 포함
    find /home/ec2-user/app -name ".gitattributes" -delete 2>/dev/null || true
    find /home/ec2-user/app -name ".gitignore" -delete 2>/dev/null || true
    find /home/ec2-user/app -name ".git*" -delete 2>/dev/null || true
    
    # .env.example 파일들 모든 하위 디렉토리에서 제거
    find /home/ec2-user/app -name ".env.example" -delete 2>/dev/null || true
    find /home/ec2-user/app -name ".env" -delete 2>/dev/null || true
    
    # 기타 충돌 가능한 파일들 제거
    rm -f /home/ec2-user/app/package.json
    rm -f /home/ec2-user/app/package-lock.json
    rm -f /home/ec2-user/app/ecosystem.config.js
    rm -f /home/ec2-user/app/appspec.yml
    rm -f /home/ec2-user/app/README.md
    rm -f /home/ec2-user/app/DEPLOYMENT_BLOCKED.md
    
    # 스크립트 디렉토리 정리
    rm -rf /home/ec2-user/app/scripts
    
    # IDE 및 개발 도구 디렉토리 정리 - 모든 하위 디렉토리 포함
    find /home/ec2-user/app -type d -name ".idea" -exec rm -rf {} + 2>/dev/null || true
    find /home/ec2-user/app -type d -name ".vscode" -exec rm -rf {} + 2>/dev/null || true
    find /home/ec2-user/app -type d -name ".vs" -exec rm -rf {} + 2>/dev/null || true
    find /home/ec2-user/app -type d -name ".github" -exec rm -rf {} + 2>/dev/null || true
    
    # 개발 도구 설정 파일들 모든 하위 디렉토리에서 제거
    find /home/ec2-user/app -name ".editorconfig" -delete 2>/dev/null || true
    find /home/ec2-user/app -name ".eslintrc*" -delete 2>/dev/null || true
    find /home/ec2-user/app -name ".prettierrc*" -delete 2>/dev/null || true
    find /home/ec2-user/app -name ".nvmrc" -delete 2>/dev/null || true
    find /home/ec2-user/app -name ".npmrc" -delete 2>/dev/null || true
    find /home/ec2-user/app -name ".DS_Store" -delete 2>/dev/null || true
    
    # 빌드 및 캐시 디렉토리 정리 - 모든 하위 디렉토리 포함
    find /home/ec2-user/app -type d -name "node_modules" -exec rm -rf {} + 2>/dev/null || true
    find /home/ec2-user/app -type d -name "dist" -exec rm -rf {} + 2>/dev/null || true
    find /home/ec2-user/app -type d -name "build" -exec rm -rf {} + 2>/dev/null || true
    find /home/ec2-user/app -type d -name ".next" -exec rm -rf {} + 2>/dev/null || true
    find /home/ec2-user/app -type d -name ".cache" -exec rm -rf {} + 2>/dev/null || true
    find /home/ec2-user/app -type d -name "coverage" -exec rm -rf {} + 2>/dev/null || true
    
    # 로그 및 임시 파일들 정리 - 모든 하위 디렉토리 포함
    find /home/ec2-user/app -name "*.log" -delete 2>/dev/null || true
    find /home/ec2-user/app -type d -name "logs" -exec rm -rf {} + 2>/dev/null || true
    find /home/ec2-user/app -name "*.tmp" -delete 2>/dev/null || true
    find /home/ec2-user/app -name ".*~" -delete 2>/dev/null || true
    
    echo "기존 파일 정리 완료 (모든 하위 디렉토리 포함)"
    echo "정리된 항목들:"
    echo "- Git 관련 파일들: 모든 .gitignore, .gitattributes, .git* 파일들"
    echo "- IDE 설정 디렉토리들: .idea, .vscode, .vs, .github 디렉토리들"
    echo "- 빌드 및 캐시 디렉토리들: node_modules, dist, build, .cache 등"
    echo "- 환경변수 파일들: .env, .env.example 파일들"
    echo "- 패키지 설정 파일들: package.json, ecosystem.config.js 등"
    echo "- 개발 도구 설정들: .eslintrc*, .prettierrc*, .npmrc 등"
    echo "- 문서 파일들: README.md, DEPLOYMENT_BLOCKED.md 등"
    echo "- 로그 및 임시 파일들: *.log, *.tmp, logs 디렉토리들"
    echo "- 기타: scripts 디렉토리, .DS_Store, 백업 파일들"
else
    echo "새로운 배포: 애플리케이션 디렉토리 생성"
    mkdir -p /home/ec2-user/app
fi

# 디렉토리 권한 설정
chown -R ec2-user:ec2-user /home/ec2-user/app
chmod -R 755 /home/ec2-user/app

echo "=== BeforeInstall 완료 ==="