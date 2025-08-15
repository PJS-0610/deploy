#!/bin/bash

# EC2 IAM 역할 권한 확인 스크립트
echo "=== EC2 IAM 권한 확인 시작 $(date) ==="

# 로그 파일 설정
LOG_FILE="/var/log/codedeploy-iam-check.log"
exec > >(tee -a "$LOG_FILE") 2>&1

# 현재 실행 컨텍스트
echo "실행 사용자: $(whoami)"
echo "AWS 기본 리전: ${AWS_DEFAULT_REGION:-'설정되지 않음'}"

# AWS 자격증명 정보
echo "=== AWS 자격증명 정보 ==="
if aws sts get-caller-identity 2>/dev/null; then
    echo "✅ AWS 자격증명 유효"
else
    echo "❌ AWS 자격증명 실패"
    echo "EC2 인스턴스에 IAM 역할이 연결되어 있는지 확인 필요"
fi

# EC2 인스턴스 메타데이터
echo "=== EC2 메타데이터 접근 ==="
INSTANCE_ID=$(curl -s --max-time 5 http://169.254.169.254/latest/meta-data/instance-id 2>/dev/null || echo "메타데이터 접근 실패")
echo "인스턴스 ID: $INSTANCE_ID"

IAM_ROLE=$(curl -s --max-time 5 http://169.254.169.254/latest/meta-data/iam/security-credentials/ 2>/dev/null || echo "IAM 역할 없음")
echo "IAM 역할: $IAM_ROLE"

# S3 접근 권한 확인
echo "=== S3 접근 권한 확인 ==="
if aws s3 ls >/dev/null 2>&1; then
    echo "✅ S3 기본 접근 가능"
else
    echo "❌ S3 접근 실패"
fi

# SSM Parameter Store 접근 권한 확인
echo "=== SSM Parameter Store 권한 확인 ==="
aws ssm describe-parameters --region ap-northeast-2 --max-items 1 >/dev/null 2>&1 && echo "✅ SSM 기본 접근 가능" || echo "❌ SSM 접근 실패"

# CodeDeploy 관련 권한 확인
echo "=== CodeDeploy 서비스 권한 확인 ==="
aws deploy list-applications --region ap-northeast-2 >/dev/null 2>&1 && echo "✅ CodeDeploy 접근 가능" || echo "❌ CodeDeploy 접근 실패"

# 실제 필요한 SSM 파라미터들 확인
echo "=== 필수 SSM 파라미터 확인 ==="
PARAMETERS=(
    "/aws2-giot-app/database/host"
    "/aws2-giot-app/database/port"
    "/aws2-giot-app/database/name"
    "/aws2-giot-app/database/user"
    "/aws2-giot-app/database/password"
    "/aws2-giot-app/jwt/secret"
    "/aws2-giot-app/aws/region"
    "/aws2-giot-app/frontend/backend-url"
)

for param in "${PARAMETERS[@]}"; do
    if aws ssm get-parameter --name "$param" --region ap-northeast-2 >/dev/null 2>&1; then
        echo "✅ $param"
    else
        echo "❌ $param (누락 또는 권한 없음)"
    fi
done

# 권한 요약
echo "=== 권한 요약 ==="
echo "이 EC2 인스턴스에 필요한 최소 IAM 정책:"
echo "1. AmazonSSMReadOnlyAccess (SSM Parameter Store 읽기)"
echo "2. AmazonS3ReadOnlyAccess (배포 패키지 다운로드)"
echo "3. 사용자 정의 정책:"
cat << 'EOF'
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "ssm:GetParameter",
                "ssm:GetParameters",
                "ssm:GetParametersByPath"
            ],
            "Resource": "arn:aws:ssm:ap-northeast-2:*:parameter/aws2-giot-app/*"
        }
    ]
}
EOF

echo "=== IAM 권한 확인 완료 $(date) ==="