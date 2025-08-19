// ChatbotScreen.tsx - 챗봇 화면 컴포넌트 (히스토리 패널 추가)

import React, { useState, useEffect } from 'react';
import { Bell, User, ChevronDown } from 'lucide-react';
import { Sidebar } from '../../components/common/Sidebar';
import NotificationDropdown from '../../components/common/dropdown/NotificationDropdown';
import AdminDropdown from '../../components/common/dropdown/AdminDropdown';
import { ChatbotScreenProps, NotificationData } from '../../services/ChatbotTypes';
import styles from "./ChatbotScreen.module.css";
import { useChatbot } from '../../services/UseChatbot';
// 🆕 히스토리 패널 추가
import ChatbotHistoryPanel from './hooks/ChatbotHistoryPanel';
import {
  ChatbotHeader,
  MessageItem,
  TypingIndicator,
  ChatbotInput,
} from './hooks/ChatbotComponents';

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

  // 🆕 현재 세션 ID 추출 (chatbotState에서 sessionId 확인)
  const getCurrentSessionId = (): string | null => {
    // UseChatbot에서 sessionId를 관리하고 있다면 그것을 사용
    // 현재는 직접적으로 노출되지 않으므로, 임시로 null 반환
    return null;
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