// // services/QuickSightTypes.ts - QuickSight 관련 타입 정의

// /**
//  * 📊 QuickSight 대시보드 응답 타입
//  */
// export interface QuickSightDashboardResponse {
//   dashboard: {
//     dashboardId: string;
//     name: string;
//     description?: string;
//     arn: string;
//     createdTime: string;
//     version: {
//       versionNumber: number;
//       status: string;
//     };
//   };
//   dashboardId: string;
//   type: string;
//   requestId: string;
//   embedUrl?: string;
//   embedExpirationTime?: string;
// }

// /**
//  * 📈 QuickSight 센서 타입
//  */
// export type QuickSightSensorType = 'TEMPERATURE' | 'HUMIDITY' | 'CO_CONCENTRATION';

// /**
//  * 🎯 QuickSight 서비스 클래스
//  */
// export class QuickSightService {
//   private static readonly API_BASE_URL = process.env.REACT_APP_API_BASE_URL || '';

//   /**
//    * 🌐 센서 타입별 대시보드 조회 (임베드 URL 포함)
//    */
//   static async getDashboardByType(sensorType: QuickSightSensorType): Promise<QuickSightDashboardResponse> {
//     try {
//       console.log(`🔄 QuickSight 대시보드 조회 시작: ${sensorType}`);

//       const apiKey = process.env.REACT_APP_ADMIN_API_KEY as string;

//       if (!apiKey) throw new Error('REACT_APP_ADMIN_API_KEY 가 설정되지 않았습니다 (.env 확인).');

//       const url = `${this.API_BASE_URL}/quicksight/dashboards/${sensorType}?includeEmbedUrl=true`;

//       const response = await fetch(url, {
//         method: 'GET',
//         headers: { 'x-api-key': apiKey }, // ✅ Mintrend와 완전 동일
//       });


//       if (!response.ok) {
//         throw new Error(`HTTP ${response.status}: ${response.statusText}`);
//       }

//       const data: QuickSightDashboardResponse = await response.json();

//       if (!data.embedUrl || !/\/embed\//.test(data.embedUrl)) {
//         throw new Error('임베드 URL이 아닙니다. 백엔드에서 /embed/ 경로의 URL을 반환해야 합니다.');
//       }

//       console.log('✅ QuickSight 대시보드 조회 성공:', data);
//       return data;
//     } catch (error) {
//       console.error(`❌ QuickSight 대시보드 조회 실패 (${sensorType}):`, error);
//       throw new Error(
//         error instanceof Error
//           ? `QuickSight 대시보드 로드 실패: ${error.message}`
//           : 'QuickSight 대시보드를 가져오는 중 알 수 없는 오류가 발생했습니다.'
//       );
//     }
//   }

//   /**
//    * 📊 QuickSight 응답 유효성 검증
//    */
//   static validateQuickSightResponse(data: QuickSightDashboardResponse): boolean {
//     return (
//       !!data &&
//       typeof data.dashboardId === 'string' &&
//       !!data.embedUrl &&
//       /\/embed\//.test(data.embedUrl)
//     );
//   }

//   /**
//    * 🏷️ 센서 타입 라벨링
//    */
//   static getSensorTypeLabel(sensorType: QuickSightSensorType): string {
//     switch (sensorType) {
//       case 'TEMPERATURE':
//         return '온도';
//       case 'HUMIDITY':
//         return '습도';
//       case 'CO_CONCENTRATION':
//         return '가스';
//       default:
//         return '알 수 없음';
//     }
//   }
// }

// // ✅ QuickSight 센서 옵션 export 추가
// export const QUICKSIGHT_SENSOR_OPTIONS: { value: QuickSightSensorType; label: string }[] = [
//   { value: 'TEMPERATURE', label: QuickSightService.getSensorTypeLabel('TEMPERATURE') },
//   { value: 'HUMIDITY', label: QuickSightService.getSensorTypeLabel('HUMIDITY') },
//   { value: 'CO_CONCENTRATION', label: QuickSightService.getSensorTypeLabel('CO_CONCENTRATION') },
// ];

