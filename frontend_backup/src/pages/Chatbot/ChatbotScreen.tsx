/**
 * ═══════════════════════════════════════════════════════════════
 * 🤖 ChatbotScreen - 고급 AI 챗봇 인터페이스 화면
 * ═══════════════════════════════════════════════════════════════
 * 
 * 실시간 AI 챗봇과 사용자 간의 대화를 관리하는 핵심 컴포넌트입니다.
 * 세션 기반 대화 관리, 히스토리 추적, 실시간 UI 업데이트를 제공합니다.
 * 
 * 🚀 주요 기능:
 * - 실시간 AI 대화 처리 및 응답 표시
 * - 세션별 대화 내역 자동 저장 및 복원
 * - 확장 가능한 히스토리 패널로 이전 대화 탐색
 * - 실시간 타이핑 인디케이터 및 사용자 피드백
 * - 알림 시스템 및 관리자 메뉴 통합
 * - 반응형 레이아웃 및 접근성 지원
 * 
 * 🏗️ 아키텍처:
 * - 사이드바: 애플리케이션 네비게이션
 * - 히스토리 패널: 이전 대화 세션 관리 (토글 가능)
 * - 메인 챗봇 영역: 현재 대화 인터페이스
 * - 헤더: 알림, 관리자 메뉴, 현재 시간 표시
 * 
 * 📱 상태 관리:
 * - 로컬 상태: UI 토글, 알림 데이터
 * - 세션 상태: localStorage 기반 지속성
 * - 챗봇 상태: 커스텀 훅을 통한 중앙집중식 관리
 * 
 * 🔗 연관 컴포넌트:
 * - useChatbot: 핵심 챗봇 로직 및 상태 관리
 * - ChatbotHistoryPanel: 대화 히스토리 UI
 * - ChatbotComponents: 재사용 가능한 챗봇 UI 요소들
 */

import React, { useState, useEffect } from 'react';
import { Bell, User, ChevronDown } from 'lucide-react';
import { Sidebar } from '../../components/Common/Sidebar';
import NotificationDropdown from '../../components/Common/Dropdown/NotificationDropdown';
import AdminDropdown from '../../components/Common/Dropdown/AdminDropdown';
import { ChatbotScreenProps, NotificationData } from '../../Services/ChatbotTypes';
import styles from "./ChatbotScreen.module.css";
import { useChatbot } from '../../Services/UseChatbot';
// 히스토리 패널 - 이전 대화 세션 탐색 및 복원 기능
import ChatbotHistoryPanel from '../../Hooks/ChatbotHistoryPanel';
import {
  ChatbotHeader,
  MessageItem,
  TypingIndicator,
  ChatbotInput,
} from '../../Hooks/ChatbotComponents';

/**
 * 🤖 ChatbotScreen 메인 컴포넌트
 * 
 * Props를 통해 네비게이션 콜백과 현재 활성 메뉴 상태를 받아
 * 완전한 챗봇 인터페이스를 렌더링합니다.
 * 
 * @param onNavigateToHistory 히스토리 페이지로 이동하는 콜백
 * @param onNavigateToRole 역할 선택 페이지로 이동하는 콜백  
 * @param onNavigateToDashboard 대시보드로 이동하는 콜백
 * @param onNavigateToSettings 설정 페이지로 이동하는 콜백
 * @param activeMenu 현재 활성화된 메뉴 항목
 * @param setActiveMenu 활성 메뉴를 변경하는 함수
 */
