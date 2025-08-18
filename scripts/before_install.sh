#!/bin/bash

echo "=== BeforeInstall: 기존 파일 정리 ==="

# 기존 애플리케이션 디렉토리 정리
if [ -d "/home/ec2-user/app" ]; then
    echo "기존 애플리케이션 파일들 정리 중..."
    
    # Git 관련 파일들 제거 (충돌 방지)
    rm -f /home/ec2-user/app/.gitattributes
    rm -f /home/ec2-user/app/.gitignore
    rm -f /home/ec2-user/app/.git*
    
    # .env.example 파일들 명시적으로 제거
    rm -f /home/ec2-user/app/.env.example
    rm -f /home/ec2-user/app/aws2-api/.env.example
    rm -f /home/ec2-user/app/frontend_backup/.env.example
    
    # 기타 충돌 가능한 파일들 제거
    rm -f /home/ec2-user/app/package.json
    rm -f /home/ec2-user/app/package-lock.json
    rm -f /home/ec2-user/app/ecosystem.config.js
    rm -f /home/ec2-user/app/appspec.yml
    rm -f /home/ec2-user/app/README.md
    rm -f /home/ec2-user/app/DEPLOYMENT_BLOCKED.md
    
    # 스크립트 디렉토리 정리
    rm -rf /home/ec2-user/app/scripts
    
    # IDE 및 개발 도구 디렉토리 정리
    rm -rf /home/ec2-user/app/.idea          # IntelliJ IDEA
    rm -rf /home/ec2-user/app/.vscode        # Visual Studio Code
    rm -rf /home/ec2-user/app/.vs            # Visual Studio
    rm -rf /home/ec2-user/app/.github        # GitHub 워크플로우
    
    # 특정 숨김 파일들 안전하게 정리
    rm -f /home/ec2-user/app/.editorconfig
    rm -f /home/ec2-user/app/.eslintrc*
    rm -f /home/ec2-user/app/.prettierrc*
    rm -f /home/ec2-user/app/.nvmrc
    rm -f /home/ec2-user/app/.npmrc
    rm -f /home/ec2-user/app/.DS_Store
    
    # 빌드 및 캐시 디렉토리 정리
    rm -rf /home/ec2-user/app/node_modules    # Node.js modules
    rm -rf /home/ec2-user/app/dist           # 빌드 산출물
    rm -rf /home/ec2-user/app/build          # React 빌드
    rm -rf /home/ec2-user/app/.next          # Next.js 캐시
    rm -rf /home/ec2-user/app/.cache         # 각종 캐시
    rm -rf /home/ec2-user/app/coverage       # 테스트 커버리지
    
    # 로그 파일들 정리
    rm -f /home/ec2-user/app/*.log
    rm -rf /home/ec2-user/app/logs
    
    # 임시 파일들 정리
    rm -f /home/ec2-user/app/*.tmp
    rm -f /home/ec2-user/app/.*~
    
    echo "기존 파일 정리 완료"
    echo "정리된 항목들:"
    echo "- Git 관련 파일들 (.gitattributes, .gitignore, etc.)"
    echo "- IDE 설정 디렉토리들 (.idea, .vscode, .vs, .github)"
    echo "- 빌드 및 캐시 디렉토리들 (node_modules, dist, build, .cache, etc.)"
    echo "- 환경변수 템플릿 파일들 (.env.example)"
    echo "- 패키지 및 설정 파일들 (package.json, ecosystem.config.js, etc.)"
    echo "- 개발 도구 설정들 (.eslintrc, .prettierrc, etc.)"
    echo "- 문서 파일들 (README.md, etc.)"
    echo "- 로그 및 임시 파일들, 스크립트 디렉토리들"
else
    echo "새로운 배포: 애플리케이션 디렉토리 생성"
    mkdir -p /home/ec2-user/app
fi

# 디렉토리 권한 설정
chown -R ec2-user:ec2-user /home/ec2-user/app
chmod -R 755 /home/ec2-user/app

echo "=== BeforeInstall 완료 ==="