// services/QuickSightTypes.ts - QuickSight 관련 타입 정의

/**
 * 📊 QuickSight 대시보드 응답 타입
 */
export interface QuickSightDashboardResponse {
  dashboard: {
    dashboardId: string;
    name: string;
    description?: string;
    arn: string;
    createdTime: string;
    version: {
      versionNumber: number;
      status: string;
    };
  };
  dashboardId: string;
  type: string;
  requestId: string;
  embedUrl?: string;
  embedExpirationTime?: string;
}

/**
 * 📈 QuickSight 센서 타입
 */
export type QuickSightSensorType = 'TEMPERATURE' | 'HUMIDITY' | 'CO_CONCENTRATION';

/**
 * 🎯 QuickSight 서비스 클래스
 */
export class QuickSightService {
  private static readonly API_BASE_URL = process.env.REACT_APP_API_BASE_URL || '';

  /**
   * 🌐 센서 타입별 대시보드 조회 (임베드 URL 포함)
   */
  static async getDashboardByType(sensorType: QuickSightSensorType): Promise<QuickSightDashboardResponse> {
    try {
      console.log(`🔄 QuickSight 대시보드 조회 시작: ${sensorType}`);

      const apiKey = process.env.REACT_APP_ADMIN_API_KEY;

      if (!apiKey) {
        throw new Error('API 키가 설정되지 않았습니다. .env 파일을 확인하세요.');
      }

      console.log('🔑 환경변수에서 API 키 로드 성공:', apiKey.substring(0, 8) + '...');

      const url = `${this.API_BASE_URL}/quicksight/dashboards/${sensorType}?includeEmbedUrl=true`;
      
      console.log('🔄 QuickSight API 호출:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          // Authorization 헤더 사용 (Mintrend와 동일한 방식)
          'Authorization': `Bearer ${apiKey}`,
        },
      });

      console.log(`📡 응답 상태: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
      }

      const data: QuickSightDashboardResponse = await response.json();

      if (!data.embedUrl || !/\/embed\//.test(data.embedUrl)) {
        throw new Error('임베드 URL이 아닙니다. 백엔드에서 /embed/ 경로의 URL을 반환해야 합니다.');
      }

      console.log('✅ QuickSight 대시보드 조회 성공:', data);
      return data;
    } catch (error) {
      console.error(`❌ QuickSight 대시보드 조회 실패 (${sensorType}):`, error);
      throw new Error(
        error instanceof Error
          ? `QuickSight 대시보드 로드 실패: ${error.message}`
          : 'QuickSight 대시보드를 가져오는 중 알 수 없는 오류가 발생했습니다.'
      );
    }
  }

  /**
   * 📊 QuickSight 응답 유효성 검증
   */
  static validateQuickSightResponse(data: QuickSightDashboardResponse): boolean {
    return (
      !!data &&
      typeof data.dashboardId === 'string' &&
      !!data.embedUrl &&
      /\/embed\//.test(data.embedUrl)
    );
  }

  /**
   * 🏷️ 센서 타입 라벨링
   */
  static getSensorTypeLabel(sensorType: QuickSightSensorType): string {
    switch (sensorType) {
      case 'TEMPERATURE':
        return '온도';
      case 'HUMIDITY':
        return '습도';
      case 'CO_CONCENTRATION':
        return '가스';
      default:
        return '알 수 없음';
    }
  }
}

// ✅ QuickSight 센서 옵션 export 추가
export const QUICKSIGHT_SENSOR_OPTIONS: { value: QuickSightSensorType; label: string }[] = [
  { value: 'TEMPERATURE', label: QuickSightService.getSensorTypeLabel('TEMPERATURE') },
  { value: 'HUMIDITY', label: QuickSightService.getSensorTypeLabel('HUMIDITY') },
  { value: 'CO_CONCENTRATION', label: QuickSightService.getSensorTypeLabel('CO_CONCENTRATION') },
];