# 🚨 배포 완전 차단 상태 🚨

## 현재 상태
**모든 자동 배포가 완전히 차단되었습니다.**

## 차단된 항목들
- ✅ GitHub Actions 워크플로우 비활성화
- ✅ workflow_dispatch (수동 트리거) 제거
- ✅ 모든 push/pull_request 트리거 제거
- ✅ 모든 스케줄 트리거 제거

## 배포 방법
배포는 **오직 수동으로만** 가능합니다:

### 방법 1: AWS Console 사용
```
1. AWS Console → CodeDeploy
2. Applications → aws2-giot-app
3. Deployment groups → production
4. Create deployment
5. S3에서 최신 패키지 선택
```

### 방법 2: AWS CLI 사용
```bash
aws deploy create-deployment \
  --application-name aws2-giot-app \
  --deployment-group-name production \
  --s3-location bucket=버킷명,key=deployments/패키지명.zip,bundleType=zip
```

## 자동 배포 재활성화하려면
1. `.github/workflows/deploy.yml` 파일 편집
2. 주석 처리된 부분들 해제
3. `on:` 섹션 추가

## ⚠️ 경고
**자동 배포 재활성화 시 신중히 검토하세요!**