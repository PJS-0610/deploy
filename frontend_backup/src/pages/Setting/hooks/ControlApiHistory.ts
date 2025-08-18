import { HistoryResponseDto } from "../../../services/ControlApiTypes";

export class ControlHistoryService {
  private static readonly API_BASE_URL =
  process.env.REACT_APP_CONTROL_API_BASE_URL
  || process.env.REACT_APP_API_BASE_URL
  || (window.location.hostname === 'localhost'
        ? ''
        : '');  // ✅ 기본값 설정

  // 끝에 / 가 여러 개 붙어있으면 제거 (중복 경로 방지)
private static readonly NORMALIZED_BASE_URL = ControlHistoryService.API_BASE_URL.replace(/\/+$/, '');

  private static readonly CONTROL_ENDPOINT = "/control";  // ✅ 수정됨 (/control/log → /control)
  private static readonly API_KEY =
    process.env.REACT_APP_ADMIN_API_KEY || '';  // ✅ 기본값 설정

  private static getHeaders(): HeadersInit {
    return { "X-API-Key": this.API_KEY };
  }

  private static validateApiKey(): void {
    if (!this.API_KEY) {
      throw new Error("REACT_APP_ADMIN_API_KEY가 설정되지 않았습니다 (.env 확인).");
    }
  }

  /** 제어 로그 히스토리 조회 */
  static async fetchControlHistory( 
    limit: number = 50,
    sensorType?: string,
    date?: string
  ): Promise<HistoryResponseDto> {
    this.validateApiKey();

    const params = new URLSearchParams();
    if (limit) params.append("limit", limit.toString());
    if (sensorType) params.append("sensor_type", sensorType);
    if (date) params.append("date", date);

    // ✅ 올바른 엔드포인트: /control/history
    const url = `${this.NORMALIZED_BASE_URL}${this.CONTROL_ENDPOINT}/history${
      params.toString() ? `?${params.toString()}` : ""
    }`;

    console.log('🔍 API 요청:', url);
    console.log('🔑 API Key:', this.API_KEY);

    const response = await fetch(url, {
      method: "GET",
      headers: this.getHeaders(),
    });

    console.log('📡 응답 상태:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API 오류:', errorText);
      throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
    }

    const data = await response.json() as HistoryResponseDto;
    console.log('✅ 성공 응답:', data);
    return data;
  }

  /** 연결 테스트 */
  static async testConnection(): Promise<boolean> {
    try {
      console.log('🔗 연결 테스트 시작...');
      console.log('🌐 Base URL:', this.API_BASE_URL);
      console.log('🔑 API Key:', this.API_KEY ? '설정됨' : '누락');
      
      const data = await this.fetchControlHistory(1);
      const success = data && data.success === true;
      console.log(success ? '✅ 연결 테스트 성공' : '❌ 연결 테스트 실패');
      return success;
    } catch (error) {
      console.error('❌ 연결 테스트 중 오류:', error);
      return false;
    }
  }
}
