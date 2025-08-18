// // // src/services/ChatbotAPI.ts

// // import { ChatbotAPIType } from './ChatbotTypes';

// // // API 기본 설정
// // const API_BASE_URL = process.env.REACT_APP_API_URL;
// // const API_TIMEOUT = 60000; // 60초 타임아웃

// // // 백엔드 API 응답 타입
// // interface ChatbotResponseDto {
// //   answer: string;
// //   route: 'sensor' | 'general' | 'sensor_cache' | 'sensor_detail' | 'error';
// //   session_id: string;
// //   turn_id: number;
// //   processing_time: number;
// //   mode: string;
// //   docs_found?: number;
// //   top_score?: number;
// //   error?: string;
// //   traceback?: string;
// // }

// // interface ChatbotHealthDto {
// //   status: 'healthy' | 'error';
// //   python_available: boolean;
// //   chatbot_module_available: boolean;
// //   error?: string;
// // }

// // // 요청 타입
// // interface ChatbotQueryDto {
// //   query: string;
// //   session_id?: string;
// // }

// // class ChatbotAPIImpl implements ChatbotAPIType {
// //   private baseURL: string;

// //   constructor(baseURL: string = API_BASE_URL) {
// //     this.baseURL = baseURL;
// //   }

// //   /**
// //    * 챗봇에 메시지 전송
// //    */
// //   async sendMessage(text: string, sessionId?: string | null): Promise<ChatbotResponseDto> {
// //     const requestBody: ChatbotQueryDto = {
// //       query: text,
// //       ...(sessionId && { session_id: sessionId }),
// //     };

// //     try {
// //       const response = await this.fetchWithTimeout(`${this.baseURL}/chatbot/ask`, {
// //         method: 'POST',
// //         headers: {
// //           'Content-Type': 'application/json',
// //         },
// //         body: JSON.stringify(requestBody),
// //       });

// //       if (!response.ok) {
// //         const errorData = await response.json().catch(() => ({}));
// //         throw new Error(
// //           errorData.message || 
// //           `API request failed with status ${response.status}: ${response.statusText}`
// //         );
// //       }

// //       const data: ChatbotResponseDto = await response.json();
      
// //       // 에러 응답 처리
// //       if (data.error) {
// //         throw new Error(data.error);
// //       }

// //       return data;
// //     } catch (error) {
// //       console.error('ChatbotAPI.sendMessage error:', error);
      
// //       if (error instanceof Error) {
// //         throw error;
// //       }
      
// //       throw new Error('Failed to send message to chatbot');
// //     }
// //   }

// //   /**
// //    * 챗봇 건강 상태 확인
// //    */
// //   async checkHealth(): Promise<ChatbotHealthDto> {
// //     try {
// //       const response = await this.fetchWithTimeout(`${this.baseURL}/chatbot/health`, {
// //         method: 'GET',
// //         headers: {
// //           'Content-Type': 'application/json',
// //         },
// //       });

// //       if (!response.ok) {
// //         throw new Error(`Health check failed with status ${response.status}`);
// //       }

// //       const data: ChatbotHealthDto = await response.json();
// //       return data;
// //     } catch (error) {
// //       console.error('ChatbotAPI.checkHealth error:', error);
      
// //       return {
// //         status: 'error',
// //         python_available: false,
// //         chatbot_module_available: false,
// //         error: error instanceof Error ? error.message : 'Health check failed',
// //       };
// //     }
// //   }

// //   /**
// //    * 개발용 목 응답 (하위 호환성)
// //    */
// //   async generateMockResponse(text: string) {
// //     // 실제 API 호출로 대체
// //     const response = await this.sendMessage(text);
    
// //     return {
// //       success: true as const,
// //       reply: response.answer,
// //       status: this.mapRouteToStatus(response.route),
// //       sensorData: this.extractSensorData(response.answer),
// //       timestamp: new Date().toISOString(),
// //       route: response.route,
// //       processingTime: response.processing_time,
// //     };
// //   }

// //   /**
// //    * 타임아웃을 지원하는 fetch 래퍼
// //    */
// //   private async fetchWithTimeout(
// //     url: string, 
// //     options: RequestInit, 
// //     timeout: number = API_TIMEOUT
// //   ): Promise<Response> {
// //     const controller = new AbortController();
// //     const timeoutId = setTimeout(() => controller.abort(), timeout);

