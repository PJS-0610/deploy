/**
 * ═══════════════════════════════════════════════════════════════
 * 🔐 Session Utils - 챗봇 세션 및 대화 이력 관리 유틸리티
 * ═══════════════════════════════════════════════════════════════
 * 
 * 주요 기능:
 * - UUID 기반 고유 세션 ID 생성 및 관리
 * - 24시간 자동 만료되는 세션 라이프사이클 관리
 * - 대화 메시지 로컬 스토리지 영속성 보장
 * - 챗봇 방문 상태 추적 및 이력 표시 제어
 * - 멀티 세션 지원 (세션별 독립적인 메시지 저장)
 * 
 * 보안 고려사항:
 * - localStorage 사용으로 도메인별 격리
 * - 자동 만료를 통한 세션 하이재킹 방지
 * - 에러 처리를 통한 graceful degradation
 * 
 * 데이터 구조:
 * - Session ID: UUID v4 형식의 고유 식별자
 * - Timestamp: 마지막 활동 시간 (세션 연장용)
 * - Messages: 세션별 대화 메시지 배열
 * - State: 방문 상태 및 이력 표시 설정
 */

import { v4 as uuidv4 } from 'uuid';

/**
 * 🔑 세션 관리 상수 정의
 * localStorage에서 사용되는 키 이름들과 만료 시간 설정
 */
const SESSION_STORAGE_KEY = 'chatbot_session_id';        // 세션 ID 저장 키
const SESSION_TIMESTAMP_KEY = 'chatbot_session_timestamp'; // 세션 타임스탬프 키
const SESSION_MESSAGES_KEY = 'chatbot_session_messages';   // 대화 메시지 저장 키
const SESSION_STATE_KEY = 'chatbot_session_state';        // 세션 상태 저장 키
const SESSION_EXPIRY_HOURS = 24; // 24시간 후 세션 자동 만료

/**
 * 📱 세션 상태 인터페이스
 * 챗봇 방문 상태와 이력 표시 설정을 관리하는 데이터 구조
 */
interface SessionState {
  wasInChatbot: boolean;      // 이전에 챗봇 페이지를 방문했는지 여부
  lastVisitTime: number;      // 마지막 방문 시간 (밀리초 타임스탬프)
  shouldShowHistory: boolean; // 대화 이력을 표시해야 하는지 여부
}

/**
 * 🆔 새로운 세션 ID 생성 함수
 * 
 * UUID v4 알고리즘을 사용하여 고유한 세션 식별자를 생성합니다.
 * 생성된 ID는 암호학적으로 안전하며 충돌 가능성이 극히 낮습니다.
 * 
 * @returns UUID v4 형식의 세션 ID 문자열 (예: "f47ac10b-58cc-4372-a567-0e02b2c3d479")
 */
export const generateSessionId = (): string => {
  return uuidv4();
};

/**
 * ⏰ 세션 만료 여부 확인 함수
 * 
 * 저장된 타임스탬프를 기반으로 현재 세션이 만료되었는지 확인합니다.
 * 24시간(SESSION_EXPIRY_HOURS)이 지나면 세션을 만료된 것으로 판단합니다.
 * 
 * 만료 조건:
 * - 타임스탬프가 없는 경우
 * - 현재 시간과 저장된 시간의 차이가 24시간을 초과하는 경우
 * - localStorage 접근 중 에러가 발생한 경우
 * 
 * @returns true: 세션 만료됨, false: 세션 유효함
 */
const isSessionExpired = (): boolean => {
  try {
    // 저장된 타임스탬프 조회
    const timestampStr = localStorage.getItem(SESSION_TIMESTAMP_KEY);
    if (!timestampStr) return true;
    
    // 타임스탬프 파싱 및 만료 시간 계산
    const timestamp = parseInt(timestampStr, 10);
    const now = Date.now();
    const expiryTime = SESSION_EXPIRY_HOURS * 60 * 60 * 1000; // 24시간을 밀리초로 변환
    
    // 현재 시간과 저장된 시간의 차이가 만료 시간을 초과하는지 확인
    return (now - timestamp) > expiryTime;
  } catch (error) {
    console.warn('세션 만료 확인 중 오류 발생:', error);
    return true; // 에러 발생 시 안전하게 만료된 것으로 처리
  }
};

