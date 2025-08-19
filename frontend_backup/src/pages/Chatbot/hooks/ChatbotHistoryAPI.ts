// src/services/ChatbotHistoryAPI.ts
// 챗봇 히스토리 API 통신 로직

import {
  ChatbotHistoryResponse,
  ChatbotSessionsResponse,
  HistoryQueryParams,
  SessionsQueryParams
} from './ChatbotHistoryTypes';

// 환경변수 및 기본값 설정 (기존 ChatbotAPI와 완전히 동일한 패턴)
const RAW_BASE =
  (process.env.REACT_APP_API_BASE_URL && process.env.REACT_APP_API_BASE_URL.trim()) || '';

const FALLBACK_ORIGIN =
  (typeof window !== 'undefined' && window.location.origin.replace(/\/$/, '')) || '';

const API_BASE_URL = (RAW_BASE || FALLBACK_ORIGIN).replace(/\/$/, '');

const ADMIN_API_KEY = process.env.REACT_APP_ADMIN_API_KEY || '';
const ADMIN_HEADER_NAME = process.env.REACT_APP_ADMIN_HEADER_NAME || 'x-api-key';
const BEARER_TOKEN = process.env.REACT_APP_BEARER_TOKEN || '';
const WITH_CREDENTIALS =
  String(process.env.REACT_APP_WITH_CREDENTIALS || '').toLowerCase() === 'true';

console.log('🔧 ChatbotHistoryAPI Configuration:', {
  API_BASE_URL,
  ADMIN_API_KEY: ADMIN_API_KEY ? `${ADMIN_API_KEY.substring(0, 8)}...` : 'NOT_SET',
  ADMIN_HEADER_NAME,
  WITH_CREDENTIALS
});

const API_TIMEOUT = 30000; // 히스토리 조회는 30초로 설정

class ChatbotHistoryAPIImpl {
  private baseURL: string;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  // 공통 헤더 빌더 (기존 ChatbotAPI와 완전히 동일한 패턴)
  private buildHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // 관리자 키 자동 첨부
    if (ADMIN_API_KEY) {
      headers[ADMIN_HEADER_NAME] = ADMIN_API_KEY;
    }

    // 세션 ID 자동 첨부 (ChatbotAPI와 동일)
    try {
      const { getSessionId } = require('../../../utils/sessionUtils');
      headers['X-Session-Id'] = getSessionId();
    } catch (error) {
      console.warn('Failed to get session ID:', error);
    }

    // 선택: Bearer 토큰
    if (BEARER_TOKEN) {
      headers['Authorization'] = `Bearer ${BEARER_TOKEN}`;
    }

