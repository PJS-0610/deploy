# AWS2-GIOT 애플리케이션 배포 가이드

## 📋 배포 전 체크리스트

### 1. AWS 리소스 준비
- [ ] EC2 인스턴스 생성 (Amazon Linux 2023)
- [ ] IAM 역할 생성 및 연결
- [ ] 보안 그룹 설정 (80, 22 포트 오픈)
- [ ] S3 버킷 생성 (배포 패키지용)
- [ ] CodeDeploy 애플리케이션 생성
- [ ] CodeDeploy 배포 그룹 생성

### 2. GitHub 설정
- [ ] Repository 생성 및 소스코드 업로드
- [ ] GitHub Secrets 설정
- [ ] GitHub Actions 워크플로우 활성화

### 3. EC2 인스턴스 설정
- [ ] CodeDeploy Agent 설치
- [ ] IAM 역할 연결
- [ ] 기본 패키지 설치

---

## 🔧 상세 설정 가이드

### 1. EC2 인스턴스 설정

#### 1.1 인스턴스 생성
```bash
# AMI: Amazon Linux 2023
# Instance Type: t3.medium 이상 권장
# Key Pair: 생성 또는 기존 사용
# Security Group: HTTP(80), HTTPS(443), SSH(22) 허용
```

#### 1.2 IAM 역할 생성
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::YOUR-DEPLOYMENT-BUCKET/*",
        "arn:aws:s3:::YOUR-DEPLOYMENT-BUCKET"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "codedeploy:*"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "cloudwatch:PutMetricData",
        "ec2:DescribeVolumes",
        "ec2:DescribeTags",
        "logs:PutLogEvents",
        "logs:CreateLogGroup",
        "logs:CreateLogStream"
      ],
      "Resource": "*"
    }
  ]
}
```

#### 1.3 CodeDeploy Agent 설치
```bash
# EC2에 SSH 접속 후 실행
sudo dnf update -y
sudo dnf install -y ruby wget
cd /home/ec2-user
wget https://aws-codedeploy-ap-northeast-2.s3.ap-northeast-2.amazonaws.com/latest/install
chmod +x ./install
sudo ./install auto
sudo systemctl start codedeploy-agent
sudo systemctl enable codedeploy-agent

# 상태 확인
sudo systemctl status codedeploy-agent
```

### 2. AWS CodeDeploy 설정

#### 2.1 애플리케이션 생성
```bash
aws deploy create-application \
  --application-name aws2-giot-app \
  --compute-platform EC2/OnPremises
```

#### 2.2 서비스 역할 생성
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "codedeploy.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
```

정책: `AWSCodeDeployRole` 연결

#### 2.3 배포 그룹 생성
```bash
aws deploy create-deployment-group \
  --application-name aws2-giot-app \
  --deployment-group-name production \
  --service-role-arn arn:aws:iam::YOUR-ACCOUNT:role/CodeDeployServiceRole \
  --ec2-tag-filters Key=Name,Value=aws2-giot-production,Type=KEY_AND_VALUE
```

### 3. S3 버킷 생성
```bash
aws s3 mb s3://aws2-giot-deployment-bucket
```

### 4. GitHub Secrets 설정

Repository > Settings > Secrets and variables > Actions에서 설정:

| Secret Name | 설명 | 예시 값 |
|------------|-----|---------|
| `AWS_ACCESS_KEY_ID` | AWS 액세스 키 | `AKIA...` |
| `AWS_SECRET_ACCESS_KEY` | AWS 비밀 키 | `xxxxx...` |
| `S3_BUCKET_NAME` | S3 버킷명 | `aws2-giot-deployment-bucket` |
| `CODEDEPLOY_APPLICATION_NAME` | CodeDeploy 앱명 | `aws2-giot-app` |
| `CODEDEPLOY_DEPLOYMENT_GROUP` | 배포 그룹명 | `production` |

**참고**: AWS_REGION과 NODE_VERSION은 더 이상 Secrets에서 설정하지 않습니다. 이 값들은 워크플로우 파일의 환경변수 섹션에서 직접 관리됩니다.

### 5. 환경 변수 관리

이 프로젝트는 보안을 위해 `.env` 파일을 GitHub에 포함하지 않습니다. 대신 다음과 같이 처리됩니다:

#### 자동 환경 변수 생성
배포 시 `install_dependencies.sh` 스크립트가 다음을 자동으로 수행합니다:

1. **EC2 메타데이터에서 정보 수집**:
   - AWS Region
   - AWS Account ID  
   - Instance ID
   - Public IP

2. **백엔드 .env 파일 자동 생성**:
   ```env
   NODE_ENV=production
   PORT=3001
   AWS_REGION=ap-northeast-2
   AWS_ACCOUNT_ID=123456789012
   S3_BUCKET_NAME=your-bucket-name
   API_URL=http://YOUR-EC2-IP:3001
   FRONTEND_URL=http://YOUR-EC2-IP
   ```

3. **프론트엔드 .env 파일 자동 생성**:
   ```env
   REACT_APP_API_URL=http://YOUR-EC2-IP
   REACT_APP_API_BASE_URL=/api
   REACT_APP_AWS_REGION=ap-northeast-2
   REACT_APP_ENABLE_CHATBOT=true
   ```

#### 커스텀 환경 변수 추가
추가 환경 변수가 필요한 경우:

1. **배포 스크립트 수정**: `scripts/install_dependencies.sh`에서 환경 변수 생성 부분을 수정
2. **AWS Parameter Store 사용**: 민감한 정보는 Parameter Store에 저장하고 스크립트에서 가져오기
3. **AWS Secrets Manager 사용**: API 키나 DB 비밀번호 등은 Secrets Manager 사용

#### .env.example 파일
개발자를 위해 `.env.example` 파일들이 제공됩니다:
- `aws2-api/.env.example`: 백엔드 환경 변수 템플릿
- `frontend_backup/.env.example`: 프론트엔드 환경 변수 템플릿

---

## 🚀 배포 실행

### 자동 배포 (GitHub Actions)
```bash
git add .
git commit -m "Deploy to production"
git push origin main
```

### 수동 배포 (AWS CLI)
```bash
# 1. 배포 패키지 생성
zip -r aws2-giot-app.zip . -x "node_modules/*" "**/.git/*" "**/dist/*" "**/build/*"

# 2. S3에 업로드
aws s3 cp aws2-giot-app.zip s3://your-deployment-bucket/

# 3. CodeDeploy 배포 생성
aws deploy create-deployment \
  --application-name aws2-giot-app \
  --deployment-group-name production \
  --s3-location bucket=your-deployment-bucket,key=aws2-giot-app.zip,bundleType=zip
```

---

## 🔍 트러블슈팅

### 일반적인 문제들

#### 1. CodeDeploy Agent 실행되지 않는 경우
```bash
# 로그 확인
sudo tail -f /var/log/aws/codedeploy-agent/codedeploy-agent.log

# 재시작
sudo systemctl restart codedeploy-agent
```

#### 2. IAM 권한 문제
```bash
# EC2 메타데이터 확인
curl http://169.254.169.254/latest/meta-data/iam/security-credentials/

# 역할이 연결되어 있는지 확인
curl http://169.254.169.254/latest/meta-data/iam/info
```

#### 3. 빌드 실패
```bash
# Node.js 버전 확인
node --version  # 20.x 이상이어야 함

# 수동 빌드 테스트
cd /opt/aws2-giot-app/aws2-api
npm install
npm run build
```

#### 4. 포트 충돌
```bash
# 사용 중인 포트 확인
sudo ss -tlnp | grep -E ':80|:3001'

# 프로세스 종료
sudo pkill -f "node.*main.js"
pm2 delete all
```

#### 5. Nginx 설정 문제
```bash
# 설정 문법 검사
sudo nginx -t

# 에러 로그 확인
sudo tail -f /var/log/nginx/error.log

# 설정 재로드
sudo systemctl reload nginx
```

### 로그 파일 위치
```
CodeDeploy Agent: /var/log/aws/codedeploy-agent/codedeploy-agent.log
애플리케이션: /var/log/aws2-giot-app/backend.log
Nginx: /var/log/nginx/aws2-giot-app-error.log
PM2: /home/ec2-user/.pm2/logs/
```

---

## 📊 모니터링

### 헬스체크
```bash
# 백엔드 API
curl http://your-ec2-ip:3001/health

# 프론트엔드
curl http://your-ec2-ip/

# API 프록시
curl http://your-ec2-ip/api/
```

### PM2 모니터링
```bash
pm2 list           # 프로세스 목록
pm2 monit          # 실시간 모니터링
pm2 logs           # 로그 확인
pm2 info aws2-giot-backend  # 상세 정보
```

### 시스템 리소스
```bash
htop              # CPU/메모리 사용량
df -h             # 디스크 사용량
free -h           # 메모리 상태
```

---

## 🔄 롤백

### 이전 배포로 롤백
```bash
aws deploy stop-deployment --deployment-id YOUR-DEPLOYMENT-ID

aws deploy create-deployment \
  --application-name aws2-giot-app \
  --deployment-group-name production \
  --s3-location bucket=your-deployment-bucket,key=previous-version.zip,bundleType=zip
```

### 수동 롤백
```bash
# 이전 백업으로 복구
sudo cp -r /opt/backup/aws2-giot-app-TIMESTAMP /opt/aws2-giot-app

# 서비스 재시작
pm2 restart ecosystem.config.js
sudo systemctl restart nginx
```

---

## 📞 지원

배포 관련 문제가 발생하면:

1. **GitHub Actions 로그** 확인
2. **AWS CodeDeploy 콘솔**에서 배포 상태 확인
3. **EC2 인스턴스**에서 서비스 로그 확인
4. 이 문서의 트러블슈팅 섹션 참조

긴급 상황 시 수동으로 서비스 재시작:
```bash
pm2 restart all
sudo systemctl restart nginx
```