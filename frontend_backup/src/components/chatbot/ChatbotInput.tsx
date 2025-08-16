/**
 * ═══════════════════════════════════════════════════════════════
 * 💬 ChatbotInput - 챗봇 메시지 입력 컴포넌트
 * ═══════════════════════════════════════════════════════════════
 * 
 * 주요 기능:
 * - 사용자 메시지 입력 및 전송
 * - 실시간 글자 수 제한 (300자)
 * - Enter 키를 통한 빠른 전송 (Shift+Enter는 줄바꿈)
 * - 로딩 중 입력 비활성화
 * - 에러 메시지 표시
 * - 접근성 지원 (aria-label)
 * 
 * API 연동:
 * - onSendMessage: 부모 컴포넌트의 메시지 전송 함수 호출
 * - onInputChange: 입력 값 변경 시 실시간 업데이트
 * - onKeyDown: 키보드 이벤트 처리 (Enter, Shift+Enter)
 * 
 * 사용자 경험:
 * - 자동 포커스 (컴포넌트 로드 시)
 * - 글자 수 표시 (200자 이상 시 경고, 250자 이상 시 에러)
 * - 전송 버튼 활성/비활성 상태 관리
 */

// components/chatbot/ChatbotInput.tsx
import React, { useRef, useEffect } from 'react';
import { Paperclip, Send } from 'lucide-react';
import styles from './ChatbotInput.module.css';

/**
 * 🎛️ ChatbotInput Props 타입 정의
 * 부모 컴포넌트(ChatbotScreen)와의 인터페이스
 */
interface ChatbotInputProps {
  inputMessage: string;                                                    // 현재 입력된 메시지
  isLoading: boolean;                                                      // 메시지 전송 중 로딩 상태
  onInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;      // 입력 변경 핸들러
  onKeyDown: (e: React.KeyboardEvent) => void;                             // 키보드 이벤트 핸들러
  onSendMessage: () => void;                                               // 메시지 전송 함수
  error?: string | null;                                                   // 에러 메시지 (선택적)
}

/**
 * 🎯 메인 ChatbotInput 컴포넌트
 * 사용자의 메시지 입력과 전송을 담당하는 핵심 UI 컴포넌트
 */
const ChatbotInput: React.FC<ChatbotInputProps> = ({
  inputMessage,    // 현재 입력된 메시지 텍스트
  isLoading,       // API 호출 중 로딩 상태
  onInputChange,   // 텍스트 변경 이벤트 핸들러
  onKeyDown,       // 키보드 이벤트 핸들러 (Enter 등)
  onSendMessage,   // 메시지 전송 함수
  error            // 에러 메시지 (API 호출 실패 등)
}) => {
  /**
   * 📝 입력 필드 참조
   * 자동 포커스 및 프로그래밍 방식 조작을 위한 ref
   */
  const inputRef = useRef<HTMLTextAreaElement>(null);

  /**
   * 🎬 컴포넌트 초기화
   * 마운트 시 입력 필드에 자동 포커스 설정
   */
  useEffect(() => {
    // 약간의 딜레이를 두어 다른 초기화 작업 완료 후 포커스
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  }, []);

  /**
   * 📊 입력 상태 계산
   * 전송 가능 여부와 글자 수 제한 상태를 계산
   */
  const canSend = inputMessage.trim().length > 0 && !isLoading;            // 전송 버튼 활성화 조건
  const charCount = inputMessage.length;                                   // 현재 글자 수
  const charCountClass = charCount > 250 ? 'error' : charCount > 200 ? 'warning' : ''; // 글자 수에 따른 스타일 클래스

  return (
    <>
      {/* ❌ API 에러 메시지 표시 영역 */}
      {error && (
        <div className={styles.chatbotErrorMessage}>
          {error}  {/* 챗봇 API 호출 실패, 네트워크 오류 등의 메시지 표시 */}
        </div>
      )}

      {/* 📝 메시지 입력 컨테이너 */}
      <div className={styles.chatbotInputContainer}>
        <div className={styles.chatbotInputWrapper}>
          {/* 📎 파일 첨부 버튼 (향후 확장 기능용) */}
          <button 
            className={styles.chatbotAttachButton}
            aria-label="파일 첨부"
            title="파일 첨부 (준비 중)"
          >
            <Paperclip size={18} />
          </button>
          
          {/* 💬 메시지 입력 필드 및 글자 수 카운터 */}
          <div style={{ position: 'relative', flex: 1 }}>
            <textarea
              ref={inputRef}                                    // 자동 포커스용 참조
              className={styles.chatbotInputField}
              value={inputMessage}                              // 현재 입력된 메시지
              onChange={onInputChange}                          // 입력 변경 시 상태 업데이트
              onKeyDown={onKeyDown}                             // Enter 키 등 키보드 이벤트 처리
              placeholder="Write message"                       // 플레이스홀더 텍스트
              rows={1}                                          // 기본 1줄 높이
              disabled={isLoading}                              // 로딩 중 입력 비활성화
            />
            {/* 📊 실시간 글자 수 표시 (200자 이상 경고, 250자 이상 에러) */}
            <div className={`${styles.chatbotCharCounter} ${charCountClass}`}>
              {charCount}/300
            </div>
          </div>
          
          {/* 📤 메시지 전송 버튼 */}
          <button 
            className={styles.chatbotSendButton}
            onClick={onSendMessage}                             // 클릭 시 메시지 전송
            disabled={!canSend}                                 // 빈 메시지나 로딩 중일 때 비활성화
            aria-label="메시지 전송"
            title={canSend ? "메시지 전송" : "메시지를 입력하세요"}
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </>
  );
};

export default ChatbotInput;