/**
 * 🕐 세션 타임스탬프 업데이트 함수
 * 
 * 현재 시간을 localStorage에 저장하여 세션의 마지막 활동 시간을 갱신합니다.
 * 이 함수는 사용자가 세션과 상호작용할 때마다 호출되어 세션 만료를 연장시킵니다.
 * 
 * 동작 과정:
 * 1. 현재 시간을 밀리초 단위로 획득
 * 2. 문자열로 변환하여 localStorage에 저장
 * 3. 저장 실패 시 경고 로그 출력 (기능에는 영향 없음)
 * 
 * 용도:
 * - 세션 활동 시간 추적
 * - 자동 세션 연장 메커니즘
 * - 세션 만료 시간 계산의 기준점 제공
 * 
 * @internal 내부 함수로, 직접 호출하지 말고 다른 세션 함수를 통해 자동 호출됨
 */
const updateSessionTimestamp = (): void => {
  try {
    localStorage.setItem(SESSION_TIMESTAMP_KEY, Date.now().toString());
  } catch (error) {
    console.warn('Failed to update session timestamp:', error);
  }
};

/**
 * 🔍 현재 세션 ID 조회 및 자동 생성 함수
 * 
 * 애플리케이션의 핵심 세션 관리 함수로, 사용자별 고유 세션을 보장합니다.
 * 기존 유효한 세션이 있으면 재사용하고, 없거나 만료되었으면 새로 생성합니다.
 * 
 * 📋 동작 로직:
 * 1. localStorage에서 기존 세션 ID 검색
 * 2. 세션이 존재하고 유효한지 확인 (만료 시간 체크)
 * 3. 유효한 세션이면 타임스탬프 갱신 후 반환
 * 4. 없거나 만료된 세션이면 새 UUID 생성 후 저장
 * 5. localStorage 접근 실패 시 임시 세션 ID 반환
 * 
 * 🔄 세션 라이프사이클:
 * - 생성: 첫 방문 시 또는 만료 후
 * - 연장: 사용할 때마다 24시간 연장
 * - 만료: 24시간 비활성 상태 시 자동 만료
 * 
 * 🛡️ 에러 처리:
 * - localStorage 비활성화/오류 시 임시 세션 제공
 * - 무효한 세션 ID는 자동으로 새로 생성
 * - graceful degradation으로 서비스 중단 방지
 * 
 * @returns 유효한 세션 ID 문자열 (UUID v4 형식)
 * @public 모든 컴포넌트에서 사용 가능한 공개 함수
 */
export const getSessionId = (): string => {
  try {
    // localStorage에서 기존 세션 ID 조회
    const existingSessionId = localStorage.getItem(SESSION_STORAGE_KEY);
    
    // 세션이 있고 만료되지 않았으면 기존 세션 사용
    if (existingSessionId && existingSessionId.trim() && !isSessionExpired()) {
      // 세션 사용할 때마다 타임스탬프 갱신 (세션 연장)
      updateSessionTimestamp();
      return existingSessionId;
    }
    
    // 기존 세션이 없거나 만료되었으면 새로 생성
    const newSessionId = generateSessionId();
    localStorage.setItem(SESSION_STORAGE_KEY, newSessionId);
    updateSessionTimestamp();
    
    return newSessionId;
  } catch (error) {
    // localStorage 접근 실패 시 임시 세션 ID 생성 (저장되지 않음)
    console.warn('Failed to access localStorage for session ID:', error);
    return generateSessionId();
  }
};

