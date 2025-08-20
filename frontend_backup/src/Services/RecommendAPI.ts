/**
 * ═══════════════════════════════════════════════════════════════
 * 🎯 Recommend API Service - AI 추천 기능 API 통신 서비스
 * ═══════════════════════════════════════════════════════════════
 * 
 * 주요 기능:
 * - 외부 환경 조건 기반 최적 환경 추천 API 호출
 * - 추천 시스템 상태 확인
 * - 타입 안전한 API 호출 제공
 * 
 * API 엔드포인트:
 * - POST /recommend/optimal: 최적 환경 추천
 * - GET /recommend/health: 추천 시스템 헬스체크
 */

import { apiService, type ApiResponse } from './apiService';
import getApiUrl from '../Config/env';

// API 기본 설정
const API_KEY = 'admin-0816-key-0610-aws2';
const REQUEST_TIMEOUT = 10000; // 10초
const MAX_RETRIES = 3;

/**
 * 🌡️ 최적 환경 추천 요청 데이터 타입
 */
export interface OptimalRecommendRequest {
  /** 외부 온도 (°C, -50~60) - 선택사항 */
  external_temperature?: number;
  /** 외부 습도 (%, 0~100) - 선택사항 */
  external_humidity?: number;
  /** 외부 공기질 (CO2 ppm, 0~10000) - 선택사항 */
  external_air_quality?: number;
  /** 추가 요청 사항 - 선택사항 */
  additional_request?: string;
}

/**
 * 📋 최적 환경 추천 응답 데이터 타입
 */
export interface OptimalRecommendResponse {
  /** 추천 결과 답변 */
  answer: string;
  /** 처리 시간 (초) */
  processing_time: number;
  /** 입력받은 외부 조건 */
  external_conditions: {
    temperature?: number;
    humidity?: number;
    air_quality?: number;
  };
  /** 생성된 쿼리 */
  generated_query: string;
  /** 파싱된 추천 값들 */
  parsed_recommendations?: {
    optimal_temperature?: number;
    optimal_humidity?: number;
    optimal_co2?: number;
    current_temperature?: number;
    current_humidity?: number;
    current_co2?: number;
  };
}

/**
 * 🩺 추천 시스템 헬스체크 응답 타입
 */
export interface RecommendHealthResponse {
  /** 전체 상태 */
  status: 'healthy' | 'error';
  /** 파이썬 설치 여부 */
  python_available: boolean;
  /** 추천봇 모듈 동작 여부 */
  recommend_module_available: boolean;
  /** 에러 메시지 (상태가 error인 경우) */
  error?: string;
}

/**
 * 🔧 LLM 응답 파싱 유틸리티 함수
 */
const parseRecommendationAnswer = (answer: string) => {
  
  const result: {
    optimal_temperature?: number;
    optimal_humidity?: number;
    optimal_co2?: number;
    current_temperature?: number;
    current_humidity?: number;
    current_co2?: number;
  } = {};

  // 현재 값 파싱 (더 넓은 패턴 매칭)
  const currentTempMatch = answer.match(/현재\s*실내온도\s*([\d.]+)도/);
  if (currentTempMatch) {
    result.current_temperature = parseFloat(currentTempMatch[1]);
  }

  const currentHumidityMatch = answer.match(/실내습도\s*([\d.]+)%/);
  if (currentHumidityMatch) {
    result.current_humidity = parseFloat(currentHumidityMatch[1]);
  }

  const currentCo2Match = answer.match(/실내CO2\s*([\d.]+)ppm/);
  if (currentCo2Match) {
    result.current_co2 = parseFloat(currentCo2Match[1]);
  }

  // 최적 값 파싱 (더 넓은 패턴 매칭)
  const optimalTempMatch = answer.match(/최적온도는?\s*([\d.]+)도/);
  if (optimalTempMatch) {
    result.optimal_temperature = parseFloat(optimalTempMatch[1]);
  }

  const optimalHumidityMatch = answer.match(/최적습도는?\s*([\d.]+)%/);
  if (optimalHumidityMatch) {
    result.optimal_humidity = parseFloat(optimalHumidityMatch[1]);
  }

  const optimalCo2Match = answer.match(/최적CO2는?\s*([\d.]+)ppm/);
  if (optimalCo2Match) {
    result.optimal_co2 = parseFloat(optimalCo2Match[1]);
  }

  return result;
};

/**
 * 🔧 Recommend API 서비스 클래스
 */
class RecommendAPIService {
  /**
   * 🎯 최적 환경 추천 API 호출
   * 
   * API 엔드포인트: POST /recommend/optimal
   * 외부 환경 조건을 입력받아 AI가 최적의 실내 환경을 추천합니다.
   * 
   * @param request - 추천 요청 데이터
   * @returns Promise<ApiResponse<OptimalRecommendResponse>> - 추천 결과
   */
  async getOptimalRecommendation(
    request: OptimalRecommendRequest
  ): Promise<ApiResponse<OptimalRecommendResponse>> {
    // API Key 헤더 추가가 필요한 경우를 대비한 커스텀 요청
    const response = await this.postWithApiKey<OptimalRecommendResponse>('/recommend/optimal', request);
    
    // 성공한 경우 LLM 응답을 파싱하여 추가
    if (response.success && response.data) {
      response.data.parsed_recommendations = parseRecommendationAnswer(response.data.answer);
    }
    
    return response;
  }

