// services/MintrendTypes.ts - Mintrend API 관련 타입 정의
/**
 * 📡 Mintrend API 응답 타입
 */
export interface MintrendResponse {
  filename: string;
  data: {
    timestamp: string;
    mintemp: number;
    minhum: number;
    mingas: number;
    mintemp_status?: string;
    minhum_status?: string;
    mingas_status?: string;
  };
}

/**
 * 🔄 API 응답 상태 타입
 */
export interface MintrendApiResponse {
  success: boolean;
  data?: MintrendResponse;
  error?: string;
}

/**
 * 📊 Mintrend 서비스 클래스
 */
export class MintrendService {
  private static readonly API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001';
  private static readonly MINTREND_ENDPOINT = '/s3/file/last/mintrend';

  /**
   * 🌐 최신 Mintrend 데이터 가져오기
   */
  static async getLatestMintrendData(): Promise<MintrendResponse> {
    try {
      console.log('🔄 Mintrend API 호출 시작...');
      
      const response = await fetch(`${this.API_BASE_URL}${this.MINTREND_ENDPOINT}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: MintrendResponse = await response.json();
      
      console.log('✅ Mintrend 데이터 수신 성공:', data);
      return data;
    } catch (error) {
      console.error('❌ Mintrend API 호출 실패:', error);
      throw new Error(
        error instanceof Error 
          ? `Mintrend 데이터 로드 실패: ${error.message}`
          : 'Mintrend 데이터를 가져오는 중 알 수 없는 오류가 발생했습니다.'
      );
    }
  }

  /**
   * 🌡️ 온도 상태 판정
   */
  static getTemperatureStatus(temperature: number): string {
    if (temperature < 15) return 'COLD';
    if (temperature < 20) return 'COOL';
    if (temperature < 28) return 'GOOD';
    if (temperature < 35) return 'WARM';
    return 'HOT';
  }

  /**
   * 💧 습도 상태 판정
   */
  static getHumidityStatus(humidity: number): string {
    if (humidity < 30) return 'DRY';
    if (humidity < 40) return 'LOW';
    if (humidity < 70) return 'GOOD';
    if (humidity < 80) return 'HIGH';
    return 'WET';
  }

  /**
   * 💨 가스 상태 판정
   */
  static getGasStatus(gas: number): string {
    if (gas < 400) return 'EXCELLENT';
    if (gas < 800) return 'GOOD';
    if (gas < 1500) return 'MODERATE';
    if (gas < 3000) return 'POOR';
    return 'DANGEROUS';
  }

  /**
   * 📊 상태별 색상 클래스 반환
   */
  static getStatusColorClass(status: string): string {
    switch (status.toUpperCase()) {
      case 'EXCELLENT':
      case 'GOOD':
        return 'status-good';
      case 'MODERATE':
      case 'COOL':
      case 'WARM':
        return 'status-moderate';
      case 'POOR':
      case 'HIGH':
      case 'LOW':
        return 'status-poor';
      case 'DANGEROUS':
      case 'HOT':
      case 'COLD':
        return 'status-danger';
      default:
        return 'status-default';
    }
  }

  /**
   * 🔄 데이터 유효성 검증
   */
  static validateMintrendData(data: any): data is MintrendResponse {
    return (
      data &&
      typeof data === 'object' &&
      typeof data.filename === 'string' &&
      data.data &&
      typeof data.data === 'object' &&
      typeof data.data.timestamp === 'string' &&
      typeof data.data.mintemp === 'number' &&
      typeof data.data.minhum === 'number' &&
      typeof data.data.mingas === 'number'
    );
  }
}