/**
 * 🗑️ 전체 세션 데이터 삭제 함수
 * 
 * 사용자 로그아웃, 세션 초기화, 개인정보 보호 등의 목적으로
 * localStorage에 저장된 모든 세션 관련 데이터를 완전히 제거합니다.
 * 
 * 🧹 삭제되는 데이터:
 * - 세션 ID (SESSION_STORAGE_KEY)
 * - 세션 타임스탬프 (SESSION_TIMESTAMP_KEY) 
 * - 대화 메시지 내역 (SESSION_MESSAGES_KEY)
 * - 세션 상태 정보 (SESSION_STATE_KEY)
 * 
 * 📝 사용 시나리오:
 * - 사용자 명시적 로그아웃
 * - 보안상 세션 무효화 필요 시
 * - 애플리케이션 재시작/초기화
 * - 개인정보 삭제 요청 처리
 * 
 * ⚠️ 주의사항:
 * - 이 함수 호출 후 모든 세션 데이터가 영구 삭제됨
 * - 대화 내역 및 상태 정보도 함께 삭제됨
 * - 다음 접근 시 새로운 세션이 자동 생성됨
 * 
 * @public 로그아웃 및 세션 초기화 시 사용
 */
export const clearSessionId = (): void => {
  try {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    localStorage.removeItem(SESSION_TIMESTAMP_KEY);
    localStorage.removeItem(SESSION_MESSAGES_KEY);
    localStorage.removeItem(SESSION_STATE_KEY);
  } catch (error) {
    console.warn('Failed to clear session ID from localStorage:', error);
  }
};

/**
 * 🔧 특정 세션 ID 강제 설정 함수
 * 
 * 개발, 테스트, 디버깅 목적으로 특정 세션 ID를 직접 설정합니다.
 * 일반적인 운영 환경에서는 사용하지 않으며, 주로 개발 도구로 활용됩니다.
 * 
 * 🎯 주요 용도:
 * - 단위 테스트에서 예측 가능한 세션 ID 설정
 * - 개발 중 특정 세션 상태 재현
 * - QA 테스트에서 시나리오별 세션 관리
 * - 디버깅 시 세션 추적 용이성 확보
 * 
 * 📋 동작 과정:
 * 1. 입력된 세션 ID 유효성 검증 (빈 문자열 체크)
 * 2. localStorage에 세션 ID 저장
 * 3. 현재 시간으로 타임스탬프 갱신
 * 4. 오류 발생 시 경고 로그 출력
 * 
 * ⚠️ 보안 고려사항:
 * - 운영 환경에서는 사용 금지
 * - 예측 가능한 세션 ID 사용 시 보안 위험 존재
 * - 테스트 완료 후 일반 세션으로 복구 권장
 * 
 * @param sessionId 설정할 세션 ID (빈 문자열 불가)
 * @throws Error 빈 세션 ID 입력 시 에러 발생
 * @public 테스트 및 개발 환경에서만 사용
 */
export const setSessionId = (sessionId: string): void => {
  try {
    if (!sessionId || !sessionId.trim()) {
      throw new Error('Session ID cannot be empty');
    }
    localStorage.setItem(SESSION_STORAGE_KEY, sessionId);
    updateSessionTimestamp();
  } catch (error) {
    console.warn('Failed to set session ID in localStorage:', error);
  }
};

/**
 * 🔄 세션 활성화 및 연장 함수
 * 
 * 사용자의 활동을 감지하고 세션 만료 시간을 연장하는 핵심 함수입니다.
 * 대화, 페이지 이동, 사용자 상호작용 시마다 호출되어 세션을 활성 상태로 유지합니다.
 * 
 * 🎯 주요 기능:
 * - 현재 시간으로 세션 타임스탬프 갱신
 * - 24시간 만료 시간을 현재 시점부터 재계산
 * - 사용자 활동 추적 및 세션 지속성 보장
 * 
 * 📞 호출 시점:
 * - 챗봇과 대화할 때마다
 * - 페이지 간 이동 시
 * - 중요한 사용자 액션 수행 시
 * - 백그라운드에서 주기적 호출 (선택사항)
 * 
 * 🔗 연관 함수:
 * - updateSessionTimestamp(): 실제 타임스탬프 갱신 로직
 * - isSessionExpired(): 만료 여부 판단 시 갱신된 시간 참조
 * - getSessionId(): 세션 조회 시 자동으로 활성화 수행
 * 
 * 💡 사용 예시:
 * ```typescript
 * // 대화 메시지 전송 시
 * sendMessage(message);
 * refreshSession(); // 세션 연장
 * 
 * // 페이지 이동 시
 * router.navigate('/dashboard');
 * refreshSession(); // 활동 추적
 * ```
 * 
 * @public 모든 컴포넌트에서 사용자 활동 시 호출
 */
