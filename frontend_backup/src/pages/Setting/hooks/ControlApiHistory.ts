import { HistoryResponseDto } from "../../../services/ControlApiTypes";

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

// ControlApiHistory.ts - 429 오류에 더 보수적으로 대응
private static async requestWithRetry(
  url: string,
  init: RequestInit,
  maxRetries = 3, // ✅ 기본 재시도 횟수 줄임 5→3
  baseDelayMs = 1000 // ✅ 기본 지연 시간 증가 500→1000ms
) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 20000); // ✅ 타임아웃 15→20초로 증가
    
    try {
      const res = await fetch(url, { ...init, signal: controller.signal, cache: 'no-store' });
      clearTimeout(t);

      // ✅ 429/503 오류 처리 - 더 긴 대기 시간
      if (res.status === 429 || res.status === 503) {
        if (attempt === maxRetries) {
          console.warn(`⚠️ 최대 재시도 횟수 도달 (${maxRetries}), 429/503 응답 반환`);
          return res;
        }
        
        const jitter = Math.floor(Math.random() * 500); // ✅ 지터 증가 250→500ms
        const delay = baseDelayMs * (2 ** attempt) + jitter;
        
        console.warn(`⚠️ ${res.status} 오류, ${delay/1000}초 후 재시도 (${attempt + 1}/${maxRetries})`);
        await this.sleep(delay);
        continue;
      }
      
      return res;
    } catch (e) {
      clearTimeout(t);
      if (attempt === maxRetries) {
        console.error(`❌ 최대 재시도 횟수 도달, 오류 발생:`, e);
        throw e;
      }
      
      const jitter = Math.floor(Math.random() * 500);
      const delay = baseDelayMs * (2 ** attempt) + jitter;
      
      console.warn(`⚠️ 네트워크 오류, ${delay/1000}초 후 재시도 (${attempt + 1}/${maxRetries}):`, e);
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

  console.log(`🔄 Control History All 요청 시작: ${days}일, limit=${limitPerDay}`);

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
        3,   // ✅ 재시도 횟수 5→3으로 줄임
        800  // ✅ 초기 백오프 500→800ms로 증가
      );

      if (res.status === 429) {
        console.warn(`⚠️ 429 on date=${dateStr}, skip this day`);
        consecutiveErrors++;
        
        // ✅ 연속 429 오류가 많으면 더 긴 휴식
        if (consecutiveErrors >= 3) {
          console.warn(`⚠️ 연속 429 오류 ${consecutiveErrors}회, 3초 휴식`);
          await this.sleep(3000);
        } else {
          await this.sleep(1000); // ✅ 400→1000ms로 증가
        }
        continue;
      }

      const data = await res.json();
      const logs = Array.isArray(data?.logs) ? data.logs : [];
      all.push(...logs);
      total += (data?.totalCount ?? logs.length ?? 0);
      consecutiveErrors = 0; // ✅ 성공하면 연속 오류 카운트 리셋

      console.log(`📅 ${dateStr}: ${logs.length}개 로그 수집 완료`);

    } catch (error) {
      console.warn(`❌ ${dateStr} 요청 실패:`, error);
      consecutiveErrors++;
      
      // ✅ 연속 오류 시 더 긴 휴식
      if (consecutiveErrors >= 5) {
        console.warn(`❌ 연속 오류 ${consecutiveErrors}회, 조기 종료`);
        break;
      }
    }

    // ✅ 각 일자 요청 사이 간격을 더 길게 (300→800ms)
    await this.sleep(800);
  }

  all.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  console.log(`✅ Control History All 완료: 총 ${all.length}개 로그 수집`);
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
    console.log('🔍 Control History API 요청:', {
      url,
      headers: this.getHeaders(),
      params: Object.fromEntries(params.entries())
    });

    try {
      // ✅ retry 로직을 사용하도록 변경
      const res = await this.requestWithRetry(
        url,
        { method: 'GET', headers: this.getHeaders(), cache: 'no-store' },
        2, // 단일 요청이므로 재시도는 적게
        800
      );
      
      console.log('🔍 Control History API 응답:', {
        status: res.status,
        statusText: res.statusText,
        ok: res.ok
      });

      if (res.status === 429) {
        console.warn(`⚠️ 429 on date=${d}, skip and try next date`);
        await this.sleep(1000);
        continue;
      }

      if (!res.ok) {
        const errorText = await res.text();
        console.error('🔍 Control History API Error:', errorText);
        throw new Error(`HTTP ${res.status}: ${res.statusText} - ${errorText}`);
      }

      const data = await res.json();
      console.log('🔍 Control History API Success:', data);
      last = data;

      const count = data?.totalCount ?? data?.logs?.length ?? 0;
      console.log(`📅 date=${d} → totalCount=${count}`);
      if (count > 0) return data; // ✅ 데이터 있으면 즉시 반환
      
    } catch (error) {
      console.warn(`❌ ${d} 요청 실패:`, error);
      // 에러가 발생해도 다음 날짜 시도
      continue;
    }

    // ✅ 날짜 간 요청 사이 간격
    await this.sleep(500);
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
