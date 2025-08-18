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
    
    # 패키지 및 설정 파일들 모든 하위 디렉토리에서 제거
    find /home/ec2-user/app -name "package.json" -delete 2>/dev/null || true
    find /home/ec2-user/app -name "package-lock.json" -delete 2>/dev/null || true
    find /home/ec2-user/app -name "yarn.lock" -delete 2>/dev/null || true
    find /home/ec2-user/app -name "pnpm-lock.yaml" -delete 2>/dev/null || true
    
    # 문서 파일들 모든 하위 디렉토리에서 제거  
    find /home/ec2-user/app -name "README*" -delete 2>/dev/null || true
    find /home/ec2-user/app -name "CHANGELOG*" -delete 2>/dev/null || true
    find /home/ec2-user/app -name "LICENSE*" -delete 2>/dev/null || true
    find /home/ec2-user/app -name "DEPLOYMENT_BLOCKED.md" -delete 2>/dev/null || true
    find /home/ec2-user/app -name "*.md" -not -path "*/node_modules/*" -delete 2>/dev/null || true
    
    # 프로젝트 설정 파일들 모든 하위 디렉토리에서 제거
    find /home/ec2-user/app -name "appspec.yml" -delete 2>/dev/null || true
    find /home/ec2-user/app -name "ecosystem.config.*" -delete 2>/dev/null || true
    find /home/ec2-user/app -name "docker-compose.*" -delete 2>/dev/null || true
    find /home/ec2-user/app -name "Dockerfile*" -delete 2>/dev/null || true
    find /home/ec2-user/app -name ".dockerignore" -delete 2>/dev/null || true
    
    # 기타 설정 파일들
    find /home/ec2-user/app -name "tailwind.config.*" -delete 2>/dev/null || true
    find /home/ec2-user/app -name "postcss.config.*" -delete 2>/dev/null || true
    find /home/ec2-user/app -name "next.config.*" -delete 2>/dev/null || true
    find /home/ec2-user/app -name "nuxt.config.*" -delete 2>/dev/null || true
    find /home/ec2-user/app -name "svelte.config.*" -delete 2>/dev/null || true
    
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
    find /home/ec2-user/app -name "eslint.config.*" -delete 2>/dev/null || true
    find /home/ec2-user/app -name ".prettierrc*" -delete 2>/dev/null || true
    find /home/ec2-user/app -name "prettier.config.*" -delete 2>/dev/null || true
    find /home/ec2-user/app -name ".nvmrc" -delete 2>/dev/null || true
    find /home/ec2-user/app -name ".npmrc" -delete 2>/dev/null || true
    find /home/ec2-user/app -name ".DS_Store" -delete 2>/dev/null || true
    
    # TypeScript 및 빌드 설정 파일들
    find /home/ec2-user/app -name "tsconfig*.json" -delete 2>/dev/null || true
    find /home/ec2-user/app -name "jest.config*" -delete 2>/dev/null || true
    find /home/ec2-user/app -name "vitest.config.*" -delete 2>/dev/null || true
    find /home/ec2-user/app -name "babel.config*" -delete 2>/dev/null || true
    find /home/ec2-user/app -name "webpack.config*" -delete 2>/dev/null || true
    find /home/ec2-user/app -name "rollup.config.*" -delete 2>/dev/null || true
    find /home/ec2-user/app -name "vite.config.*" -delete 2>/dev/null || true
    
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
    
    echo "기존 파일 정리 완료 (모든 하위 디렉토리 완전 정리)"
    echo "정리된 항목들:"
    echo "- Git 관련 파일들: .gitignore, .gitattributes, .git* (모든 위치)"
    echo "- IDE 설정 디렉토리들: .idea/, .vscode/, .vs/, .github/ (모든 위치)"
    echo "- 빌드 및 캐시 디렉토리들: node_modules/, dist/, build/, .cache/ 등 (모든 위치)"
    echo "- 환경변수 파일들: .env, .env.example (모든 위치)"
    echo "- 패키지 설정 파일들: package.json, package-lock.json, yarn.lock 등 (모든 위치)"
    echo "- 문서 파일들: README*, CHANGELOG*, LICENSE*, *.md (모든 위치)"
    echo "- ESLint 설정들: .eslintrc*, eslint.config.* (모든 위치) ← 포함!"
    echo "- 개발 도구 설정들: .prettierrc*, tsconfig*.json, jest.config* 등 (모든 위치)"
    echo "- 빌드 도구 설정들: webpack.config*, vite.config*, rollup.config* 등"
    echo "- 프레임워크 설정들: next.config*, tailwind.config*, postcss.config* 등"
    echo "- 배포 설정 파일들: appspec.yml, ecosystem.config.*, docker-compose.*, Dockerfile* 등"
    echo "- 로그 및 임시 파일들: *.log, *.tmp, logs/ 디렉토리들"
    echo "- 기타: scripts 디렉토리, .DS_Store, .dockerignore, 백업 파일들 등"
else
    echo "새로운 배포: 애플리케이션 디렉토리 생성"
    mkdir -p /home/ec2-user/app
fi

# 디렉토리 권한 설정
chown -R ec2-user:ec2-user /home/ec2-user/app
chmod -R 755 /home/ec2-user/app

echo "=== BeforeInstall 완료 ==="