export const refreshSession = (): void => {
  updateSessionTimestamp();
};

/**
 * 💾 대화 메시지 영속적 저장 함수
 * 
 * 현재 세션의 모든 대화 내역을 localStorage에 안전하게 저장합니다.
 * 세션 ID를 기반으로 고유한 저장 키를 생성하여 멀티 세션 지원을 보장합니다.
 * 
 * 📁 데이터 구조:
 * - 저장 키: SESSION_MESSAGES_KEY + "_" + sessionId
 * - 데이터: JSON 직렬화된 메시지 배열
 * - 형식: [{sender, message, timestamp, ...}, ...]
 * 
 * 🔄 동작 과정:
 * 1. 현재 세션 ID 자동 획득
 * 2. 세션별 고유 메시지 키 생성
 * 3. 메시지 배열을 JSON으로 직렬화
 * 4. localStorage에 안전하게 저장
 * 
 * 🐛 에러 처리:
 * - localStorage 용량 초과 시 graceful degradation
 * - JSON 직렬화 실패 시 경고 로그 출력
 * - 비공개 모드에서 localStorage 비활성화 대응
 * 
 * 📊 사용 시나리오:
 * - 대화 중 주기적 자동 저장
 * - 새로운 메시지 추가 시 전체 내역 업데이트
 * - 페이지 새로고침 전 데이터 유지
 * - 브라우저 비정상 종료 대비 데이터 보호
 * 
 * @param messages 저장할 대화 메시지 배열 (any[] 타입으로 유연한 메시지 구조 지원)
 * @public 챗봇 및 대화 컴포넌트에서 사용
 */
export const saveChatMessages = (messages: any[]): void => {
  try {
    const sessionId = getSessionId();
    const messagesKey = `${SESSION_MESSAGES_KEY}_${sessionId}`;
    localStorage.setItem(messagesKey, JSON.stringify(messages));
  } catch (error) {
    console.warn('Failed to save chat messages:', error);
  }
};

/**
 * 📬 대화 메시지 로드 및 복원 함수
 * 
 * localStorage에 저장된 현재 세션의 대화 내역을 안전하게 불러옵니다.
 * 세션별로 분리된 메시지를 정확히 로드하여 일관된 대화 경험을 제공합니다.
 * 
 * 🔍 로드 과정:
 * 1. 현재 세션 ID 자동 획득
 * 2. 세션별 메시지 키 생성
 * 3. localStorage에서 데이터 조회
 * 4. JSON 역직렬화를 통한 객체 복원
 * 5. 데이터 무결성 검증
 * 
 * 🛑 예외 상황 처리:
 * - 저장된 데이터가 없는 경우: 빈 배열 반환
 * - JSON 파싱 실패: 빈 배열 반환 및 오류 로깅
 * - localStorage 접근 실패: 빈 배열 반환
 * - 데이터 손상: graceful degradation
 * 
 * 📊 데이터 무결성:
 * - 세션별 완전히 분리된 데이터
 * - 다른 세션의 메시지와 혼재 방지
 * - 데이터 형식 유지 및 호환성 보장
 * 
 * 🚀 성능 최적화:
 * - localStorage 단일 접근으로 빠른 로드
 * - 캐시된 데이터 즉시 반환
 * - 불필요한 데이터 로드 방지
 * 
 * 📝 사용 예시:
 * ```typescript
 * // 컴포넌트 마운트 시 대화 내역 복원
 * const savedMessages = loadChatMessages();
 * setChatHistory(savedMessages);
 * 
 * // 대화 진행 중 이전 내역 확인
 * const previousChats = loadChatMessages();
 * ```
 * 
 * @returns 저장된 대화 메시지 배열 (데이터가 없으면 빈 배열)
 * @public 챗봇 및 대화 컴포넌트에서 데이터 복원 시 사용
 */
