// src/services/ChatbotTypes.ts

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

// API 인터페이스 (필요시 확장 가능)
export interface ChatbotAPIType {
  sendMessage: (text: string) => Promise<ChatMessage>;
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

  validateMessage: (text: string) => {
    const trimmed = (text ?? '').trim();
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

// ===== API (목) =====
export const ChatbotAPI: ChatbotAPIType = {
  // 실제 백엔드 붙일 때 교체
  async sendMessage(text: string) {
    // 여기서는 generateMockResponse 사용해서 메시지 생성
    const r = await ChatbotAPI.generateMockResponse(text);
    return {
      id: ChatbotUtils.generateMessageId(),
      message: r.reply,
      sender: 'bot',
      timestamp: r.timestamp,
      status: r.status,
      sensorData: r.sensorData,
    };
  },

  // 개발용 목 응답
  async generateMockResponse(text: string) {
    const samples = [
      {
        reply:
          '현재 온도 25.6°C, 습도 60%, 가스농도 670ppm으로 양호합니다. 😊\n필요하시면 다음 시간 예측도 알려드릴게요!',
        status: 'Good' as const,
        sensorData: { temperature: 25.6, humidity: 60.0, gasConcentration: 670 },
      },
      {
        reply:
          '창문을 조금만 더 열면 공기질이 더 좋아질 것 같아요. 환기 상태를 유지해 주세요.',
        status: 'Normal' as const,
        sensorData: { temperature: 26.2, humidity: 62.0, gasConcentration: 720 },
      },
      {
        reply:
          '가스 농도가 일시적으로 상승했어요. 안전을 위해 환기를 권장합니다.',
        status: 'Warning' as const,
        sensorData: { temperature: 27.1, humidity: 65.0, gasConcentration: 1050 },
      },
    ];
    const pick = samples[Math.floor(Math.random() * samples.length)];
    const delay = ChatbotUtils.calculateTypingDelay(text);
    await new Promise((r) => setTimeout(r, delay));
    return {
      success: true as const,
      reply: pick.reply,
      status: pick.status,
      sensorData: pick.sensorData,
      timestamp: new Date().toISOString(),
      route: 'mock',
      processingTime: delay / 1000,
    };
  },
};
