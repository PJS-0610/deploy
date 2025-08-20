// ===== 기본 타입 =====
export type Sender = 'bot' | 'user';

export interface SensorData {
  temperature: number;
  humidity: number;
  gasConcentration: number;
}

export interface ChatMessage {
  id: string;
  sender: Sender;
  message: string;          // UI에서 message.message 사용
  timestamp: string;        // ISO
  status?: 'Good' | 'Normal' | 'Warning';
  sensorData?: SensorData;  // UI에서 message.sensorData.* 접근
  route?: 'sensor' | 'general' | 'sensor_cache' | 'sensor_detail' | 'error'; // 응답 라우팅 타입
}

// UseChatbot / ChatbotScreen에서 실제로 쓰는 상태 필드들
export interface ChatbotState {
  messages: ChatMessage[];
  isLoading: boolean;
  isTyping: boolean;
  inputMessage: string;
  error: string | null;
  modelStatus: 'Active' | 'Inactive' | 'Loading' | string;
  isConnected: boolean;
}

// API 인터페이스 (실제 백엔드 API와 호환)
export interface ChatbotAPIType {
  sendMessage: (text: string, sessionId?: string | null) => Promise<ChatbotResponseDto>;
  checkHealth: () => Promise<ChatbotHealthDto>;
  generateMockResponse: (text: string) => Promise<{
    success: true;
    reply: string;
    status: 'Good' | 'Normal' | 'Warning';
    sensorData?: SensorData;
    timestamp: string;
    route?: string;
    processingTime?: number;
  }>;
}

// 백엔드 API 응답 타입들
export interface ChatbotResponseDto {
  answer: string;
  route: 'sensor' | 'general' | 'sensor_cache' | 'sensor_detail' | 'error';
  session_id: string;
  turn_id: number;
  processing_time: number;
  mode: string;
  docs_found?: number;
  top_score?: number;
  error?: string;
  traceback?: string;
}

export interface ChatbotHealthDto {
  status: 'healthy' | 'error';
  python_available: boolean;
  chatbot_module_available: boolean;
  error?: string;
}

// 알림(현재 컴포넌트가 쓰는 형태에 맞춤: count + notifications[])
export interface NotificationItem {
  id: string;
  message: string;
  timestamp: string;
  read: boolean;
}

export interface NotificationData {
  count: number;
  notifications: NotificationItem[];
}

// ChatbotScreen에서 요구하는 props(에러 로그 기준)
export interface ChatbotScreenProps {
  onNavigateToHistory: () => void;
  onNavigateToRole: () => void;                // App.tsx에서 넘김
  onNavigateToDashboard: () => void;
  onNavigateToSettings?: () => void;           // 설정 페이지로 이동
  activeMenu: string;
  setActiveMenu: (menu: string) => void;
}

// ===== 유틸 =====
export const ChatbotUtils = {
  formatTime: (iso: string) => {
    try {
      const d = new Date(iso);
      const hh = String(d.getHours()).padStart(2, '0');
      const mm = String(d.getMinutes()).padStart(2, '0');
      return `${hh}:${mm}`;
    } catch {
      return iso;
    }
  },

  validateMessage: (text: any) => {
    // null, undefined, 또는 trim 메서드가 없는 값들을 안전하게 처리
    let trimmed = '';
    try {
      trimmed = typeof text === 'string' ? text.trim() : String(text || '').trim();
    } catch (error) {
      console.warn('validateMessage: text processing failed:', error);
      trimmed = '';
    }
    
    if (!trimmed) return { isValid: false, error: '메시지를 입력해주세요.' };
    if (trimmed.length > 2000) return { isValid: false, error: '메시지가 너무 깁니다.' };
    return { isValid: true as const };
  },

  generateMessageId: () =>
    `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,

  // 글자 수 기반 간단 타이핑 지연 (최대 1500ms)
  calculateTypingDelay: (text: string) => {
    const base = 300;
    const perChar = Math.min(text.length * 15, 1200);
    return base + perChar;
  },

  // 초기 환영 메시지
  createWelcomeMessage: (): ChatMessage => ({
    id: ChatbotUtils.generateMessageId(),
    message:
      '안녕하세요! 저는 AWS² IoT 공기질 분석 비서입니다. 😊\n강의실의 실시간 환경 상태와 예측 정보를 알려드려요.\n무엇을 도와드릴까요?',
    sender: 'bot',
    timestamp: new Date().toISOString(),
    status: 'Good',
    sensorData: {
      temperature: 25.5,
      humidity: 60.1,
      gasConcentration: 675,
    },
  }),

  // MintrendService를 사용한 실시간 환영 메시지
  createWelcomeMessageWithSensorData: async (): Promise<ChatMessage> => {
    let sensorData: SensorData = {
      temperature: 25.5,
      humidity: 60.1,
      gasConcentration: 675,
    };
    let status: 'Good' | 'Normal' | 'Warning' = 'Good';
    let message = '안녕하세요! 저는 AWS² IoT 공기질 분석 비서입니다. \n강의실의 실시간 환경 상태와 예측 정보를 알려드려요.\n\n';

    try {
      const { MintrendService } = await import('../pages/Dashboard/hooks/MintrendService');
      const mintrendData = await MintrendService.getLatestMintrendData();
      
      sensorData = {
        temperature: mintrendData.data.mintemp,
        humidity: mintrendData.data.minhum,
        gasConcentration: mintrendData.data.mingas,
      };

      const tempStatus = MintrendService.getTemperatureStatus(sensorData.temperature);
      const humStatus = MintrendService.getHumidityStatus(sensorData.humidity);
      const gasStatus = MintrendService.getGasStatus(sensorData.gasConcentration);
      
      // 전체 상태는 가장 심각한 상태로 설정
      if (tempStatus === 'WARNING' || humStatus === 'WARNING' || gasStatus === 'WARNING') {
        status = 'Warning';
      } else if (tempStatus === 'NORMAL' || humStatus === 'NORMAL' || gasStatus === 'NORMAL') {
        status = 'Normal';
      } else {
        status = 'Good';
      }

      message += '무엇을 도와드릴까요?';

    } catch (error) {
      console.warn('센서 데이터를 가져올 수 없어 기본 메시지를 사용합니다:', error);
      message += '현재 센서 데이터를 확인 중입니다...\n무엇을 도와드릴까요?';
    }

    return {
      id: ChatbotUtils.generateMessageId(),
      message,
      sender: 'bot',
      timestamp: new Date().toISOString(),
      status,
      sensorData,
      route: 'sensor', // 웰컴 메시지는 센서 데이터를 포함하므로 sensor로 분류
    };
  },

  // 간단 localStorage 저장/로드 (필요 없다면 빈 함수로 둬도 됨)
  saveMessageHistory: (messages: ChatMessage[]) => {
    try {
      localStorage.setItem('chat_history', JSON.stringify(messages));
    } catch {}
  },
  loadMessageHistory: (): ChatMessage[] => {
    try {
      const raw = localStorage.getItem('chat_history');
      return raw ? (JSON.parse(raw) as ChatMessage[]) : [];
    } catch {
      return [];
    }
  },
};