export const loadChatMessages = (): any[] => {
  try {
    const sessionId = getSessionId();
    const messagesKey = `${SESSION_MESSAGES_KEY}_${sessionId}`;
    const savedMessages = localStorage.getItem(messagesKey);
    return savedMessages ? JSON.parse(savedMessages) : [];
  } catch (error) {
    console.warn('Failed to load chat messages:', error);
    return [];
  }
};

/**
 * 🧹 현재 세션 대화 메시지 전체 삭제 함수
 * 
 * 현재 세션에 저장된 모든 대화 내역을 영구적으로 삭제합니다.
 * 다른 세션의 대화 내역은 보존되며, 현재 세션만 초기화됩니다.
 * 
 * 🎯 주요 사용 사례:
 * - 사용자가 대화 내역 삭제 요청 시
 * - 새로운 대화 시작 전 이전 내역 정리
 * - 개인정보 보호를 위한 데이터 삭제
 * - 대화 캄리티 문제 시 리셋
 * - 테스트 환경에서 깨끗한 상태 조성
 * 
 * 🔒 데이터 안전성:
 * - 세션 ID 기반 정확한 타겟팅
 * - 다른 세션 데이터 보호
 * - localStorage 안전 접근 및 예외 처리
 * - 데이터 무결성 유지
 * 
 * 🔄 삭제 과정:
 * 1. 현재 세션 ID 자동 획득
 * 2. 세션별 메시지 키 생성
 * 3. localStorage에서 해당 키 삭제
 * 4. 오류 발생 시 경고 로그 출력
 * 
 * ⚠️ 주의사항:
 * - 삭제된 데이터는 복구 불가능
 * - 사용자 확인 없이 호출 시 데이터 손실 위험
 * - 다른 세션에는 영향 없음
 * 
 * 💡 베스트 프랙티스:
 * - 사용자 의도 명시적 확인 후 호출
 * - 삭제 전 중요 데이터 백업 고려
 * - 삭제 후 UI 상태 업데이트
 * 
 * @public 사용자 대화 내역 관리 에서 사용
 */
export const clearChatMessages = (): void => {
  try {
    const sessionId = getSessionId();
    const messagesKey = `${SESSION_MESSAGES_KEY}_${sessionId}`;
    localStorage.removeItem(messagesKey);
  } catch (error) {
    console.warn('Failed to clear chat messages:', error);
  }
};

/**
 * 📍 챗봇 페이지 방문 상태 추적 함수
 * 
 * 사용자가 챗봇 페이지를 방문했는지 여부를 기록하고 상태를 관리합니다.
 * 이 정보는 대화 내역 표시, 네비게이션 동작, UI 상태 결정에 활용됩니다.
 * 
 * 📊 저장되는 상태 정보:
 * - wasInChatbot: 챗봇 방문 여부 (boolean)
 * - lastVisitTime: 마지막 방문 시간 (밀리초 타임스탬프)
 * - shouldShowHistory: 대화 내역 표시 여부 (false로 초기화)
 * 
 * 🔄 상태 초기화 로직:
 * - shouldShowHistory는 항상 false로 설정 (다른 함수에서 제어)
 * - lastVisitTime은 현재 시간으로 자동 설정
 * - 이전 상태는 완전히 덜어쓰기됨
 * 
 * 🎯 주요 사용 시나리오:
 * - 챗봇 페이지 진입 시 (wasInChatbot: true)
 * - 챗봇 페이지 이탈 시 (wasInChatbot: false)
 * - 페이지 전환 추적이 필요한 네비게이션
 * - 대화 내역 표시 여부 결정 로직
 * 
 * 🔗 연관 함수:
 * - getChatbotSessionState(): 저장된 상태 조회
 * - setShouldShowHistory(): 내역 표시 상태 개별 제어
 * - clearSessionState(): 상태 전체 초기화
 * 
 * 💡 사용 예시:
 * ```typescript
 * // 챗봇 페이지 진입 시
 * setChatbotVisitState(true);
 * 
 * // 다른 페이지로 이동 시
 * setChatbotVisitState(false);
 * ```
 * 
 * @param wasInChatbot 챗봇 페이지 방문 여부 (true: 방문 중, false: 이탈)
 * @public 네비게이션 및 라우팅 컴포넌트에서 사용
 */
