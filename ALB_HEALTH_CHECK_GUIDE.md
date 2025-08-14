# ALB Health Check 설정 가이드

## 🎯 개요
Application Load Balancer(ALB)에서 EC2 인스턴스의 health check가 실패하는 문제를 해결하기 위한 설정 가이드입니다.

## 🔧 코드 변경 사항

### 1. Health Check 엔드포인트 개선
- **기존**: `/healthz` 엔드포인트만 제공
- **개선**: `/health` 엔드포인트 추가 (ALB 표준 경로)
- **응답 개선**: 타임스탬프, 서비스명, 버전 정보 포함

### 2. CORS 설정 환경변수화
- **기존**: 하드코딩된 도메인 (`aws2aws2.com`)
- **개선**: 환경변수 기반 동적 도메인 설정
- **지원**: Route 53 도메인, 서브도메인, HTTP/HTTPS

## ⚙️ AWS ALB 설정 방법

### 1. Target Group Health Check 설정

```bash
# AWS CLI로 Target Group Health Check 수정
aws elbv2 modify-target-group \
    --target-group-arn arn:aws:elasticloadbalancing:region:account:targetgroup/your-tg/id \
    --health-check-protocol HTTP \
    --health-check-port 3001 \
    --health-check-path /health \
    --health-check-interval-seconds 30 \
    --health-check-timeout-seconds 5 \
    --healthy-threshold-count 2 \
    --unhealthy-threshold-count 2 \
    --matcher HttpCode=200
```

### 2. AWS 콘솔에서 설정 (추천)

1. **EC2 콘솔** > **Load Balancers** > **Target Groups** 선택
2. 해당 Target Group 선택 > **Health checks** 탭
3. **Edit** 버튼 클릭 후 다음과 같이 설정:

```
Protocol: HTTP
Port: 3001
Health check path: /health
Advanced health check settings:
  - Health check interval: 30 seconds
  - Health check timeout: 5 seconds  
  - Healthy threshold: 2
  - Unhealthy threshold: 2
  - Success codes: 200
```

## 🔒 보안 그룹 설정

### ALB 보안 그룹
```bash
# ALB에서 EC2로 Health Check 트래픽 허용
aws ec2 authorize-security-group-ingress \
    --group-id sg-alb-security-group-id \
    --protocol tcp \
    --port 3001 \
    --source-group sg-ec2-security-group-id
```

### EC2 보안 그룹
```bash
# EC2에서 ALB로부터의 Health Check 트래픽 허용
aws ec2 authorize-security-group-ingress \
    --group-id sg-ec2-security-group-id \
    --protocol tcp \
    --port 3001 \
    --source-group sg-alb-security-group-id
```

## 🌐 환경변수 설정

### Parameter Store에 추가할 환경변수

```bash
# 도메인 설정
aws ssm put-parameter \
    --name "/aws2-giot-app/DOMAIN_NAME" \
    --value "your-actual-domain.com" \
    --type "String"

# 추가 도메인 설정 (선택사항)
aws ssm put-parameter \
    --name "/aws2-giot-app/ADDITIONAL_DOMAINS" \
    --value "api.your-domain.com,admin.your-domain.com" \
    --type "String"
```

### .env 파일에서 설정 (로컬 테스트용)

```bash
# .env 파일 생성
cp .env.example .env

# 실제 도메인으로 수정
DOMAIN_NAME=your-actual-domain.com
ADDITIONAL_DOMAINS=api.your-domain.com,admin.your-domain.com
```

## 🚀 배포 후 확인 사항

### 1. Health Check 엔드포인트 테스트

```bash
# EC2 인스턴스에서 직접 테스트
curl -X GET http://localhost:3001/health

# 예상 응답:
{
  "ok": true,
  "timestamp": "2024-01-15T10:30:45.123Z",
  "service": "aws2-giot-backend",
  "version": "1.0.0"
}

# 기존 엔드포인트도 테스트
curl -X GET http://localhost:3001/healthz
```

### 2. ALB를 통한 Health Check 테스트

```bash
# ALB DNS 이름을 통한 테스트
curl -X GET http://your-alb-dns-name.elb.amazonaws.com/health

# Route 53 도메인을 통한 테스트
curl -X GET http://your-domain.com/health
```

### 3. Target Group Health 상태 확인

```bash
# AWS CLI로 Target Health 확인
aws elbv2 describe-target-health \
    --target-group-arn arn:aws:elasticloadbalancing:region:account:targetgroup/your-tg/id
```

## 🛠️ 문제 해결 (Troubleshooting)

### 1. Health Check가 여전히 실패하는 경우

```bash
# 1. EC2에서 애플리케이션이 실행 중인지 확인
pm2 list
pm2 logs aws2-giot-backend

# 2. 포트가 열려있는지 확인
sudo ss -tlnp | grep :3001

# 3. 보안 그룹 규칙 확인
aws ec2 describe-security-groups --group-ids sg-your-ec2-security-group

# 4. Target Group에 인스턴스가 등록되어 있는지 확인
aws elbv2 describe-target-health --target-group-arn your-target-group-arn
```

### 2. CORS 오류가 발생하는 경우

```bash
# 환경변수가 제대로 설정되었는지 확인
pm2 show aws2-giot-backend

# 브라우저에서 네트워크 탭 확인:
# - OPTIONS 요청이 200으로 응답하는지
# - Access-Control-Allow-Origin 헤더가 올바른지
```

### 3. Route 53 도메인 연결 문제

```bash
# DNS 레코드 확인
nslookup your-domain.com

# ALB DNS 이름과 일치하는지 확인
aws elbv2 describe-load-balancers --names your-alb-name
```

## 📊 모니터링

### CloudWatch 메트릭 확인

- `TargetResponseTime`: Target의 응답 시간
- `HealthyHostCount`: 정상 상태의 Target 수
- `UnHealthyHostCount`: 비정상 상태의 Target 수
- `HTTPCode_Target_2XX_Count`: 성공적인 응답 수

### ALB 로그 활성화 (권장)

```bash
# S3 버킷 생성 후 ALB 로그 활성화
aws elbv2 modify-load-balancer-attributes \
    --load-balancer-arn your-alb-arn \
    --attributes Key=access_logs.s3.enabled,Value=true \
                 Key=access_logs.s3.bucket,Value=your-log-bucket
```

## 🎉 배포 완료 후 최종 확인

```bash
# 모든 서비스가 정상 작동하는지 확인
curl -X GET https://your-domain.com/health
curl -X GET https://your-domain.com/api/health

# PM2 프로세스 상태 확인
pm2 list
pm2 monit

# Target Group Health 최종 확인
aws elbv2 describe-target-health --target-group-arn your-target-group-arn
```

## 📝 주의사항

1. **보안 그룹**: ALB와 EC2 간 3001 포트 통신 허용 필수
2. **Health Check Path**: ALB Target Group 설정에서 `/health` 경로 사용
3. **환경변수**: Parameter Store를 통한 도메인 설정 관리 권장
4. **SSL/TLS**: HTTPS 사용 시 ALB에 적절한 SSL 인증서 설정 필요
5. **로그**: CloudWatch와 ALB 액세스 로그를 통한 모니터링 권장