// //     try {
// //       const response = await fetch(url, {
// //         ...options,
// //         signal: controller.signal,
// //       });
// //       return response;
// //     } catch (error) {
// //       if (error instanceof Error && error.name === 'AbortError') {
// //         throw new Error(`Request timed out after ${timeout}ms`);
// //       }
// //       throw error;
// //     } finally {
// //       clearTimeout(timeoutId);
// //     }
// //   }

// //   /**
// //    * 라우트를 상태로 매핑
// //    */
// //   private mapRouteToStatus(route: string): 'Good' | 'Normal' | 'Warning' {
// //     switch (route) {
// //       case 'sensor':
// //       case 'sensor_cache':
// //         return 'Good';
// //       case 'general':
// //       case 'sensor_detail':
// //         return 'Normal';
// //       case 'error':
// //         return 'Warning';
// //       default:
// //         return 'Normal';
// //     }
// //   }

// //   /**
// //    * 응답에서 센서 데이터 추출
// //    */
// //   private extractSensorData(response: string) {
// //     // 응답 텍스트에서 센서 데이터 패턴을 찾아 추출
// //     const tempMatch = response.match(/온도[:\s]*([0-9.]+)[°℃]/);
// //     const humMatch = response.match(/습도[:\s]*([0-9.]+)[%]/);
// //     const gasMatch = response.match(/CO2[:\s]*([0-9.]+)[ppm]|가스[:\s]*([0-9.]+)[ppm]/);

// //     if (tempMatch || humMatch || gasMatch) {
// //       return {
// //         temperature: tempMatch ? parseFloat(tempMatch[1]) : 25.5,
// //         humidity: humMatch ? parseFloat(humMatch[1]) : 60.0,
// //         gasConcentration: gasMatch ? parseFloat(gasMatch[1] || gasMatch[2]) : 675,
// //       };
// //     }

// //     return undefined;
// //   }
// // }

// // // 싱글톤 인스턴스 생성
// // export const ChatbotAPI = new ChatbotAPIImpl();

// // // 기본 내보내기 (하위 호환성)
// // export default ChatbotAPI;

// // src/services/ChatbotAPI.ts
// // - 배포/로컬 모두에서 안전하게 동작하도록 URL 기본값 보강
// // - ADMIN KEY 자동 첨부 (기본 헤더명: x-api-key)
// // - 경로(/chatbot/health, /chatbot/ask) env로 오버라이드 가능
// // - 필요 시 Bearer/쿠키 인증도 옵션으로 확장

// import { ChatbotAPIType } from './ChatbotTypes';

// // ======== 환경변수 & 기본값 ========

// // 프론트 공통 BASE URL (Mintrend와 통일)
// const RAW_BASE =
//   (process.env.REACT_APP_API_BASE_URL && process.env.REACT_APP_API_BASE_URL.trim()) || '';

// // window.origin로 안전 폴백
// const FALLBACK_ORIGIN =
//   (typeof window !== 'undefined' && window.location.origin.replace(/\/$/, '')) || '';

// // 최종 API BASE URL
// const API_BASE_URL = (RAW_BASE || FALLBACK_ORIGIN).replace(/\/$/, '');

// // 엔드포인트 경로 (백엔드가 /api 프리픽스를 쓴다면 아래 env로 바꿔치기)
// const HEALTH_PATH =
//   (process.env.REACT_APP_CHATBOT_HEALTH_PATH && process.env.REACT_APP_CHATBOT_HEALTH_PATH.trim()) ||
//   '/chatbot/health';
// const ASK_PATH =
//   (process.env.REACT_APP_CHATBOT_ASK_PATH && process.env.REACT_APP_CHATBOT_ASK_PATH.trim()) ||
//   '/chatbot/ask';

// // 관리자 키 세팅 (Mintrend 패턴과 동일 변수명)
// const ADMIN_API_KEY = process.env.REACT_APP_ADMIN_API_KEY || '';
// // 헤더명은 기본 'x-api-key', 필요 시 env로 교체 (예: admin_api_key, x-admin-api-key 등)
// const ADMIN_HEADER_NAME = process.env.REACT_APP_ADMIN_HEADER_NAME;

// // 선택 옵션 (있으면 사용)
// const BEARER_TOKEN = process.env.REACT_APP_BEARER_TOKEN || '';
// const WITH_CREDENTIALS =
//   String(process.env.REACT_APP_WITH_CREDENTIALS || '').toLowerCase() === 'true';

// const API_TIMEOUT = 60000;

// // ======== 구현 ========

// class ChatbotAPIImpl implements ChatbotAPIType {
//   private baseURL: string;

//   constructor(baseURL: string = API_BASE_URL) {
//     this.baseURL = baseURL;
//   }