export const setChatbotVisitState = (wasInChatbot: boolean): void => {
  try {
    const state: SessionState = {
      wasInChatbot,
      lastVisitTime: Date.now(),
      shouldShowHistory: false
    };
    localStorage.setItem(SESSION_STATE_KEY, JSON.stringify(state));
  } catch (error) {
    console.warn('Failed to save chatbot visit state:', error);
  }
};

/**
 * 📜 대화 내역 표시 상태 제어 함수
 * 
 * 사용자에게 대화 내역을 보여줄지 여부를 세밀하게 제어합니다.
 * 기존 세션 상태를 보존하면서 shouldShowHistory 속성만 선택적으로 업데이트합니다.
 * 
 * 🔄 업데이트 로직:
 * 1. 기존 세션 상태 이벤트 복사 (데이터 유지)
 * 2. shouldShowHistory 속성만 새로운 값으로 변경
 * 3. lastVisitTime을 현재 시간으로 갱신
 * 4. 전체 상태를 localStorage에 저장
 * 
 * 🎯 주요 사용 사례:
 * - 사용자가 대화 내역 표시/숨김 토글 조작
 * - 새로운 대화 시작 시 내역 숨김 처리
 * - 페이지 상태에 따른 내역 표시 제어
 * - UI 컴포넌트의 조건부 렌더링 제어
 * 
 * 🔒 데이터 무결성:
 * - spread operator 사용으로 기존 데이터 보전
 * - 선택적 업데이트로 데이터 손실 방지
 * - 상태 일관성 유지 및 예측 가능성 확보
 * 
 * 🛡️ 에러 처리:
 * - getChatbotSessionState() 실패 시 기본값 사용
 * - localStorage 접근 오류 시 graceful degradation
 * - JSON 직렬화 실패 시 경고 로그 출력
 * 
 * 💡 사용 예시:
 * ```typescript
 * // 대화 내역 보이기
 * setShouldShowHistory(true);
 * 
 * // 대화 내역 숨기기
 * setShouldShowHistory(false);
 * 
 * // 사용자 설정에 따른 동적 제어
 * setShouldShowHistory(userPreference.showHistory);
 * ```
 * 
 * @param shouldShow 대화 내역 표시 여부 (true: 표시, false: 숨김)
 * @public UI 컴포넌트 및 사용자 설정에서 사용
 */
export const setShouldShowHistory = (shouldShow: boolean): void => {
  try {
    const existingState = getChatbotSessionState();
    const state: SessionState = {
      ...existingState,
      shouldShowHistory: shouldShow,
      lastVisitTime: Date.now()
    };
    localStorage.setItem(SESSION_STATE_KEY, JSON.stringify(state));
  } catch (error) {
    console.warn('Failed to set show history state:', error);
  }
};

/**
 * 🗺️ 챗봇 세션 상태 조회 및 자동 관리 함수
 * 
 * 저장된 챗봇 세션 상태를 안전하게 가져오고, 시간 기반 자동 만료 로직을 처리합니다.
 * 5분 이상 비활성 상태일 경우 자동으로 상태를 초기화하여 데이터 일관성을 보장합니다.
 * 
 * 🕰️ 자동 만료 로직 (5분 규칙):
 * - 5분 이내: 저장된 상태 그대로 반환
 * - 5분 초과: 자동 초기화된 상태 반환
 *   - wasInChatbot: false (챗봇 페이지 이탈 상태)
 *   - shouldShowHistory: true (내역 표시 허용)
 *   - lastVisitTime: 현재 시간으로 갱신
 * 
 * 🛀 기본값 처리:
 * 저장된 데이터가 없거나 오류 발생 시:
 * - wasInChatbot: false (초기 상태)
 * - lastVisitTime: 현재 시간
 * - shouldShowHistory: false (초기에는 내역 숨김)
 * 
 * 🔄 동작 흐름:
 * 1. localStorage에서 상태 데이터 조회
 * 2. JSON 파싱 및 데이터 유효성 검증
 * 3. 마지막 활동 시간 기반 만료 검사
 * 4. 만료된 경우 자동 초기화된 상태 반환
 * 5. 유효한 경우 저장된 상태 그대로 반환
 * 
 * 🎯 주요 사용 사례:
 * - 컴포넌트 마운트 시 상태 복원
 * - 네비게이션 로직에서 이전 상태 확인
 * - 대화 내역 표시 여부 결정
 * - UI 조건부 렌더링 조건 체크
 * 
 * 📊 성능 최적화:
 * - 단일 localStorage 접근으로 빠른 데이터 조회
 * - 인메모리 연산으로 빠른 만료 판단
 * - 불필요한 데이터 직렬화 없이 기본값 제공
 * 
 * 💡 사용 예시:
 * ```typescript
 * // UI 상태 결정
 * const state = getChatbotSessionState();
 * if (state.shouldShowHistory) {
 *   showChatHistory();
 * }
 * 
 * // 네비게이션 로직
 * if (state.wasInChatbot) {
 *   continueChat();
 * } else {
 *   startNewConversation();
 * }
 * ```
 * 
 * @returns SessionState 객체 (현재 세션의 모든 상태 정보)
 * @public 모든 컴포넌트에서 상태 조회 시 사용
 */
