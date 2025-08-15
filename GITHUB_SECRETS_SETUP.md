# GitHub Actions AWS 자격 증명 설정 가이드

## 문제
GitHub Actions에서 `aws-actions/configure-aws-credentials@v4` 실행 시 자격 증명을 로드할 수 없는 오류 발생

## 해결 방법

### 1. GitHub Repository Secrets 설정 (즉시 해결)

GitHub 리포지토리에서 다음 경로로 이동: **Settings → Secrets and variables → Actions**

다음 secrets를 추가:

```
AWS_ACCESS_KEY_ID: AKIA...
AWS_SECRET_ACCESS_KEY: ...
S3_BUCKET_NAME: your-codedeploy-bucket
CODEDEPLOY_APPLICATION_NAME: your-app-name
CODEDEPLOY_DEPLOYMENT_GROUP: your-deployment-group
```

### 2. AWS IAM 사용자 생성

1. AWS Console → IAM → Users → Create User
2. 사용자 이름: `github-actions-deploy`
3. Access key 생성
4. 다음 정책 연결:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3:PutObject",
                "s3:GetObject", 
                "s3:DeleteObject",
                "s3:ListBucket"
            ],
            "Resource": [
                "arn:aws:s3:::your-bucket-name",
                "arn:aws:s3:::your-bucket-name/*"
            ]
        },
        {
            "Effect": "Allow",
            "Action": [
                "codedeploy:CreateDeployment",
                "codedeploy:GetDeployment",
                "codedeploy:GetDeploymentConfig", 
                "codedeploy:RegisterApplicationRevision",
                "codedeploy:ListDeployments",
                "codedeploy:ListDeploymentInstances"
            ],
            "Resource": "*"
        }
    ]
}
```

### 3. 보안 강화: OIDC 설정 (권장)

더 안전한 방법으로 OIDC를 사용하여 임시 자격 증명 활용:

#### AWS IAM Role 생성
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Principal": {
                "Federated": "arn:aws:iam::ACCOUNT-ID:oidc-provider/token.actions.githubusercontent.com"
            },
            "Action": "sts:AssumeRole",
            "Condition": {
                "StringEquals": {
                    "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
                },
                "StringLike": {
                    "token.actions.githubusercontent.com:sub": "repo:YOUR-ORG/YOUR-REPO:*"
                }
            }
        }
    ]
}
```

#### GitHub Actions 워크플로우 수정
```yaml
- name: Configure AWS credentials
  uses: aws-actions/configure-aws-credentials@v4
  with:
    role-to-assume: arn:aws:iam::ACCOUNT-ID:role/github-actions-role
    aws-region: ap-northeast-2
```

### 4. 현재 설정 확인

다음 값들이 실제 AWS 리소스와 일치하는지 확인:
- S3 버킷이 존재하고 권한이 올바른지
- CodeDeploy 애플리케이션과 배포 그룹이 생성되어 있는지
- EC2 인스턴스에 CodeDeploy 에이전트가 설치되어 있는지

## 즉시 해결 방법
1. GitHub Repository Secrets에 AWS 자격 증명 추가
2. GitHub Actions 워크플로우 재실행

## 트러블슈팅

### 오류: "argument --deployment-group-name: expected one argument"

**원인**: `CODEDEPLOY_DEPLOYMENT_GROUP` secret이 비어있거나 설정되지 않음

**해결방법**:
1. AWS Console에서 실제 배포 그룹 이름 확인:
   ```bash
   aws deploy list-deployment-groups --application-name your-app-name
   ```

2. GitHub Repository Secrets에서 `CODEDEPLOY_DEPLOYMENT_GROUP` 수정/추가:
   - 일반적인 이름: `production`, `staging`, `default-deployment-group`

3. Secret 값에 공백이나 특수문자가 없는지 확인

### 오류: "DeploymentConfigDoesNotExistException"

**원인**: 잘못된 배포 구성 이름 사용

**오류 메시지**: 
```
No deployment configuration found for name: CodeDeployDefault.EC2OneAtATime
```

**해결방법**:
1. 올바른 배포 구성 이름 사용:
   - EC2 인스턴스: `CodeDeployDefault.EC2OneAtATimeV2`
   - Auto Scaling: `CodeDeployDefault.EC2AllAtOneTimeV2`

2. 사용 가능한 구성 확인:
   ```bash
   aws deploy list-deployment-configs --region ap-northeast-2
   ```

### 오류: "Credentials could not be loaded"

**원인**: AWS 자격 증명 secrets 누락

**해결방법**: 위의 GitHub Repository Secrets 설정 가이드 참조

이후 보안 강화를 위해 OIDC 설정을 고려해보세요.