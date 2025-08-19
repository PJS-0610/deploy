// src/services/ChatbotHistoryTypes.ts
// 챗봇 히스토리 관련 타입 정의

// 문서 메타데이터 타입
export interface DocumentMeta {
  key?: string;
  score?: number;
  schema?: string;
  tag?: string;
  file_size?: number;
}

// 센서 컨텍스트 타입
export interface SensorContext {
  window?: string | null;
  start?: string | null;
  end?: string | null;
  rows?: string | null;
  tag?: string | null;
  label?: string | null;
}

// 단일 대화 턴 타입
export interface ChatbotTurn {
  session_id: string;
  turn_id: number;
  ts_kst: string; // KST 타임스탬프
  route: 'sensor' | 'general' | 'sensor_cache' | 'sensor_detail' | 'error';
  query: string;
  answer: string;
  docs: DocumentMeta[];
  last_sensor_ctx: SensorContext;
  s3_key: string;
}

// 세션 히스토리 응답 타입
export interface ChatbotHistoryResponse {
  session_id: string;
  total_turns: number;
  turns: ChatbotTurn[];
  start_date: string;
  end_date: string;
}

// 개별 세션 정보 타입
export interface ChatbotSession {
  session_id: string;
  first_turn_date: string;
  last_turn_date: string;
  total_turns: number;
  last_query: string;
  last_answer: string;
}

// 세션 목록 응답 타입
export interface ChatbotSessionsResponse {
  total_sessions: number;
  sessions: ChatbotSession[];
}

// 히스토리 조회 요청 파라미터
export interface HistoryQueryParams {
  limit?: number;
  startDate?: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
}

// 세션 목록 조회 요청 파라미터
export interface SessionsQueryParams {
  limit?: number;
  startDate?: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
}

// 히스토리 UI 상태 타입
export interface HistoryState {
  sessions: ChatbotSession[];
  selectedSession: string | null;
  currentHistory: ChatbotTurn[];
  isLoading: boolean;
  error: string | null;
  isExpanded: boolean;
}

// 히스토리 패널 props 타입
export interface HistoryPanelProps {
  isExpanded: boolean;
  onToggle: () => void;
  currentSessionId: string | null;
}