import { HistoryResponseDto } from "../Services/ControlApiTypes";

export class ControlHistoryService {
  private static readonly API_BASE_URL =
  process.env.REACT_APP_CONTROL_API_BASE_URL
  || process.env.REACT_APP_API_BASE_URL
  || (window.location.hostname === 'localhost'
        ? 'http://localhost:3001'  // 로컬 개발용 - 3001로 수정
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

// ControlApiHistory.ts - 429 오류에 매우 보수적으로 대응하는 재시도 로직
private static async requestWithRetry(
  url: string,
  init: RequestInit,
  maxRetries = 5, // ✅ 429 오류로 인해 재시도 줄임 8→5
  baseDelayMs = 2000 // ✅ 기본 지연 시간 대폭 증가 800→2000ms
) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 30000); // ✅ 타임아웃 20→30초로 증가
    
    try {
      // CORS 오류 방지를 위한 헤더 추가
      const enhancedInit = {
        ...init,
        signal: controller.signal,
        cache: 'no-store' as RequestCache,
        mode: 'cors' as RequestMode,
        credentials: 'omit' as RequestCredentials,
        headers: {
          ...init.headers,
          'Content-Type': 'application/json',
        }
      };

      const res = await fetch(url, enhancedInit);
      clearTimeout(t);

      // ✅ 429/503/502/504 오류 처리 - 매우 보수적인 대기 시간
      if (res.status === 429 || res.status === 503 || res.status === 502 || res.status === 504) {
        if (attempt === maxRetries) {
          return res;
        }
        
        const jitter = Math.floor(Math.random() * 2000); // ✅ 지터 대폭 증가 1000→2000ms
        let delay = baseDelayMs * (3 ** attempt) + jitter; // ✅ 지수를 3으로 변경 (더 빠르게 증가)
        
        // 429 오류는 특별히 더 오래 대기
        if (res.status === 429) {
          delay = Math.min(delay * 2, 60000); // ✅ 429는 2배 더 오래, 최대 60초
        } else {
          delay = Math.min(delay, 30000); // ✅ 다른 오류는 최대 30초
        }
        
        await this.sleep(delay);
        continue;
      }
      
      return res;
    } catch (e: any) {
      clearTimeout(t);
      
      // CORS 오류 특별 처리
      const isCorsError = e.message?.includes('CORS') || 
                         e.message?.includes('Access-Control-Allow-Origin') ||
                         e.message?.includes('preflight');
      
      const isNetworkError = e.message?.includes('Failed to fetch') || 
                            e.message?.includes('ERR_FAILED') ||
                            e.name === 'TypeError';

      if (attempt === maxRetries) {
        throw e;
      }
      
      const jitter = Math.floor(Math.random() * 1000);
      let delay = Math.min(baseDelayMs * (2 ** attempt) + jitter, 15000);
      
      // CORS 오류나 네트워크 오류는 더 긴 대기
      if (isCorsError || isNetworkError) {
        delay = Math.min(delay * 1.5, 20000); // 1.5배 더 오래 대기, 최대 20초
      }
      
      const errorType = isCorsError ? 'CORS' : 
                       isNetworkError ? '네트워크' : '알 수 없는';
      
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
  days: number = 30, // ✅ 기본값을 90→30일로 줄임
  sensorType?: string,
  limitPerDay: number = 100 // ✅ 300→100으로 줄여서 부하 감소
) {
  const all: any[] = [];
  let total = 0;
  let consecutiveErrors = 0;


  for (let i = 0; i < days; i++) {
    const dateStr = this.getDateStrKST(-i);
    const params = new URLSearchParams();
    params.append('limit', String(limitPerDay));
    if (sensorType && sensorType !== 'all') params.append('sensor_type', sensorType);
    params.append('date', dateStr);
    params.append('_', String(Date.now())); // 캐시 우회

    const url = `${this.NORMALIZED_BASE_URL}${this.CONTROL_ENDPOINT}/history?${params.toString()}`;

    try {
      const res = await this.requestWithRetry(
        url,
        { method: 'GET', headers: this.getHeaders(), cache: 'no-store' },
        10,  // ✅ 재시도 횟수 대폭 증가 3→10
        600  // ✅ 초기 백오프 800→600ms로 조정
      );

      if (res.status === 429) {
        consecutiveErrors++;
        
        // ✅ 연속 429 오류가 많으면 매우 긴 휴식
        if (consecutiveErrors >= 2) {
          await this.sleep(10000); // 3초 → 10초
        } else {
          await this.sleep(3000); // ✅ 1초 → 3초로 증가
        }
        continue;
      }

      const data = await res.json();
      const logs = Array.isArray(data?.logs) ? data.logs : [];
      all.push(...logs);
      total += (data?.totalCount ?? logs.length ?? 0);
      consecutiveErrors = 0; // ✅ 성공하면 연속 오류 카운트 리셋


    } catch (error) {
      consecutiveErrors++;
      
      // ✅ 연속 오류 시 더 긴 휴식
      if (consecutiveErrors >= 5) {
        break;
      }
    }

    // ✅ 각 일자 요청 사이 간격을 매우 길게 (800→3000ms)
    await this.sleep(3000);
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

    try {
      // ✅ retry 로직을 사용하도록 변경
      const res = await this.requestWithRetry(
        url,
        { method: 'GET', headers: this.getHeaders(), cache: 'no-store' },
        8, // ✅ 단일 요청도 재시도 횟수 증가 2→8
        600
      );
      

      if (res.status === 429) {
        await this.sleep(1000);
        continue;
      }

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`HTTP ${res.status}: ${res.statusText} - ${errorText}`);
      }

      const data = await res.json();
      last = data;

      const count = data?.totalCount ?? data?.logs?.length ?? 0;
      if (count > 0) return data; // ✅ 데이터 있으면 즉시 반환
      
    } catch (error) {
      // 에러가 발생해도 다음 날짜 시도
      continue;
    }

    // ✅ 날짜 간 요청 사이 간격 대폭 증가
    await this.sleep(2000); // 500ms → 2000ms
  }
  return last ?? { success: true, totalCount: 0, logs: [] }; // 둘 다 비면 빈 결과
}



  /** 연결 테스트 */
  static async testConnection(): Promise<boolean> {
    try {
      const data = await this.fetchControlHistory(1);
      const success = data && data.success === true;
      return success;
    } catch (error) {
      return false;
    }
  }
}