const ChatbotScreen: React.FC<ChatbotScreenProps> = ({ 
  onNavigateToHistory,
  onNavigateToRole,
  onNavigateToDashboard,
  onNavigateToSettings,
  activeMenu,
  setActiveMenu,
}) => {

  /**
   * ⏰ 실시간 현재 시간 표시 커스텀 훅
   * 
   * 1분마다 자동으로 업데이트되는 현재 시간을 제공합니다.
   * 한국 시간대 기준으로 24시간 형식으로 포맷팅됩니다.
   * 
   * 📊 성능 최적화:
   * - 1분 간격 업데이트로 불필요한 리렌더링 방지
   * - 컴포넌트 언마운트 시 타이머 정리로 메모리 누수 방지
   * 
   * @returns 포맷팅된 현재 시간 문자열 (예: "2024-03-15 14:30:25")
   */
  const useCurrentTime = () => {
    const [now, setNow] = useState(() => new Date());
    useEffect(() => {
      const t = setInterval(() => setNow(new Date()), 60_000); // 1분마다 업데이트
      return () => clearInterval(t); // 정리 함수로 메모리 누수 방지
    }, []);
    return now.toLocaleString('ko-KR', { hour12: false }); // 한국 시간대, 24시간 형식
  };

  /**
   * 🧠 챗봇 핵심 로직 및 상태 관리 훅
   * 
   * 챗봇의 모든 핵심 기능을 중앙집중식으로 관리하는 커스텀 훅입니다.
   * 메시지 송수신, 상태 관리, 히스토리 처리 등을 담당합니다.
   * 
   * 🔧 제공되는 기능:
   * - chatbotState: 현재 챗봇 상태 (메시지, 로딩, 에러 등)
   * - messagesEndRef: 자동 스크롤을 위한 메시지 끝 참조
   * - sendMessage: 사용자 메시지 전송 함수
   * - handleInputChange: 입력 필드 변경 처리
   * - handleKeyDown: 키보드 이벤트 (Enter 키 등) 처리
   * - loadChatHistory: 이전 대화 내역 불러오기
   * - clearHistory: 현재 대화 내역 초기화
   */
  const {
    chatbotState,
    messagesEndRef,
    sendMessage,
    handleInputChange,
    handleKeyDown,
    loadChatHistory,
    clearHistory
  } = useChatbot();

  // 헤더에 표시될 현재 시간 정보
  const currentTime = useCurrentTime();

  /**
   * 📂 히스토리 패널 확장/축소 상태
   * 
   * 사용자가 이전 대화 내역을 볼 수 있는 히스토리 패널의
   * 표시 여부를 제어합니다. 기본값은 축소 상태(false)입니다.
   */
  const [isHistoryExpanded, setIsHistoryExpanded] = useState(false);

  /**
   * 🔄 페이지 라이프사이클 및 세션 상태 관리 Effect
   * 
   * 컴포넌트 마운트/언마운트 시 세션 상태를 적절히 관리하고,
   * 사용자의 이전 방문 패턴에 따라 히스토리 패널을 자동으로 표시합니다.
   * 
   * 📋 마운트 시 수행 작업:
   * 1. 세션 상태 조회 (이전 방문 정보 확인)
   * 2. 조건부 히스토리 패널 자동 열기
   *    - 5분 이상 비활성 상태였고
   *    - 이전에 챗봇 페이지를 방문했던 경우
   * 3. 현재 챗봇 페이지 방문 상태 기록
   * 
   * 🧹 언마운트 시 정리 작업:
   * - 챗봇 페이지 이탈 상태 기록
   * - 다음 방문 시 적절한 UX 제공을 위한 상태 저장
   * 
   * 🛡️ 에러 처리:
   * - sessionUtils 로딩 실패 시 graceful degradation
   * - localStorage 접근 오류 시 기본 동작 유지
   */
  useEffect(() => {
    try {
      const { getChatbotSessionState, setChatbotVisitState } = require('../../Utils/sessionUtils');
      const state = getChatbotSessionState();
      
      // 5분 이상 지났고 이전에 챗봇에 있었다면 히스토리 패널 자동 열기
      // 사용자에게 연속성 있는 경험 제공
      if (state.shouldShowHistory && state.wasInChatbot) {
        setIsHistoryExpanded(true);
      }
      
      // 현재 챗봇 페이지 방문 상태 기록 (세션 추적용)
      setChatbotVisitState(true);
    } catch (error) {
      console.warn('Failed to manage chatbot visit state:', error);
    }

    // 컴포넌트 언마운트 시 정리 함수
    return () => {
      try {
        const { setChatbotVisitState } = require('../../Utils/sessionUtils');
        setChatbotVisitState(false); // 챗봇 페이지 이탈 기록
      } catch (error) {
        console.warn('Failed to update visit state on unmount:', error);
      }
    };
  }, []); // 빈 의존성 배열로 마운트/언마운트 시에만 실행

  // 기존 UI 상태 관리 (변경 없음)
  const [notificationData, setNotificationData] = useState<NotificationData>({
    count: 0,
    notifications: []
  });
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isAdminMenuOpen, setIsAdminMenuOpen] = useState(false);

  // 🆕 히스토리 패널 토글 함수
  const handleHistoryToggle = () => {
    setIsHistoryExpanded(prev => !prev);
  };

  // 🗑️ 개별 알림 삭제 함수
  const handleDeleteNotification = (notificationId: string) => {
    setNotificationData(prevData => {
      const updatedNotifications = prevData.notifications.filter(n => n.id !== notificationId);
      return {
        count: updatedNotifications.filter(n => !n.read).length,
        notifications: updatedNotifications
      };
    });
  };

  // 🗑️ 전체 알림 삭제 함수
  const handleClearAllNotifications = () => {
    setNotificationData({
      count: 0,
      notifications: []
    });
  };

  // 🆕 현재 세션 ID 추출
  const getCurrentSessionId = (): string | null => {
    try {
      const { getSessionId } = require('../../Utils/sessionUtils');
      return getSessionId();
    } catch (error) {
      console.warn('Failed to get current session ID:', error);
      return null;
    }
  };

  // 🆕 세션 알림 메시지 생성
  const getSessionNotification = (): string => {
    // 🔧 여기에서 세션 알림 내용을 수정하세요
    const currentSessionId = getCurrentSessionId();
    if (!currentSessionId) {
      return "세션이 생성되지 않았습니다";
    }
    
    // 기본 알림 메시지 (원하는 내용으로 수정 가능)
    return `세션 활성화 (24시간 유지)`;
  };

  // 🆕 히스토리 로드 핸들러
  const handleHistoryLoad = (turns: any[]) => {
    if (loadChatHistory) {
      loadChatHistory(turns);
      // 히스토리 로드 후 패널 닫기
      setIsHistoryExpanded(false);
    }
  };

  // 🆕 새 채팅 시작 핸들러
  const handleNewChat = () => {
    if (clearHistory) {
      clearHistory();
      // 새 채팅 시작 후 패널 닫기
      setIsHistoryExpanded(false);
    }
  };

  // 메뉴 클릭 핸들러 (기존 코드, 변경 없음)
  const handleMenuClick = (label: string) => {
    setActiveMenu(label);

    switch (label) {
      case 'Dashboard':
        onNavigateToDashboard();
        break;
      case 'History':
        onNavigateToHistory();
        break;
      case 'Control':
      case 'Settings':
        onNavigateToSettings?.();
        break;
      case 'Chatbot':
        break;
      case 'Logout':
        onNavigateToRole?.();
        break;
      default:
        break;
    }
  };

  return (
    <div className={styles.dashboardContainer}>
      {/* 사이드바 (기존 코드, 변경 없음) */}
      <Sidebar 
        activeMenu={activeMenu}
        onMenuClick={handleMenuClick}
      />

      {/* 🆕 히스토리 패널 추가 */}
      <ChatbotHistoryPanel
        isExpanded={isHistoryExpanded}
        onToggle={handleHistoryToggle}
        currentSessionId={getCurrentSessionId()}
        onHistoryLoad={handleHistoryLoad}
      />

      {/* 🔄 메인 컨텐츠 영역 - 클래스명 수정으로 히스토리 패널과 조화 */}
      <main className={`${styles.mainContent} ${isHistoryExpanded ? styles.mainContentWithHistory : ''}`}>
        {/* 상단 헤더 (기존 코드, 변경 없음) */}
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <h1 className={styles.pageTitle}>{activeMenu}</h1>
            <p className={styles.pageSubtitle}>{currentTime}</p>
          </div>

          <div className={styles.headerRight}>
            {/* 알림 아이콘 (기존 코드) */}
            <div className={styles.headerItem}>
              <button
                onClick={() => {
                  setIsNotificationOpen(!isNotificationOpen);
                  setIsAdminMenuOpen(false);
                }}
                className={styles.headerButton}
                aria-label="알림"
              >
                <Bell size={20} />
                {notificationData.count > 0 && (
                  <span className={styles.notificationBadge}>
                    {notificationData.count > 99 ? '99+' : notificationData.count}
                  </span>
                )}
              </button>

              <NotificationDropdown
                isOpen={isNotificationOpen}
                onClose={() => setIsNotificationOpen(false)}
                notifications={notificationData.notifications}
                onDeleteNotification={handleDeleteNotification}
                onClearAllNotifications={handleClearAllNotifications}
              />
            </div>

            {/* 관리자 메뉴 (기존 코드) */}
            <div className={styles.headerItem}>
              <button
                onClick={() => {
                  setIsAdminMenuOpen(!isAdminMenuOpen);
                  setIsNotificationOpen(false);
                }}
                className={styles.adminButton}
                aria-label="관리자 메뉴"
              >
                <User size={20} />
                <span>관리자</span>
                <ChevronDown size={16} />
              </button>

              <AdminDropdown
                isOpen={isAdminMenuOpen}
                onClose={() => setIsAdminMenuOpen(false)}
                onLogout={onNavigateToRole}
              />
            </div>
          </div>
        </header>

        {/* 메인 챗봇 컨텐츠 (기존 코드, 변경 없음) */}
        <div className={styles.dashboardContent}>
          <div className={styles.chatbotContainer}>
            {/* 챗봇 헤더 */}
            <ChatbotHeader
              modelStatus={chatbotState.modelStatus as 'Active' | 'Inactive' | 'Loading'}
              onNewChat={handleNewChat}
              sessionNotification={getSessionNotification()}
            />

            {/* 메시지 영역 */}
            <div className={styles.chatbotMessagesContainer}>
              <div className={styles.chatbotMessages}>
                {chatbotState.messages.map((message) => (
                  <MessageItem key={message.id} message={message} />
                ))}
                
                {chatbotState.isTyping && <TypingIndicator />}
                
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* 입력 영역 */}
            <ChatbotInput 
              inputMessage={chatbotState.inputMessage}
              isLoading={chatbotState.isLoading}
              onInputChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onSendMessage={sendMessage}
              error={chatbotState.error}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default ChatbotScreen;