    console.log('📡 ChatbotHistoryAPI Request headers:', headers);
    return headers;
  }

  // 공통 fetch + 타임아웃 (ChatbotAPI와 동일한 패턴)
  private async fetchWithTimeout(
    input: RequestInfo | URL,
    init?: RequestInit & { timeout?: number }
  ): Promise<Response> {
    const controller = new AbortController();
    const timeout = init?.timeout ?? API_TIMEOUT;
    const id = setTimeout(() => controller.abort(), timeout);

    try {
      const res = await fetch(input, {
        ...init,
        ...(WITH_CREDENTIALS ? { credentials: 'include' as const } : {}),
        signal: controller.signal,
      });
      return res;
    } finally {
      clearTimeout(id);
    }
  }

  /**
   * 특정 세션의 챗봇 히스토리 조회
   * GET /chatbot/history/:sessionId?limit=50
   */
  async getChatbotHistory(
    sessionId: string, 
    params?: HistoryQueryParams
  ): Promise<ChatbotHistoryResponse> {
    try {
      // URL 파라미터 구성 - limit을 숫자로 확실히 처리
      const searchParams = new URLSearchParams();
      if (params?.limit && typeof params.limit === 'number') {
        const limitValue = Math.max(1, Math.min(100, Math.floor(params.limit)));
        searchParams.append('limit', limitValue.toString());
      } else if (params?.limit) {
        // 문자열로 들어온 경우 숫자로 변환
        const limitNum = parseInt(String(params.limit), 10);
        if (!isNaN(limitNum)) {
          const limitValue = Math.max(1, Math.min(100, limitNum));
          searchParams.append('limit', limitValue.toString());
        }
      }
      if (params?.startDate) searchParams.append('startDate', params.startDate);
      if (params?.endDate) searchParams.append('endDate', params.endDate);

      const queryString = searchParams.toString();
      const url = `${this.baseURL}/chatbot/history/${sessionId}${queryString ? '?' + queryString : ''}`;

      console.log('📡 ChatbotHistoryAPI.getChatbotHistory:', { 
        sessionId, 
        url, 
        params,
        headers: this.buildHeaders() 
      });

      const response = await this.fetchWithTimeout(url, {
        method: 'GET',
        headers: this.buildHeaders(),
      });

      console.log('📡 Response status:', response.status, response.statusText);
      console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        let detail = '';
        try {
          const errorData = await response.json();
          detail = errorData?.message || errorData?.error || '';
          console.error('📡 Error response data:', errorData);
        } catch {}
        throw new Error(
          detail || `히스토리 조회 실패: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      console.log('📡 Success response data:', data);
      return data as ChatbotHistoryResponse;

    } catch (error) {
      console.error('ChatbotHistoryAPI.getChatbotHistory error:', error);
      throw error instanceof Error ? error : new Error('히스토리 조회 중 오류가 발생했습니다.');
    }
  }

  /**
   * 챗봇 세션 목록 조회
   * GET /chatbot/sessions
   */
  async getChatbotSessions(params?: SessionsQueryParams): Promise<ChatbotSessionsResponse> {
    try {
      // URL 파라미터 구성 - limit을 숫자로 확실히 처리
      const searchParams = new URLSearchParams();
      if (params?.limit && typeof params.limit === 'number') {
        const limitValue = Math.max(1, Math.min(100, Math.floor(params.limit)));
        searchParams.append('limit', limitValue.toString());
      } else if (params?.limit) {
        // 문자열로 들어온 경우 숫자로 변환
        const limitNum = parseInt(String(params.limit), 10);
        if (!isNaN(limitNum)) {
          const limitValue = Math.max(1, Math.min(100, limitNum));
          searchParams.append('limit', limitValue.toString());
        }
      }
      if (params?.startDate) searchParams.append('startDate', params.startDate);
      if (params?.endDate) searchParams.append('endDate', params.endDate);

      const queryString = searchParams.toString();
      const url = `${this.baseURL}/chatbot/sessions${queryString ? '?' + queryString : ''}`;

      console.log('📡 ChatbotHistoryAPI.getChatbotSessions:', { 
        url, 
        params,
        queryString,
        headers: this.buildHeaders() 
      });

      const response = await this.fetchWithTimeout(url, {
        method: 'GET',
        headers: this.buildHeaders(),
      });

      console.log('📡 Sessions Response status:', response.status, response.statusText);
      console.log('📡 Sessions Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        let detail = '';
        try {
          const errorData = await response.json();
          detail = errorData?.message || errorData?.error || '';
          console.error('📡 Error response data:', errorData);
        } catch {}
        throw new Error(
          detail || `세션 목록 조회 실패: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      console.log('📡 Success response data:', data);
      return data as ChatbotSessionsResponse;

    } catch (error) {
      console.error('ChatbotHistoryAPI.getChatbotSessions error:', error);
      throw error instanceof Error ? error : new Error('세션 목록 조회 중 오류가 발생했습니다.');
    }
  }

  /**
   * 날짜별 챗봇 히스토리 조회
   * GET /chatbot/history/date/:date
   */
  async getChatbotHistoryByDate(
    date: string, 
    limit: number = 50
  ): Promise<ChatbotHistoryResponse[]> {
    try {
      // 날짜 형식 검증
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        throw new Error('날짜는 YYYY-MM-DD 형식으로 입력해주세요.');
      }

      const url = `${this.baseURL}/chatbot/history/date/${date}?limit=${limit}`;

      const response = await this.fetchWithTimeout(url, {
        method: 'GET',
        headers: this.buildHeaders(),
      });

      if (!response.ok) {
        let detail = '';
        try {
          const errorData = await response.json();
          detail = errorData?.message || errorData?.error || '';
        } catch {}
        throw new Error(
          detail || `날짜별 히스토리 조회 실패: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      return data as ChatbotHistoryResponse[];

    } catch (error) {
      console.error('ChatbotHistoryAPI.getChatbotHistoryByDate error:', error);
      throw error instanceof Error ? error : new Error('날짜별 히스토리 조회 중 오류가 발생했습니다.');
    }
  }
}

// 싱글톤 인스턴스 생성
export const ChatbotHistoryAPI = new ChatbotHistoryAPIImpl();
export default ChatbotHistoryAPI;