//   // 공통 헤더 빌더
//   private buildHeaders(): Record<string, string> {
//     const headers: Record<string, string> = {
//       'Content-Type': 'application/json',
//     };

//     // 관리자 키 자동 첨부
//     if (ADMIN_API_KEY) {
//       headers[ADMIN_HEADER_NAME] = ADMIN_API_KEY;
//     }

//     // 선택: Bearer 토큰
//     if (BEARER_TOKEN) {
//       headers['Authorization'] = `Bearer ${BEARER_TOKEN}`;
//     }

//     return headers;
//   }

//   // 공통 fetch + 타임아웃
//   private async fetchWithTimeout(
//     input: RequestInfo | URL,
//     init?: RequestInit & { timeout?: number }
//   ): Promise<Response> {
//     const controller = new AbortController();
//     const timeout = init?.timeout ?? API_TIMEOUT;
//     const id = setTimeout(() => controller.abort(), timeout);

//     try {
//       const res = await fetch(input, {
//         ...init,
//         // 쿠키 인증 써야 하면 env로 on
//         ...(WITH_CREDENTIALS ? { credentials: 'include' as const } : {}),
//         signal: controller.signal,
//       });
//       return res;
//     } finally {
//       clearTimeout(id);
//     }
//   }

//   // 헬스체크
//   async checkHealth() {
//     try {
//       const url = `${this.baseURL}${HEALTH_PATH}`;
//       const response = await this.fetchWithTimeout(url, {
//         method: 'GET',
//         headers: this.buildHeaders(),
//       });

//       if (!response.ok) {
//         throw new Error(`Health check failed with status ${response.status}`);
//       }
//       return await response.json();
//     } catch (error) {
//       console.error('ChatbotAPI.checkHealth error:', error);
//       return {
//         status: 'error',
//         python_available: false,
//         chatbot_module_available: false,
//         error: error instanceof Error ? error.message : 'Health check failed',
//       };
//     }
//   }

//   // 메시지 전송
//   async sendMessage(text: string, sessionId?: string | null) {
//     const url = `${this.baseURL}${ASK_PATH}`;
//     const requestBody: Record<string, unknown> = { query: text };
//     if (sessionId) requestBody.session_id = sessionId;

//     const response = await this.fetchWithTimeout(url, {
//       method: 'POST',
//       headers: this.buildHeaders(),
//       body: JSON.stringify(requestBody),
//     });

//     if (!response.ok) {
//       // 서버가 에러 바디를 주면 최대한 보여주기
//       let detail = '';
//       try {
//         const j = await response.json();
//         detail = j?.message || j?.error || '';
//       } catch {}
//       throw new Error(
//         detail || `API request failed with status ${response.status}: ${response.statusText}`
//       );
//     }

//     const data = await response.json();
//     if (data?.error) throw new Error(data.error);
//     return data;
//   }
// }

// export const ChatbotAPI = new ChatbotAPIImpl();
// export default ChatbotAPI;


// src/services/ChatbotAPI.ts
// - 배포/로컬 모두에서 안전하게 동작하도록 URL 기본값 보강
// - ADMIN KEY 자동 첨부 (기본 헤더명: x-api-key)
// - 경로(/chatbot/health, /chatbot/ask) env로 오버라이드 가능
// - 필요 시 Bearer/쿠키 인증도 옵션으로 확장

import { ChatbotAPIType } from './ChatbotTypes';

// ======== 환경변수 & 기본값 ========

// 프론트 공통 BASE URL
const RAW_BASE =
  (process.env.REACT_APP_API_BASE_URL && process.env.REACT_APP_API_BASE_URL.trim()) || '';

// window.origin로 안전 폴백
const FALLBACK_ORIGIN =
  (typeof window !== 'undefined' && window.location.origin.replace(/\/$/, '')) || '';

// 최종 API BASE URL
const API_BASE_URL = (RAW_BASE || FALLBACK_ORIGIN).replace(/\/$/, '');

// 엔드포인트 경로 (백엔드가 /api 프리픽스를 쓴다면 아래 env로 바꿔치기)
const HEALTH_PATH =
  (process.env.REACT_APP_CHATBOT_HEALTH_PATH && process.env.REACT_APP_CHATBOT_HEALTH_PATH.trim()) ||
  '/chatbot/health';
const ASK_PATH =
  (process.env.REACT_APP_CHATBOT_ASK_PATH && process.env.REACT_APP_CHATBOT_ASK_PATH.trim()) ||
  '/chatbot/ask';

