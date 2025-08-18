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

export class MintrendService {
  // CRA 환경변수 (접두사 REACT_APP_)
  private static readonly API_BASE_URL =
    process.env.REACT_APP_API_BASE_URL || '';
  private static readonly MINTREND_ENDPOINT = '/s3/file/last/mintrend';

  /**
   * 최신 mintrend 데이터 조회
   * - x-api-key 헤더만 전송 (Content-Type 등 불필요한 헤더 제거)
   */
  static async getLatestMintrendData(): Promise<MintrendResponse> {
    const url = `${this.API_BASE_URL}${this.MINTREND_ENDPOINT}`;

    const apiKey = process.env.REACT_APP_ADMIN_API_KEY;
    if (!apiKey) {
      throw new Error('REACT_APP_ADMIN_API_KEY 가 설정되지 않았습니다 (.env 확인).');
    }

    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'x-api-key': apiKey, // ✅ 이 헤더만 보냄
      },
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }

    const data: MintrendResponse = await res.json();
    return data;
  }

  // (필요 시 상태 계산 유틸 유지)
  static getTemperatureStatus(temperature: number): string {
    if (temperature < 15) return 'COLD';
    if (temperature < 20) return 'COOL';
    if (temperature < 28) return 'GOOD';
    if (temperature < 35) return 'WARM';
    return 'HOT';
  }

  static getHumidityStatus(humidity: number): string {
    if (humidity < 30) return 'DRY';
    if (humidity < 40) return 'LOW';
    if (humidity < 70) return 'GOOD';
    if (humidity < 80) return 'HIGH';
    return 'WET';
  }

  static getGasStatus(gas: number): string {
    if (gas < 400) return 'EXCELLENT';
    if (gas < 800) return 'GOOD';
    if (gas < 1500) return 'MODERATE';
    if (gas < 3000) return 'POOR';
    return 'DANGEROUS';
  }
}
