/**
 * ═══════════════════════════════════════════════════════════════
 * 🤖 UseChatbot Hook - 챗봇 API 통신 및 상태 관리 훅
 * ═══════════════════════════════════════════════════════════════
 * 
 * 주요 기능:
 * - 백엔드 챗봇 API와의 실시간 통신 관리
 * - 메시지 전송/수신 및 대화 이력 관리
 * - 타이핑 인디케이터 및 로딩 상태 처리
 * - 에러 핸들링 및 사용자 입력 검증
 * 
 * API 연동 상세:
 * - POST /chatbot/ask: 사용자 질문 전송 및 답변 수신
 * - 실시간 타이핑 효과 시뮬레이션
 * - 세션 기반 대화 연속성 유지
 * - 센서 데이터 관련 질문 특화 처리
 * 
 * 사용법:
 * ```typescript
 * const { chatbotState, sendMessage, handleInputChange } = useChatbot();
 * ```
 */

// hooks/useChatbot.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { ChatbotState, ChatMessage, ChatbotAPI, ChatbotUtils } from '../../../services/ChatbotTypes';

export const useChatbot = () => {
  /**
   * 🗂️ 챗봇 전체 상태 관리
   * 메시지, 로딩, 타이핑, 에러 등 모든 상태를 중앙 집중식으로 관리
   */
  const [chatbotState, setChatbotState] = useState<ChatbotState>({
    messages: [],           // 전체 대화 메시지 배열
    isLoading: false,       // API 호출 로딩 상태
    isTyping: false,        // 챗봇 타이핑 인디케이터 상태
    inputMessage: '',       // 현재 입력 중인 메시지
    error: null,            // 에러 메시지
    modelStatus: 'Active',  // 챗봇 모델 상태
    isConnected: false      // 백엔드 연결 상태
  });

  // 메시지 리스트 자동 스크롤용 ref
  const messagesEndRef = useRef<HTMLDivElement>(null);

  /**
   * 📜 메시지 영역 자동 스크롤 기능
   * 새 메시지가 추가될 때마다 자동으로 맨 아래로 스크롤
   */
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  /**
   * 📤 메시지 전송 및 챗봇 API 호출 함수
   * 
   * 상세 처리 과정:
   * 1. 사용자 입력 메시지 검증 (길이, 내용 체크)
   * 2. 사용자 메시지를 대화 목록에 추가
   * 3. 로딩/타이핑 상태 활성화
   * 4. POST /chatbot/ask API 호출 (Python 챗봇 모듈)
   * 5. 응답 처리 및 봇 메시지 추가
   * 6. 타이핑 효과 시뮬레이션
   * 
   * API 연동 구조:
   * - 현재: ChatbotAPI.generateMockResponse() (개발용 목 응답)
   * - 실제: apiService.askChatbot() (프로덕션 API 호출)
   */
  const sendMessage = useCallback(async () => {
    const message = chatbotState.inputMessage.trim();
    
    // 1. 메시지 검증 (빈 메시지, 길이 제한 등)
    const validation = ChatbotUtils.validateMessage(message);
    if (!validation.isValid) {
      setChatbotState(prev => ({ ...prev, error: validation.error || null }));
      return;
    }

    // 2. 사용자 메시지 객체 생성
    const userMessage: ChatMessage = {
      id: ChatbotUtils.generateMessageId(),
      message,
      sender: 'user',
      timestamp: new Date().toISOString()
    };

    // 3. 상태 업데이트: 메시지 추가 + 로딩 시작
    setChatbotState(prev => ({
      ...prev,
      messages: [...prev.messages, userMessage],
      inputMessage: '',     // 입력 필드 클리어
      isLoading: true,      // 로딩 상태 활성화
      isTyping: true,       // 타이핑 인디케이터 활성화
      error: null           // 이전 에러 클리어
    }));

    try {
      // 4. 챗봇 API 호출
      // TODO: 프로덕션에서는 apiService.askChatbot(message) 사용
      const response = await ChatbotAPI.generateMockResponse(message);
      
      if ('success' in response && response.success) {
        // 5. 타이핑 효과를 위한 지연 계산
        const typingDelay = ChatbotUtils.calculateTypingDelay(response.reply);
        
        // 6. 타이핑 효과 후 봇 응답 표시
        setTimeout(() => {
          const botMessage: ChatMessage = {
            id: ChatbotUtils.generateMessageId(),
            message: response.reply,
            sender: 'bot',
            timestamp: response.timestamp,
            sensorData: response.sensorData,  // 센서 데이터 (있을 경우)
            status: response.status           // 응답 상태
          };

          // 7. 봇 메시지 추가 및 로딩 종료
          setChatbotState(prev => ({
            ...prev,
            messages: [...prev.messages, botMessage],
            isLoading: false,   // 로딩 상태 비활성화
            isTyping: false     // 타이핑 인디케이터 비활성화
          }));
        }, typingDelay);
      } else {
        const msg = 'error' in response ? (response as any).error : 'Unknown error';
        throw new Error(String(msg));
      }
    } catch (error) {
      // 8. 에러 처리: 로딩 종료 및 에러 메시지 설정
      setChatbotState(prev => ({
        ...prev,
        isLoading: false,
        isTyping: false,
        error: error instanceof Error ? error.message : '답변을 생성할 수 없습니다.'
      }));
    }
  }, [chatbotState.inputMessage]);

  // 입력 필드 변경 핸들러
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (value.length <= 300) {
      setChatbotState(prev => ({ 
        ...prev, 
        inputMessage: value,
        error: null 
      }));
    }
  }, []);

  // 키보드 이벤트 핸들러
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!chatbotState.isLoading && chatbotState.inputMessage.trim()) {
        sendMessage();
      }
    }
  }, [chatbotState.isLoading, chatbotState.inputMessage, sendMessage]);

  // 컴포넌트 마운트 시 초기화
  useEffect(() => {
    // 환영 메시지 추가
    const welcomeMessage = ChatbotUtils.createWelcomeMessage();
    setChatbotState(prev => ({
      ...prev,
      messages: [welcomeMessage]
    }));
  }, []);

  // 메시지 추가 시 스크롤
  useEffect(() => {
    scrollToBottom();
  }, [chatbotState.messages, chatbotState.isTyping, scrollToBottom]);

  // 메시지 히스토리 저장
  useEffect(() => {
    if (chatbotState.messages.length > 0) {
      ChatbotUtils.saveMessageHistory(chatbotState.messages);
    }
  }, [chatbotState.messages]);

  return {
    chatbotState,
    messagesEndRef,
    sendMessage,
    handleInputChange,
    handleKeyDown
  };
};