// 관리자 키 세팅
const ADMIN_API_KEY = process.env.REACT_APP_ADMIN_API_KEY || '';
// 헤더명은 기본 'x-api-key', 필요 시 env로 교체 (예: admin_api_key, x-admin-api-key 등)
const ADMIN_HEADER_NAME = process.env.REACT_APP_ADMIN_HEADER_NAME || 'x-api-key';

// 선택 옵션 (있으면 사용)
const BEARER_TOKEN = process.env.REACT_APP_BEARER_TOKEN || '';
const WITH_CREDENTIALS =
  String(process.env.REACT_APP_WITH_CREDENTIALS || '').toLowerCase() === 'true';

const API_TIMEOUT = 60000;

// ======== 구현 ========

class ChatbotAPIImpl implements ChatbotAPIType {
  private baseURL: string;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  // 공통 헤더 빌더
  private buildHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // 관리자 키 자동 첨부
    if (ADMIN_API_KEY) {
      headers[ADMIN_HEADER_NAME] = ADMIN_API_KEY;
    }

    // 선택: Bearer 토큰
    if (BEARER_TOKEN) {
      headers['Authorization'] = `Bearer ${BEARER_TOKEN}`;
    }

    return headers;
  }

  // 공통 fetch + 타임아웃
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
        // 쿠키 인증 써야 하면 env로 on
        ...(WITH_CREDENTIALS ? { credentials: 'include' as const } : {}),
        signal: controller.signal,
      });
      return res;
    } finally {
      clearTimeout(id);
    }
  }

  // 헬스체크
  async checkHealth() {
    try {
      const url = `${this.baseURL}${HEALTH_PATH}`;
      const response = await this.fetchWithTimeout(url, {
        method: 'GET',
        headers: this.buildHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Health check failed with status ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('ChatbotAPI.checkHealth error:', error);
      return {
        status: 'error',
        python_available: false,
        chatbot_module_available: false,
        error: error instanceof Error ? error.message : 'Health check failed',
      };
    }
  }

  // 메시지 전송
  async sendMessage(text: string, sessionId?: string | null) {
    const url = `${this.baseURL}${ASK_PATH}`;
    const requestBody: Record<string, unknown> = { query: text };
    if (sessionId) requestBody.session_id = sessionId;

    const response = await this.fetchWithTimeout(url, {
      method: 'POST',
      headers: this.buildHeaders(),
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      // 서버가 에러 바디를 주면 최대한 보여주기
      let detail = '';
      try {
        const j = await response.json();
        detail = j?.message || j?.error || '';
      } catch {}
      throw new Error(
        detail || `API request failed with status ${response.status}: ${response.statusText}`
      );
    }

    const data = await response.json();
    if (data?.error) throw new Error(data.error);
    return data;
  }

  // ✅ 인터페이스 요구 메서드: 개발용 목 응답 (하위 호환)
  async generateMockResponse(text: string) {
    // 실제 API 호출 결과를 그대로 래핑
    const response = await this.sendMessage(text);

    return {
      success: true as const,
      reply: response.answer,
      status: this.mapRouteToStatus(response.route),
      sensorData: this.extractSensorData(response.answer),
      timestamp: new Date().toISOString(),
      route: response.route,
      processingTime: response.processing_time,
    };
  }

  // 라우트를 상태로 매핑 (목 응답용)
  private mapRouteToStatus(route: string): 'Good' | 'Normal' | 'Warning' {
    switch (route) {
      case 'sensor':
      case 'sensor_cache':
        return 'Good';
      case 'general':
      case 'sensor_detail':
        return 'Normal';
      case 'error':
        return 'Warning';
      default:
        return 'Normal';
    }
  }

  // 응답 텍스트에서 센서 데이터 추출 (목 응답 보조)
  private extractSensorData(responseText: string) {
    const tempMatch = responseText.match(/온도[:\s]*([0-9.]+)[°℃]/);
    const humMatch = responseText.match(/습도[:\s]*([0-9.]+)%/);
    const gasMatch = responseText.match(/(?:CO2|가스)[:\s]*([0-9.]+)ppm/);

    if (tempMatch || humMatch || gasMatch) {
      return {
        temperature: tempMatch ? parseFloat(tempMatch[1]) : undefined,
        humidity: humMatch ? parseFloat(humMatch[1]) : undefined,
        gasConcentration: gasMatch ? parseFloat(gasMatch[1]) : undefined,
      };
    }
    return undefined;
  }
}

export const ChatbotAPI = new ChatbotAPIImpl();
export default ChatbotAPI;
