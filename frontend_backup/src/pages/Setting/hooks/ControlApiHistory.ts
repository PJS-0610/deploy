import { HistoryResponseDto } from "../../../services/ControlApiTypes";

export class ControlHistoryService {
  private static readonly API_BASE_URL =
  process.env.REACT_APP_CONTROL_API_BASE_URL
  || process.env.REACT_APP_API_BASE_URL
  || (window.location.hostname === 'localhost'
        ? 'http://localhost:3000'  // 로컬 개발용
        : 'https://aws2aws2.com');  // 실제 AWS API URL

  // 끝에 / 가 여러 개 붙어있으면 제거 (중복 경로 방지)
private static readonly NORMALIZED_BASE_URL = ControlHistoryService.API_BASE_URL.replace(/\/+$/, '');

  private static readonly CONTROL_ENDPOINT = "/control";
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

 // ControlApiHistory.ts (또는 실제 호출 서비스 클래스 내부)

private static getDateStrKST(offsetDays = 0): string {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const kst = new Date(utc + 9 * 60 * 60000 + offsetDays * 86400000);
  const y = kst.getFullYear();
  const m = String(kst.getMonth() + 1).padStart(2, '0');
  const d = String(kst.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

static async fetchControlHistory(
  limit: number = 50,
  sensorType?: string,
  date?: string
) {
  const tryDates = date ? [date] : [this.getDateStrKST(0), this.getDateStrKST(-1)];
  let last: any = null;

  for (const d of tryDates) {
    const params = new URLSearchParams();
    params.append('limit', String(limit));
    if (sensorType && sensorType !== 'all') params.append('sensor_type', sensorType);
    params.append('date', d);
    params.append('_', String(Date.now())); // 캐시 우회

    const url = `${this.NORMALIZED_BASE_URL}${this.CONTROL_ENDPOINT}/history?${params.toString()}`;
    console.log('🔍 API 요청:', url);

    const res = await fetch(url, { method: 'GET', headers: this.getHeaders(), cache: 'no-store' });
    const data = await res.json();
    last = data;

    const count = data?.totalCount ?? data?.logs?.length ?? 0;
    console.log(`📅 date=${d} → totalCount=${count}`);
    if (count > 0) return data;         // ✅ 데이터 있으면 즉시 반환
  }
  return last ?? { success: true, totalCount: 0, logs: [] }; // 둘 다 비면 빈 결과
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
