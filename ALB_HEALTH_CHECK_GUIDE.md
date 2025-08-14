# ALB Health Check 설정 가이드

## 🎯 개요
Application Load Balancer(ALB)에서 EC2 인스턴스의 health check가 실패하는 문제를 해결하기 위한 설정 가이드입니다.

## ⚠️ 중요: 개선된 배포 스크립트 사용
**이 문제는 개선된 배포 스크립트로 자동 해결됩니다!** 새로운 `install_dependencies.sh`는 다음을 자동으로 처리합니다:
- 기존 Nginx 설정 분석 및 백업
- default_server 충돌 자동 해결
- ALB 호환 설정 자동 생성
- 종합적인 테스트 및 검증

## 🚀 빠른 시작

### 자동 진단 및 테스트
```bash
# EC2에서 실행
cd /opt/aws2-giot-app
chmod +x scripts/test_health_check.sh
./scripts/test_health_check.sh
```

이 스크립트는 모든 health check 관련 문제를 자동으로 진단하고 해결 방법을 제시합니다.

## 🔧 개선된 기능들

### 1. 자동 충돌 감지 및 해결
- **문제**: 기존 nginx default_server와 충돌
- **해결**: 자동으로 기존 설정 분석 및 우선순위 조정
- **백업**: 모든 기존 설정을 타임스탬프와 함께 자동 백업

### 2. 향상된 Nginx 설정
- **다중 호스트명 지원**: localhost, private IP, public IP, ALB DNS
- **최적화된 헬스체크**: 5초 타임아웃, 캐시 방지, 전용 로그
- **상세한 모니터링**: 응답 시간, 에러 추적, 헤더 정보

### 3. 종합적인 테스트 시스템
- **8단계 검증**: 서비스 상태부터 ALB 시뮬레이션까지
- **자동 진단**: 문제 발생 시 원인과 해결책 자동 제시
- **실시간 로그**: 모든 테스트 과정을 상세히 기록

### 4. 환경 인식 배포
- **EC2 메타데이터 활용**: IP, 인스턴스 정보 자동 수집
- **Parameter Store 연동**: 도메인 정보 자동 적용
- **환경별 최적화**: 개발/운영 환경에 맞는 설정 자동 생성

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

### 1. 자동 진단 사용 (권장)

```bash
# 종합적인 문제 진단
cd /opt/aws2-giot-app
./scripts/test_health_check.sh

# 결과에 따른 자동 해결 방법 제시
```

### 2. 수동 문제 해결

#### Health Check가 여전히 실패하는 경우

```bash
# 1. 기본 서비스 상태 확인
pm2 list
sudo systemctl status nginx
sudo ss -tlnp | grep -E ":80|:3001"

# 2. Nginx 설정 확인
sudo nginx -t
sudo nginx -T | grep -A10 -B5 "server {"

# 3. 직접 테스트
curl -v http://localhost/health
curl -v http://private-ip/health

# 4. 로그 확인
sudo tail -20 /var/log/nginx/error.log
pm2 logs aws2-giot-backend --lines 10
```

#### 일반적인 문제와 해결책

| 문제 | 원인 | 해결책 |
|------|------|--------|
| 404 Not Found | Nginx 설정 충돌 | `sudo systemctl restart nginx` |
| Connection Refused | 백엔드 서비스 중단 | `pm2 restart aws2-giot-backend` |
| Timeout | 응답 지연 | 백엔드 로그 확인, 리소스 점검 |
| 502 Bad Gateway | 백엔드 연결 실패 | 포트 3001 확인, 방화벽 점검 |

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