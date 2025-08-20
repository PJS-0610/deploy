// src/services/hooks/UseChatbot.ts

import { useState, useEffect, useRef, useCallback } from 'react';
import { ChatbotState, ChatMessage, ChatbotUtils } from './ChatbotTypes';
import { ChatbotAPI } from './ChatbotAPI';

const INITIAL_STATE: ChatbotState = {
  messages: [],
  isLoading: false,
  isTyping: false,
  inputMessage: '',
  error: null,
  modelStatus: 'Loading',
  isConnected: false,
};

export const useChatbot = () => {
  const [chatbotState, setChatbotState] = useState<ChatbotState>(INITIAL_STATE);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const sessionIdRef = useRef<string | null>(null);

  // 컴포넌트 마운트 시 초기 설정
  useEffect(() => {
    initializeChatbot();
  }, []);

  // 메시지가 업데이트될 때마다 스크롤을 맨 아래로
  useEffect(() => {
    scrollToBottom();
  }, [chatbotState.messages, chatbotState.isTyping]);

  // 메시지가 변경될 때마다 localStorage에 저장
  useEffect(() => {
    if (chatbotState.messages.length > 0) {
      try {
        const { saveChatMessages } = require('../utils/sessionUtils');
        saveChatMessages(chatbotState.messages);
        console.log('💾 Saved messages to localStorage:', chatbotState.messages.length);
      } catch (error) {
        console.warn('Failed to save messages:', error);
      }
    }
  }, [chatbotState.messages]);

  // 챗봇 초기화
  const initializeChatbot = async () => {
    try {
      setChatbotState(prev => ({ ...prev, modelStatus: 'Loading' }));
      
      // 세션 상태 확인
      let shouldStartNew = false;
      try {
        const { getChatbotSessionState } = require('../utils/sessionUtils');
        const state = getChatbotSessionState();
        
        // 5분 이상 지났고 이전에 챗봇에 있었다면 새 채팅 시작
        if (state.shouldShowHistory && state.wasInChatbot) {
          shouldStartNew = true;
          console.log('🔄 Starting new chat after being away');
        }
      } catch (error) {
        console.warn('Failed to check session state:', error);
      }
      
      // 저장된 메시지 로드 (새 채팅 시작하지 않는 경우에만)
      let savedMessages: ChatMessage[] = [];
      if (!shouldStartNew) {
        try {
          const { loadChatMessages } = require('../utils/sessionUtils');
          savedMessages = loadChatMessages();
          console.log('💾 Loaded saved messages:', savedMessages.length);
        } catch (error) {
          console.warn('Failed to load saved messages:', error);
        }
      }
      
      // 건강 상태 확인
      const healthStatus = await ChatbotAPI.checkHealth();
      
      if (healthStatus.status === 'healthy') {
        // 새 채팅 시작이거나 저장된 메시지가 없으면 웰컴 메시지 생성
        let initialMessages: ChatMessage[] = [];
        
        if (shouldStartNew || savedMessages.length === 0) {
          // 이전 대화 메시지 삭제하고 새 채팅 시작
          if (shouldStartNew) {
            try {
              const { clearChatMessages, setShouldShowHistory } = require('../utils/sessionUtils');
              clearChatMessages();
              setShouldShowHistory(false);
            } catch (error) {
              console.warn('Failed to clear old messages:', error);
            }
          }
          
          // 센서 데이터를 포함한 웰컴 메시지 생성
          const welcomeMessage = await ChatbotUtils.createWelcomeMessageWithSensorData();
          initialMessages = [welcomeMessage];
          console.log('🎉 Started new conversation');
        } else {
          initialMessages = savedMessages;
          console.log('🔄 Restored previous conversation');
        }
        
        setChatbotState(prev => ({
          ...prev,
          modelStatus: 'Active',
          isConnected: true,
          messages: initialMessages,
        }));
      } else {
        throw new Error(healthStatus.error || 'Chatbot is not available');
      }
    } catch (error) {
      console.error('Failed to initialize chatbot:', error);
      setChatbotState(prev => ({
        ...prev,
        modelStatus: 'Inactive',
        isConnected: false,
        error: 'Failed to connect to chatbot service',
      }));
    }
  };

  // 스크롤을 맨 아래로 이동
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // 메시지 전송
  const sendMessage = useCallback(async (text?: string) => {
    const messageText = text || chatbotState.inputMessage.trim();
    
    // 입력 검증
    const validation = ChatbotUtils.validateMessage(messageText);
    if (!validation.isValid) {
      setChatbotState(prev => ({ ...prev, error: validation.error }));
      return;
    }

    // 사용자 메시지 추가
    const userMessage: ChatMessage = {
      id: ChatbotUtils.generateMessageId(),
      sender: 'user',
      message: messageText,
      timestamp: new Date().toISOString(),
    };

    setChatbotState(prev => ({
      ...prev,
      messages: [...prev.messages, userMessage],
      inputMessage: '',
      isLoading: true,
      isTyping: true,
      error: null,
    }));

    try {
      // API 호출 (세션 ID는 헤더로 자동 전달됨)
      const response = await ChatbotAPI.sendMessage(messageText);
      
      // 세션 ID 저장
      if (response.session_id) {
        sessionIdRef.current = response.session_id;
      }

      // 봇 응답을 ChatMessage 형식으로 변환
      const botMessage: ChatMessage = {
        id: ChatbotUtils.generateMessageId(),
        sender: 'bot',
        message: response.answer,
        timestamp: new Date().toISOString(),
        status: mapRouteToStatus(response.route),
        sensorData: extractSensorDataFromResponse(response.answer),
        route: response.route, // route 정보 추가
      };

      // 타이핑 딜레이 추가 (자연스러운 사용자 경험)
      const typingDelay = ChatbotUtils.calculateTypingDelay(response.answer);
      
      setTimeout(() => {
        setChatbotState(prev => ({
          ...prev,
          messages: [...prev.messages, botMessage],
          isLoading: false,
          isTyping: false,
        }));
      }, typingDelay);

    } catch (error) {
      console.error('Failed to send message:', error);
      
      // 에러 메시지 추가
      const errorMessage: ChatMessage = {
        id: ChatbotUtils.generateMessageId(),
        sender: 'bot',
        message: '죄송합니다. 메시지 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
        timestamp: new Date().toISOString(),
        status: 'Warning',
        route: 'error', // 에러 route 추가
      };

      setTimeout(() => {
        setChatbotState(prev => ({
          ...prev,
          messages: [...prev.messages, errorMessage],
          isLoading: false,
          isTyping: false,
          error: error instanceof Error ? error.message : 'Unknown error occurred',
        }));
      }, 1000);
    }
  }, [chatbotState.inputMessage]);

  // 입력값 변경 핸들러
  const handleInputChange = useCallback((value: string) => {
    setChatbotState(prev => ({ ...prev, inputMessage: value, error: null }));
  }, []);

  // 키보드 입력 핸들러
  const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      if (!chatbotState.isLoading && chatbotState.inputMessage.trim()) {
        sendMessage();
      }
    }
  }, [chatbotState.isLoading, chatbotState.inputMessage, sendMessage]);

  // 연결 재시도
  const retryConnection = useCallback(() => {
    initializeChatbot();
  }, []);

  // 채팅 히스토리 초기화
  const clearHistory = useCallback(async () => {
    // localStorage에서 저장된 메시지 삭제
    try {
      const { clearChatMessages } = require('../utils/sessionUtils');
      clearChatMessages();
      console.log('🗑️ Cleared saved messages from localStorage');
    } catch (error) {
      console.warn('Failed to clear saved messages:', error);
    }

    const welcomeMessage = await ChatbotUtils.createWelcomeMessageWithSensorData();
    setChatbotState(prev => ({
      ...prev,
      messages: [welcomeMessage],
      error: null,
    }));
    sessionIdRef.current = null;
  }, []);

  // 히스토리 로드 함수
  const loadChatHistory = useCallback(async (turns: any[]) => {
    try {
      // 히스토리 턴을 ChatMessage 형식으로 변환
      const historyMessages: ChatMessage[] = [];
      
      // 웰컴 메시지 유지
      const welcomeMessage = await ChatbotUtils.createWelcomeMessageWithSensorData();
      historyMessages.push(welcomeMessage);

      // 턴 데이터를 메시지로 변환
      for (const turn of turns) {
        // 사용자 메시지 추가
        const userMessage: ChatMessage = {
          id: `${turn.session_id}-${turn.turn_id}-user`,
          sender: 'user',
          message: turn.query,
          timestamp: turn.ts_kst,
        };
        historyMessages.push(userMessage);

        // 봇 메시지 추가
        const botMessage: ChatMessage = {
          id: `${turn.session_id}-${turn.turn_id}-bot`,
          sender: 'bot',
          message: turn.answer,
          timestamp: turn.ts_kst,
          status: turn.route === 'error' ? 'Warning' : 'Good',
          route: turn.route, // 히스토리에서도 route 정보 추가
        };
        historyMessages.push(botMessage);
      }

      setChatbotState(prev => ({
        ...prev,
        messages: historyMessages,
        error: null,
      }));

    } catch (error) {
      console.error('Failed to load chat history:', error);
      setChatbotState(prev => ({
        ...prev,
        error: '히스토리를 불러올 수 없습니다.',
      }));
    }
  }, []);

  return {
    chatbotState,
    messagesEndRef,
    sendMessage,
    handleInputChange,
    handleKeyDown,
    retryConnection,
    clearHistory,
    loadChatHistory,
  };
};

// 라우트를 상태로 매핑하는 헬퍼 함수
function mapRouteToStatus(route: string): 'Good' | 'Normal' | 'Warning' {
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

// 응답에서 센서 데이터 추출하는 헬퍼 함수
function extractSensorDataFromResponse(response: string) {
  // 응답 텍스트에서 센서 데이터 패턴을 찾아 추출
  const tempMatch = response.match(/온도[:\s]*([0-9.]+)[°℃]/);
  const humMatch = response.match(/습도[:\s]*([0-9.]+)[%]/);
  const gasMatch = response.match(/CO2[:\s]*([0-9.]+)[ppm]/);

  if (tempMatch || humMatch || gasMatch) {
    return {
      temperature: tempMatch ? parseFloat(parseFloat(tempMatch[1]).toFixed(1)) : parseFloat((Math.random() * 10 + 20).toFixed(1)),
      humidity: humMatch ? parseFloat(parseFloat(humMatch[1]).toFixed(1)) : parseFloat((Math.random() * 30 + 40).toFixed(1)),
      gasConcentration: gasMatch ? parseFloat(parseFloat(gasMatch[1]).toFixed(1)) : parseFloat((Math.random() * 400 + 600).toFixed(1)),
    };
  }

  return undefined;
}