  /**
   * 🩺 추천 시스템 헬스체크
   * 
   * API 엔드포인트: GET /recommend/health
   * Python 환경 및 추천봇 모듈의 동작 상태를 확인합니다.
   * mintrendServices와 동일한 패턴으로 구현
   * 
   * @returns Promise<ApiResponse<RecommendHealthResponse>> - 헬스체크 결과
   */
  async checkRecommendHealth(): Promise<ApiResponse<RecommendHealthResponse>> {
    try {
      const url = getApiUrl('/recommend/health');
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'X-API-Key': API_KEY,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        
        return {
          success: false,
          error: this.getErrorMessage(response.status, errorText)
        };
      }

      const result = await response.json();
      
      return {
        success: true,
        data: result
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * 🔑 API Key가 필요한 POST 요청 (내부 메서드)
   * 
   * mintrendServices API 패턴을 따라 구현:
   * - 적절한 에러 처리
   * - 타임아웃 설정
   * - 재시도 로직
   * - 표준화된 응답 형식
   * 
   * @param endpoint - API 엔드포인트
   * @param data - 요청 데이터
   * @param retryCount - 현재 재시도 횟수
   * @returns Promise<ApiResponse<T>> - 응답 데이터
   */
  private async postWithApiKey<T>(
    endpoint: string, 
    data: any,
    retryCount: number = 0
  ): Promise<ApiResponse<T>> {
    try {
      const url = getApiUrl(endpoint);
      
      // AbortController로 타임아웃 설정
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
      
      const response = await fetch(url, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-API-Key': API_KEY,
        },
        body: JSON.stringify(data),
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        
        // 500번대 에러는 재시도
        if (response.status >= 500 && retryCount < MAX_RETRIES) {
          await this.delay(1000 * (retryCount + 1)); // 점진적 지연
          return this.postWithApiKey(endpoint, data, retryCount + 1);
        }
        
        // 400번대 에러는 즉시 실패
        const errorMessage = this.getErrorMessage(response.status, errorText);
        throw new Error(errorMessage);
      }

      const result = await response.json();
      
      return {
        success: true,
        data: result
      };

    } catch (error) {
      // 네트워크 에러나 타임아웃은 재시도
      if (this.isRetryableError(error) && retryCount < MAX_RETRIES) {
        await this.delay(1000 * (retryCount + 1));
        return this.postWithApiKey(endpoint, data, retryCount + 1);
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * 🕒 지연 유틸리티 함수
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 🔍 재시도 가능한 에러인지 확인
   */
  private isRetryableError(error: any): boolean {
    if (error?.name === 'AbortError') return true; // 타임아웃
    if (error?.message?.includes('fetch')) return true; // 네트워크 에러
    if (error?.message?.includes('ECONNRESET')) return true; // 연결 리셋
    return false;
  }

  /**
   * 📋 HTTP 상태 코드별 에러 메시지 생성
   */
  private getErrorMessage(status: number, body: string): string {
    switch (status) {
      case 400:
        return `잘못된 요청: ${body || '요청 데이터를 확인해주세요'}`;
      case 401:
        return 'API 키가 유효하지 않습니다';
      case 403:
        return 'API 접근 권한이 없습니다';
      case 404:
        return '요청한 API 엔드포인트를 찾을 수 없습니다';
      case 429:
        return 'API 요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요';
      case 500:
        return '서버 내부 오류가 발생했습니다';
      case 502:
        return '서버 게이트웨이 오류입니다';
      case 503:
        return '서버가 일시적으로 사용 불가능합니다';
      default:
        return `HTTP ${status} 오류: ${body || 'Unknown error'}`;
    }
  }

  /**
   * 🔗 추천 시스템 연결 테스트
   * 
   * 헬스체크를 통해 추천 시스템과의 연결 상태를 확인합니다.
   * 
   * @returns Promise<boolean> - 연결 성공 여부
   */
  async testRecommendConnection(): Promise<boolean> {
    try {
      const response = await this.checkRecommendHealth();
      return response.success && response.data?.status === 'healthy';
    } catch {
      return false;
    }
  }
}

/**
 * 🎯 싱글톤 인스턴스 생성
 */
export const recommendAPIService = new RecommendAPIService();

/**
 * 🚀 추천 API 편의 함수 모음
 * 
 * 사용 예시:
 * ```typescript
 * import { recommendApi } from './services/RecommendAPI';
 * 
 * const response = await recommendApi.getOptimal({
 *   external_temperature: 30,
 *   external_humidity: 70,
 *   external_air_quality: 1400
 * });
 * 
 * if (response.success) {
 *   // 응답 데이터 사용
 * }
 * ```
 */
export const recommendApi = {
  getOptimal: (request: OptimalRecommendRequest) => 
    recommendAPIService.getOptimalRecommendation(request),
  health: () => 
    recommendAPIService.checkRecommendHealth(),
  testConnection: () => 
    recommendAPIService.testRecommendConnection()
};

export default recommendAPIService;