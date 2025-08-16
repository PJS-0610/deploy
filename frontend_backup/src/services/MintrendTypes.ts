// // services/MintrendService.ts
// /**
//  * 📡 Mintrend API 응답 타입
//  */
// export interface MintrendResponse {
//   filename: string;
//   data: {
//     timestamp: string;
//     mintemp: number;
//     minhum: number;
//     mingas: number;
//     mintemp_status?: string;
//     minhum_status?: string;
//     mingas_status?: string;
//   };
// }

// /**
//  * 📊 Mintrend 서비스 클래스
//  */
// export class MintrendService {
//   // 🔧 환경변수 우선, 없으면 로컬 기본값
//   private static readonly API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001';
//   private static readonly MINTREND_ENDPOINT = '/s3/file/last/mintrend';

//   /**
//    * 🌐 최신 Mintrend 데이터 가져오기
//    */
//   static async getLatestMintrendData(): Promise<MintrendResponse> {
//     const fullUrl = `${this.API_BASE_URL}${this.MINTREND_ENDPOINT}`;
    
//     try {
//       console.log('🔄 Mintrend API 호출:', fullUrl);
      
//       const response = await fetch(fullUrl, {
//         method: 'GET',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//       });

//       if (!response.ok) {
//         throw new Error(`HTTP ${response.status}: ${response.statusText}`);
//       }

//       const data: MintrendResponse = await response.json();
      
//       console.log('✅ Mintrend 데이터 수신 성공:', data);
//       return data;
      
//     } catch (error) {
//       console.error('❌ Mintrend API 호출 실패:', error);
//       console.log('🔧 API URL 확인:', fullUrl);
      
//       // 🚨 에러 시 더미 데이터 대신 에러를 다시 던짐 (실제 문제 파악용)
//       throw new Error(
//         error instanceof Error 
//           ? `Mintrend API 호출 실패: ${error.message} (URL: ${fullUrl})`
//           : 'Mintrend 데이터를 가져오는 중 알 수 없는 오류가 발생했습니다.'
//       );
//     }
//   }

//   /**
//    * 🌡️ 온도 상태 판정
//    */
//   static getTemperatureStatus(temperature: number): string {
//     if (temperature < 15) return 'COLD';
//     if (temperature < 20) return 'COOL';
//     if (temperature < 28) return 'GOOD';
//     if (temperature < 35) return 'WARM';
//     return 'HOT';
//   }

//   /**
//    * 💧 습도 상태 판정
//    */
//   static getHumidityStatus(humidity: number): string {
//     if (humidity < 30) return 'DRY';
//     if (humidity < 40) return 'LOW';
//     if (humidity < 70) return 'GOOD';
//     if (humidity < 80) return 'HIGH';
//     return 'WET';
//   }

//   /**
//    * 💨 가스 상태 판정
//    */
//   static getGasStatus(gas: number): string {
//     if (gas < 400) return 'EXCELLENT';
//     if (gas < 800) return 'GOOD';
//     if (gas < 1500) return 'MODERATE';
//     if (gas < 3000) return 'POOR';
//     return 'DANGEROUS';
//   }

//   /**
//    * 📊 상태별 색상 클래스 반환
//    */
//   static getStatusColorClass(status: string): string {
//     switch (status.toUpperCase()) {
//       case 'EXCELLENT':
//       case 'GOOD':
//         return 'status-good';
//       case 'MODERATE':
//       case 'COOL':
//       case 'WARM':
//         return 'status-moderate';
//       case 'POOR':
//       case 'HIGH':
//       case 'LOW':
//         return 'status-poor';
//       case 'DANGEROUS':
//       case 'HOT':
//       case 'COLD':
//         return 'status-danger';
//       default:
//         return 'status-default';
//     }
//   }

//   /**
//    * 🔄 데이터 유효성 검증
//    */
//   static validateMintrendData(data: any): data is MintrendResponse {
//     return (
//       data &&
//       typeof data === 'object' &&
//       typeof data.filename === 'string' &&
//       data.data &&
//       typeof data.data === 'object' &&
//       typeof data.data.timestamp === 'string' &&
//       typeof data.data.mintemp === 'number' &&
//       typeof data.data.minhum === 'number' &&
//       typeof data.data.mingas === 'number'
//     );
//   }
// }

// services/MintrendService.ts
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
 * 📊 Mintrend 서비스 클래스
 */
export class MintrendService {
  // 🔧 환경변수 우선, 없으면 로컬 기본값
  private static readonly API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001';
  private static readonly MINTREND_ENDPOINT = '/s3/file/last/mintrend';

  /**
   * 🌐 최신 Mintrend 데이터 가져오기
   */
  static async getLatestMintrendData(): Promise<MintrendResponse> {
    const fullUrl = `${this.API_BASE_URL}${this.MINTREND_ENDPOINT}`;
    
    try {
      console.log('🔄 Mintrend API 호출:', fullUrl);
      
      const response = await fetch(fullUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: MintrendResponse = await response.json();
      
      // 🔍 상세한 데이터 디버깅 - JSON.stringify 사용
      console.log('✅ Mintrend 데이터 수신 성공 (RAW):', JSON.stringify(data, null, 2));
      console.log('📊 데이터 구조 분석:');
      console.log('  - filename:', data.filename);
      console.log('  - data.timestamp:', data.data?.timestamp);
      console.log('  - data.mintemp:', data.data?.mintemp);
      console.log('  - data.minhum:', data.data?.minhum);
      console.log('  - data.mingas:', data.data?.mingas);
      
      // 🔍 데이터 타입 확인
      console.log('🔍 데이터 타입 체크:');
      console.log('  - typeof data:', typeof data);
      console.log('  - typeof data.data:', typeof data.data);
      console.log('  - data.data keys:', data.data ? Object.keys(data.data) : 'data.data is null/undefined');
      
      // 🚨 데이터 유효성 검증
      if (!this.validateMintrendData(data)) {
        console.warn('⚠️ 받은 데이터가 예상 형식과 다릅니다:', data);
        console.log('예상 형식: { filename: string, data: { timestamp, mintemp, minhum, mingas } }');
      }
      
      return data;
      
    } catch (error) {
      console.error('❌ Mintrend API 호출 실패:', error);
      console.log('🔧 API URL 확인:', fullUrl);
      
      // 🚨 에러 시 더미 데이터 대신 에러를 다시 던짐 (실제 문제 파악용)
      throw new Error(
        error instanceof Error 
          ? `Mintrend API 호출 실패: ${error.message} (URL: ${fullUrl})`
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
    const isValid = (
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
    
    if (!isValid) {
      console.error('🚨 Mintrend 데이터 유효성 검증 실패:');
      console.error('  - 받은 데이터:', JSON.stringify(data, null, 2));
      console.error('  - 필요한 필드들:');
      console.error('    • filename (string):', typeof data?.filename);
      console.error('    • data (object):', typeof data?.data);
      console.error('    • data.timestamp (string):', typeof data?.data?.timestamp);
      console.error('    • data.mintemp (number):', typeof data?.data?.mintemp);
      console.error('    • data.minhum (number):', typeof data?.data?.minhum);
      console.error('    • data.mingas (number):', typeof data?.data?.mingas);
    }
    
    return isValid;
  }
}