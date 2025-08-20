// 📋 Mintrend API 관련 타입 정의
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

export interface MintrendApiResponse {
  success: boolean;
  data?: MintrendResponse;
  error?: string;
}

export class MintrendService {
  private static readonly API_BASE_URL = process.env.REACT_APP_API_BASE_URL || '';
  private static readonly MINTREND_ENDPOINT = '/s3/file/last/mintrend';

  static async getLatestMintrendData(): Promise<MintrendResponse> {
    const fullUrl = `${this.API_BASE_URL}${this.MINTREND_ENDPOINT}`;
    
    try {
      console.log('🔄 Mintrend API 호출:', fullUrl);
      
      const apiKey = process.env.REACT_APP_ADMIN_API_KEY;
      if (!apiKey) {
        throw new Error('API 키가 설정되지 않았습니다. .env 파일을 확인하세요.');
      }

      console.log('🔑 환경변수에서 API 키 로드 성공:', apiKey.substring(0, 8) + '...');
      
      const response = await fetch(fullUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          // 방법 2A: Authorization 헤더 사용 (일반적으로 CORS에서 허용됨)
          'Authorization': `Bearer ${apiKey}`,
          
          // 방법 2B: 또는 x-api-key 대신 다른 표준 헤더 사용
          // 'X-API-KEY': apiKey,  // 대문자로 시도
        },
      });

      console.log(`📡 응답 상태: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
      }

      const data: MintrendResponse = await response.json();
      console.log('✅ Mintrend 데이터 수신 성공:', data);
      
      return data;
      
    } catch (error) {
      console.error('❌ Mintrend API 호출 실패:', error);
      throw error;
    }
  }

  // 기존 메서드들은 그대로 유지
// 1) 온도
static getTemperatureStatus(t: number): string {
  if (t < 22 || t > 28) return 'WARNING';         // 🚨
  if (t >= 24 && t <= 27) return 'GOOD';          // ✅
  return 'NORMAL';                                 // ⚠️
}

// 2) 습도
static getHumidityStatus(h: number): string {
  if (h < 40 || h > 80) return 'WARNING';
  if (h >= 50 && h <= 70) return 'GOOD';
  return 'NORMAL';
}

// 3) 가스(CO2)
static getGasStatus(g: number): string {
  if (g > 2500) return 'WARNING';
  if (g <= 2000) return 'GOOD';
  return 'NORMAL';
}

// 4) 색상 매핑(세 가지로만)
// MintrendService.ts
static getStatusColorClass(status: string): string {
  switch (status.toUpperCase()) {
    case 'GOOD':    return 'status-good';    // 초록
    case 'NORMAL':  return 'status-normal';  // 회색
    case 'WARNING': return 'status-warning'; // 빨강
    default:        return 'status-normal';
  }
}

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