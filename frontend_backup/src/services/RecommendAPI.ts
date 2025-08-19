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
    return this.postWithApiKey('/recommend/optimal', request);
  }

  /**
   * 🩺 추천 시스템 헬스체크
   * 
   * API 엔드포인트: GET /recommend/health
   * Python 환경 및 추천봇 모듈의 동작 상태를 확인합니다.
   * 
   * @returns Promise<ApiResponse<RecommendHealthResponse>> - 헬스체크 결과
   */
  async checkRecommendHealth(): Promise<ApiResponse<RecommendHealthResponse>> {
    return apiService.get<RecommendHealthResponse>('/recommend/health');
  }

  /**
   * 🔑 API Key가 필요한 POST 요청 (내부 메서드)
   * 
   * 추천 API는 X-API-Key 헤더가 필요하므로 별도 처리
   * 
   * @param endpoint - API 엔드포인트
   * @param data - 요청 데이터
   * @returns Promise<ApiResponse<T>> - 응답 데이터
   */
  private async postWithApiKey<T>(
    endpoint: string, 
    data: any
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001'}${endpoint}`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': 'admin-0816-key-0610-aws2', // API 키 설정
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
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
 *   console.log(response.data?.answer);
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