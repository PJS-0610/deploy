// ChatbotScreen.tsx - 챗봇 화면 컴포넌트 (히스토리 패널 추가)

import React, { useState, useEffect } from 'react';
import { Bell, User, ChevronDown } from 'lucide-react';
import { Sidebar } from '../../components/Common/Sidebar';
import NotificationDropdown from '../../components/Common/Dropdown/NotificationDropdown';
import AdminDropdown from '../../components/Common/Dropdown/AdminDropdown';
import { ChatbotScreenProps, NotificationData } from '../../Services/ChatbotTypes';
import styles from "./ChatbotScreen.module.css";
import { useChatbot } from '../../Services/UseChatbot';
// 🆕 히스토리 패널 추가
import ChatbotHistoryPanel from '../../Hooks/ChatbotHistoryPanel';
import {
  ChatbotHeader,
  MessageItem,
  TypingIndicator,
  ChatbotInput,
} from '../../Hooks/ChatbotComponents';

const ChatbotScreen: React.FC<ChatbotScreenProps> = ({ 
  onNavigateToHistory,
  onNavigateToRole,
  onNavigateToDashboard,
  onNavigateToSettings,
  activeMenu,
  setActiveMenu,
}) => {

  // 현재 시간 표시용 훅 (기존 코드)
  const useCurrentTime = () => {
    const [now, setNow] = useState(() => new Date());
    useEffect(() => {
      const t = setInterval(() => setNow(new Date()), 60_000);
      return () => clearInterval(t);
    }, []);
    return now.toLocaleString('ko-KR', { hour12: false });
  };

  // 기존 챗봇 훅 - 히스토리 로드 함수 추가
  const {
    chatbotState,
    messagesEndRef,
    sendMessage,
    handleInputChange,
    handleKeyDown,
    loadChatHistory,
    clearHistory
  } = useChatbot();

  const currentTime = useCurrentTime();

  // 🆕 히스토리 패널 상태 추가
  const [isHistoryExpanded, setIsHistoryExpanded] = useState(false);

  // 🆕 페이지 상태 관리 - 처음 마운트 시 히스토리 확인
  useEffect(() => {
    try {
      const { getChatbotSessionState, setChatbotVisitState } = require('../../Utils/sessionUtils');
      const state = getChatbotSessionState();
      
      // 5분 이상 지났고 이전에 챗봇에 있었다면 히스토리 패널 열기
      if (state.shouldShowHistory && state.wasInChatbot) {
        setIsHistoryExpanded(true);
      }
      
      // 현재 챗봇 페이지에 있음을 표시
      setChatbotVisitState(true);
    } catch (error) {
      console.warn('Failed to manage chatbot visit state:', error);
    }

    // 페이지 언마운트 시 상태 저장
    return () => {
      try {
        const { setChatbotVisitState } = require('../../Utils/sessionUtils');
        setChatbotVisitState(false);
      } catch (error) {
        console.warn('Failed to update visit state on unmount:', error);
      }
    };
  }, []);

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