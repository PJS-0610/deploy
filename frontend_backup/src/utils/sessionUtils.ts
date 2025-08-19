// src/utils/sessionUtils.ts
// 세션 ID 관리 유틸리티

import { v4 as uuidv4 } from 'uuid';

const SESSION_STORAGE_KEY = 'chatbot_session_id';

/**
 * 새로운 세션 ID 생성
 */
export const generateSessionId = (): string => {
  return uuidv4();
};

/**
 * 현재 세션 ID 조회 (없으면 새로 생성하여 저장)
 */
export const getSessionId = (): string => {
  try {
    // localStorage에서 기존 세션 ID 조회
    const existingSessionId = localStorage.getItem(SESSION_STORAGE_KEY);
    
    if (existingSessionId && existingSessionId.trim()) {
      return existingSessionId;
    }
    
    // 기존 세션이 없으면 새로 생성
    const newSessionId = generateSessionId();
    localStorage.setItem(SESSION_STORAGE_KEY, newSessionId);
    
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
  } catch (error) {
    console.warn('Failed to set session ID in localStorage:', error);
  }
};