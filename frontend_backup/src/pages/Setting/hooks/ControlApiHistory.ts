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

  // ⬇️ 클래스 내부에 추가 (예: export class ControlApiHistory { ... })
private static sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// ControlApiHistory.ts
private static async requestWithRetry(
  url: string,
  init: RequestInit,
  maxRetries = 5,
  baseDelayMs = 500
) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 15000);
    try {
      // ✅ 여기서 재귀 호출 금지! 실제 fetch 수행
      const res = await fetch(url, { ...init, signal: controller.signal, cache: 'no-store' });
      clearTimeout(t);

      if (res.status === 429 || res.status === 503) {
        if (attempt === maxRetries) return res;
        const jitter = Math.floor(Math.random() * 250);
        const delay = baseDelayMs * 2 ** attempt + jitter;
        await this.sleep(delay);
        continue;
      }
      return res;
    } catch (e) {
      clearTimeout(t);
      if (attempt === maxRetries) throw e;
      const jitter = Math.floor(Math.random() * 250);
      const delay = baseDelayMs * 2 ** attempt + jitter;
      await this.sleep(delay);
    }
  }
  throw new Error('requestWithRetry fell through');
}

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

// ControlApiHistory.ts

// ⬇️ 기존 fetchControlHistoryAll(...) 전체를 아래로 교체
static async fetchControlHistoryAll(
  days: number = 90,
  sensorType?: string,
  limitPerDay: number = 300 // 권장: 300부터 시작 (429 지속 시 더 낮추기)
) {
  const all: any[] = [];
  let total = 0;

  for (let i = 0; i < days; i++) {
    const dateStr = this.getDateStrKST(-i); // 프로젝트에 이미 있는 유틸 가정
    const params = new URLSearchParams();
    params.append('limit', String(limitPerDay));
    if (sensorType && sensorType !== 'all') params.append('sensor_type', sensorType);
    params.append('date', dateStr);
    params.append('_', String(Date.now())); // 캐시 우회

    const url = `${this.NORMALIZED_BASE_URL}${this.CONTROL_ENDPOINT}/history?${params.toString()}`;

    const res = await this.requestWithRetry(
      url,
      { method: 'GET', headers: this.getHeaders(), cache: 'no-store' },
      5,   // 재시도 횟수
      500  // 초기 백오프(ms)
    );

    if (res.status === 429) {
      console.warn(`⚠️ 429 on date=${dateStr}, skip this day`);
      await this.sleep(400); // 다음 요청 전 쉬어주기
      continue;
    }

    const data = await res.json();
    const logs = Array.isArray(data?.logs) ? data.logs : [];
    all.push(...logs);
    total += (data?.totalCount ?? logs.length ?? 0);

    // 각 일자 요청 사이 간격(레이트리밋 회피)
    await this.sleep(300); // 0.3s (429 계속이면 500~800ms로)
  }

  all.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  return { success: true, totalCount: total, logs: all };
}



static async fetchControlHistory(
  limit: number = 10,
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