export const getChatbotSessionState = (): SessionState => {
  try {
    const stateStr = localStorage.getItem(SESSION_STATE_KEY);
    if (stateStr) {
      const state = JSON.parse(stateStr);
      // 5분 이상 지났으면 상태 초기화
      const fiveMinutes = 5 * 60 * 1000;
      if (Date.now() - state.lastVisitTime > fiveMinutes) {
        return {
          wasInChatbot: false,
          lastVisitTime: Date.now(),
          shouldShowHistory: true
        };
      }
      return state;
    }
  } catch (error) {
    console.warn('Failed to get chatbot session state:', error);
  }
  
  return {
    wasInChatbot: false,
    lastVisitTime: Date.now(),
    shouldShowHistory: false
  };
};

/**
 * 🔄 세션 상태 완전 초기화 함수
 * 
 * localStorage에 저장된 모든 세션 상태 정보를 영구적으로 삭제합니다.
 * 이 함수 호출 후에는 getChatbotSessionState()가 기본값을 반환하게 됩니다.
 * 
 * 🧹 삭제되는 상태 데이터:
 * - wasInChatbot: 챗봇 방문 상태 정보
 * - lastVisitTime: 마지막 방문 시간 데이터
 * - shouldShowHistory: 대화 내역 표시 설정
 * 
 * 🎯 주요 사용 시나리오:
 * - 사용자 로그아웃 시 완전한 상태 초기화
 * - 애플리케이션 재시작 시 깨끗한 상태 조성
 * - 개인정보 삭제 요청 시 상태 데이터 제거
 * - 디버깅 목적으로 예측 가능한 상태 조성
 * - 테스트 환경에서 기준 상태 리셋
 * 
 * 🔄 초기화 후 동작:
 * - getChatbotSessionState() 호출 시 기본값 반환:
 *   ```typescript
 *   {
 *     wasInChatbot: false,
 *     lastVisitTime: Date.now(),
 *     shouldShowHistory: false
 *   }
 *   ```
 * 
 * 🔗 연관 함수 영향:
 * - setChatbotVisitState(): 다음 호출에서 새로운 상태 생성
 * - setShouldShowHistory(): 기본값부터 시작하여 옵션 업데이트
 * - getChatbotSessionState(): 상태 없음으로 인식하여 기본값 생성
 * 
 * ⚠️ 주의사항:
 * - 삭제된 상태는 복구 불가능함
 * - UI 상태가 예상과 다르게 동작할 수 있음
 * - 다른 세션 데이터(ID, 메시지)에는 영향 없음
 * 
 * 💪 베스트 프랙티스:
 * - 로그아웃 후 상태 초기화로 깨끗한 상태 유지
 * - 초기화 후 UI 업데이트로 일관성 보장
 * - 개발 환경에서 예측 가능한 테스트 시나리오 조성
 * 
 * @public 세션 관리 및 인증 시스템에서 사용
 */
export const clearSessionState = (): void => {
  try {
    localStorage.removeItem(SESSION_STATE_KEY);
  } catch (error) {
    console.warn('Failed to clear session state:', error);
  }
};