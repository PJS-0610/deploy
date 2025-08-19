// 환경 추천 API DTO 정의

import { IsNumber, IsOptional, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * 환경 추천 요청 DTO
 */
export class RecommendQueryDto {
  /**
   * 외부 온도 (°C) - 선택사항
   * @example 30
   */
  @IsOptional()
  @IsNumber({}, { message: '외부 온도는 숫자여야 합니다.' })
  @Type(() => Number)
  @Min(-50, { message: '외부 온도는 -50도 이상이어야 합니다.' })
  @Max(60, { message: '외부 온도는 60도 이하여야 합니다.' })
  external_temperature?: number;

  /**
   * 외부 습도 (%) - 선택사항
   * @example 70
   */
  @IsOptional()
  @IsNumber({}, { message: '외부 습도는 숫자여야 합니다.' })
  @Type(() => Number)
  @Min(0, { message: '외부 습도는 0% 이상이어야 합니다.' })
  @Max(100, { message: '외부 습도는 100% 이하여야 합니다.' })
  external_humidity?: number;

  /**
   * 외부 공기질 (CO2 ppm) - 선택사항
   * @example 1400
   */
  @IsOptional()
  @IsNumber({}, { message: '외부 공기질은 숫자여야 합니다.' })
  @Type(() => Number)
  @Min(0, { message: '외부 공기질은 0ppm 이상이어야 합니다.' })
  @Max(10000, { message: '외부 공기질은 10000ppm 이하여야 합니다.' })
  external_air_quality?: number;

  /**
   * 추가 요청 사항 (선택사항)
   * @example "최적의 실내 환경을 추천해주세요"
   */
  @IsOptional()
  additional_request?: string;
}

/**
 * 환경 추천 응답 DTO
 */
export class RecommendResponseDto {
  /**
   * 추천 결과 답변
   * @example "현재 실내온도 27도(외부 30도), 실내습도 58%(외부 70%), 실내CO2 720ppm 기준으로 최적온도는 24도, 최적습도는 48%, 최적CO2는 320ppm입니다"
   */
  answer: string;

  /**
   * 처리 시간 (초)
   * @example 2.34
   */
  processing_time: number;

  /**
   * 입력받은 외부 조건
   */
  external_conditions: {
    temperature?: number;
    humidity?: number;
    air_quality?: number;
  };

  /**
   * 생성된 쿼리
   * @example "외부온도는 30도, 외부 습도는 70, 외부 공기질은 1400이야."
   */
  generated_query: string;
}

/**
 * 환경 추천 헬스체크 응답 DTO
 */
export class RecommendHealthDto {
  /**
   * 전체 상태
   * @example "healthy"
   */
  status: 'healthy' | 'error';

  /**
   * 파이썬 설치 여부
   * @example true
   */
  python_available: boolean;

  /**
   * 추천봇 모듈 동작 여부
   * @example true
   */
  recommend_module_available: boolean;

  /**
   * 에러 메시지 (상태가 error인 경우)
   * @example "Python is not available"
   */
  error?: string;
}