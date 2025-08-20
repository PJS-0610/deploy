// src/utils/sessionUtils.ts
// 세션 ID 관리 유틸리티

import { v4 as uuidv4 } from 'uuid';

const SESSION_STORAGE_KEY = 'chatbot_session_id';
const SESSION_TIMESTAMP_KEY = 'chatbot_session_timestamp';
const SESSION_MESSAGES_KEY = 'chatbot_session_messages';
const SESSION_EXPIRY_HOURS = 24; // 24시간 후 세션 만료

/**
 * 새로운 세션 ID 생성
 */
export const generateSessionId = (): string => {
  return uuidv4();
};

/**
 * 세션이 만료되었는지 확인
 */
const isSessionExpired = (): boolean => {
  try {
    const timestampStr = localStorage.getItem(SESSION_TIMESTAMP_KEY);
    if (!timestampStr) return true;
    
    const timestamp = parseInt(timestampStr, 10);
    const now = Date.now();
    const expiryTime = SESSION_EXPIRY_HOURS * 60 * 60 * 1000; // 시간을 밀리초로 변환
    
    return (now - timestamp) > expiryTime;
  } catch (error) {
    console.warn('Failed to check session expiry:', error);
    return true;
  }
};

/**
 * 세션 타임스탬프 업데이트
 */
const updateSessionTimestamp = (): void => {
  try {
    localStorage.setItem(SESSION_TIMESTAMP_KEY, Date.now().toString());
  } catch (error) {
    console.warn('Failed to update session timestamp:', error);
  }
};

/**
 * 현재 세션 ID 조회 (없거나 만료되었으면 새로 생성하여 저장)
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
 * 세션 ID 삭제 (로그아웃 등에 사용)
 */
export const clearSessionId = (): void => {
  try {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    localStorage.removeItem(SESSION_TIMESTAMP_KEY);
    localStorage.removeItem(SESSION_MESSAGES_KEY);
  } catch (error) {
    console.warn('Failed to clear session ID from localStorage:', error);
  }
};

/**
 * 특정 세션 ID 설정 (테스트 등에 사용)
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
 * 세션 활성화 (대화할 때마다 호출하여 세션 연장)
 */
export const refreshSession = (): void => {
  updateSessionTimestamp();
};

/**
 * 현재 세션의 대화 메시지 저장
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
 * 현재 세션의 저장된 대화 메시지 불러오기
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
 * 현재 세션의 저장된 대화 메시지 삭제
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