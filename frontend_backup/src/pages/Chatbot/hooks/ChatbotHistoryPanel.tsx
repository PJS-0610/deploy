// // src/components/chatbot/ChatbotHistoryPanel.tsx
// // 챗봇 히스토리 패널 컴포넌트

// import React, { useState, useEffect, useCallback } from 'react';
// import { History, ChevronLeft, ChevronRight, Clock, MessageCircle, Loader2, AlertCircle } from 'lucide-react';
// import { ChatbotHistoryAPI } from './ChatbotHistoryAPI';
// import {
//   ChatbotSession,
//   ChatbotTurn,
//   HistoryState,
//   HistoryPanelProps
// } from './ChatbotHistoryTypes';
// import styles from './ChatbotHistoryPanel'

// const ChatbotHistoryPanel: React.FC<HistoryPanelProps> = ({
//   isExpanded,
//   onToggle,
//   currentSessionId
// }) => {
//   const [historyState, setHistoryState] = useState<HistoryState>({
//     sessions: [],
//     selectedSession: null,
//     currentHistory: [],
//     isLoading: false,
//     error: null,
//     isExpanded: false
//   });

//   // 세션 목록 로드
//   const loadSessions = useCallback(async () => {
//     try {
//       setHistoryState(prev => ({ ...prev, isLoading: true, error: null }));
      
//       const response = await ChatbotHistoryAPI.getChatbotSessions({ limit: 20 });
      
//       setHistoryState(prev => ({
//         ...prev,
//         sessions: response.sessions,
//         isLoading: false
//       }));
//     } catch (error) {
//       console.error('Failed to load sessions:', error);
//       setHistoryState(prev => ({
//         ...prev,
//         isLoading: false,
//         error: error instanceof Error ? error.message : '세션 목록을 불러올 수 없습니다.'
//       }));
//     }
//   }, []);

//   // 특정 세션의 히스토리 로드
//   const loadSessionHistory = useCallback(async (sessionId: string) => {
//     try {
//       setHistoryState(prev => ({ ...prev, isLoading: true, error: null }));
      
//       const response = await ChatbotHistoryAPI.getChatbotHistory(sessionId, { limit: 50 });
      
//       setHistoryState(prev => ({
//         ...prev,
//         selectedSession: sessionId,
//         currentHistory: response.turns,
//         isLoading: false
//       }));
//     } catch (error) {
//       console.error('Failed to load session history:', error);
//       setHistoryState(prev => ({
//         ...prev,
//         isLoading: false,
//         error: error instanceof Error ? error.message : '히스토리를 불러올 수 없습니다.'
//       }));
//     }
//   }, []);

//   // 컴포넌트 마운트 시 세션 목록 로드
//   useEffect(() => {
//     if (isExpanded) {
//       loadSessions();
//     }
//   }, [isExpanded, loadSessions]);

//   // 시간 포맷팅 함수
//   const formatTime = (timestamp: string) => {
//     try {
//       const date = new Date(timestamp);
//       const now = new Date();
//       const diff = now.getTime() - date.getTime();
//       const minutes = Math.floor(diff / (1000 * 60));
//       const hours = Math.floor(diff / (1000 * 60 * 60));
//       const days = Math.floor(diff / (1000 * 60 * 60 * 24));

//       if (minutes < 60) {
//         return `${minutes}분 전`;
//       } else if (hours < 24) {
//         return `${hours}시간 전`;
//       } else if (days < 7) {
//         return `${days}일 전`;
//       } else {
//         return date.toLocaleDateString('ko-KR', {
//           month: 'short',
//           day: 'numeric'
//         });
//       }
//     } catch {
//       return timestamp;
//     }
//   };

//   // 텍스트 줄임 함수
//   const truncateText = (text: string, maxLength: number = 50) => {
//     if (text.length <= maxLength) return text;
//     return text.substring(0, maxLength) + '...';
//   };

//   return (
//     <div className={`history-panel ${isExpanded ? 'expanded' : 'collapsed'}`}>
//       {/* 토글 버튼 */}
//       <button
//         onClick={onToggle}
//         className="history-toggle-btn"
//         aria-label={isExpanded ? '히스토리 패널 닫기' : '히스토리 패널 열기'}
//       >
//         {isExpanded ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
//         <History size={18} />
//       </button>

//       {/* 패널 내용 */}
//       {isExpanded && (
//         <div className="history-content">
//           <div className="history-header">
//             <h3 className="history-title">
//               <MessageCircle size={20} />
//               대화 히스토리
//             </h3>
//           </div>

//           {/* 에러 표시 */}
//           {historyState.error && (
//             <div className="history-error">
//               <AlertCircle size={16} />
//               <span>{historyState.error}</span>
//             </div>
//           )}

//           {/* 로딩 표시 */}
//           {historyState.isLoading && (
//             <div className="history-loading">
//               <Loader2 size={20} className="spinning" />
//               <span>불러오는 중...</span>
//             </div>
//           )}

//           {/* 세션 목록 */}
//           {!historyState.selectedSession && (
//             <div className="sessions-list">
//               {historyState.sessions.length === 0 && !historyState.isLoading ? (
//                 <div className="empty-state">
//                   <Clock size={24} />
//                   <p>저장된 대화가 없습니다.</p>
//                 </div>
//               ) : (
//                 historyState.sessions.map((session) => (
//                   <div
//                     key={session.session_id}
//                     className={`session-item ${currentSessionId === session.session_id ? 'current' : ''}`}
//                     onClick={() => loadSessionHistory(session.session_id)}
//                   >
//                     <div className="session-header">
//                       <div className="session-info">
//                         <span className="session-turns">{session.total_turns}개 대화</span>
//                         <span className="session-time">{formatTime(session.last_turn_date)}</span>
//                       </div>
//                     </div>
//                     <div className="session-preview">
//                       <div className="last-query">
//                         <strong>질문:</strong> {truncateText(session.last_query)}
//                       </div>
//                       <div className="last-answer">
//                         <strong>답변:</strong> {truncateText(session.last_answer)}
//                       </div>
//                     </div>
//                   </div>
//                 ))
//               )}
//             </div>
//           )}

//           {/* 선택된 세션의 상세 히스토리 */}
//           {historyState.selectedSession && (
//             <div className="history-detail">
//               <div className="history-detail-header">
//                 <button
//                   onClick={() => setHistoryState(prev => ({ 
//                     ...prev, 
//                     selectedSession: null, 
//                     currentHistory: [] 
//                   }))}
//                   className="back-btn"
//                 >
//                   <ChevronLeft size={16} />
//                   세션 목록으로
//                 </button>
//               </div>

//               <div className="turns-list">
//                 {historyState.currentHistory.map((turn) => (
//                   <div key={`${turn.session_id}-${turn.turn_id}`} className="turn-item">
//                     <div className="turn-header">
//                       <span className="turn-number">#{turn.turn_id}</span>
//                       <span className="turn-time">{formatTime(turn.ts_kst)}</span>
//                       <span className={`turn-route route-${turn.route}`}>{turn.route}</span>
//                     </div>
                    
//                     <div className="turn-content">
//                       <div className="turn-query">
//                         <strong>질문:</strong>
//                         <p>{turn.query}</p>
//                       </div>
//                       <div className="turn-answer">
//                         <strong>답변:</strong>
//                         <p>{turn.answer}</p>
//                       </div>
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             </div>
//           )}
//         </div>
//       )}
//     </div>
//   );
// };

// export default ChatbotHistoryPanel;
// src/pages/Chatbot/hooks/ChatbotHistoryPanel.tsx (또는 현재 경로에 맞춰 사용)
// CSS Module 적용 버전

import React, { useState, useEffect, useCallback } from 'react';
import { History, ChevronLeft, ChevronRight, Clock, MessageCircle, Loader2, AlertCircle } from 'lucide-react';
import { ChatbotHistoryAPI } from './ChatbotHistoryAPI';
import {
  ChatbotSession,
  ChatbotTurn,
  HistoryState,
  HistoryPanelProps
} from './ChatbotHistoryTypes';
import styles from './ChatbotHistoyPanel.module.css'; // ← 파일명에 맞춰 import (오타 포함)

const ChatbotHistoryPanel: React.FC<HistoryPanelProps> = ({
  isExpanded,
  onToggle,
  currentSessionId
}) => {
  const [historyState, setHistoryState] = useState<HistoryState>({
    sessions: [],
    selectedSession: null,
    currentHistory: [],
    isLoading: false,
    error: null,
    isExpanded: false
  });

  // 세션 목록 로드
  const loadSessions = useCallback(async () => {
    try {
      setHistoryState(prev => ({ ...prev, isLoading: true, error: null }));
      const response = await ChatbotHistoryAPI.getChatbotSessions({ limit: 20 });
      setHistoryState(prev => ({
        ...prev,
        sessions: response.sessions,
        isLoading: false
      }));
    } catch (error) {
      console.error('Failed to load sessions:', error);
      setHistoryState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : '세션 목록을 불러올 수 없습니다.'
      }));
    }
  }, []);

  // 특정 세션의 히스토리 로드
  const loadSessionHistory = useCallback(async (sessionId: string) => {
    try {
      setHistoryState(prev => ({ ...prev, isLoading: true, error: null }));
      const response = await ChatbotHistoryAPI.getChatbotHistory(sessionId, { limit: 50 });
      setHistoryState(prev => ({
        ...prev,
        selectedSession: sessionId,
        currentHistory: response.turns,
        isLoading: false
      }));
    } catch (error) {
      console.error('Failed to load session history:', error);
      setHistoryState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : '히스토리를 불러올 수 없습니다.'
      }));
    }
  }, []);

  useEffect(() => {
    if (isExpanded) loadSessions();
  }, [isExpanded, loadSessions]);

  // 시간 포맷팅
  const formatTime = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diff = now.getTime() - date.getTime();
      const minutes = Math.floor(diff / (1000 * 60));
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      if (minutes < 60) return `${minutes}분 전`;
      if (hours < 24) return `${hours}시간 전`;
      if (days < 7) return `${days}일 전`;
      return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
    } catch {
      return timestamp;
    }
  };

  // 텍스트 줄임
  const truncateText = (text: string, maxLength: number = 50) =>
    text.length <= maxLength ? text : text.substring(0, maxLength) + '...';

  // route 뱃지 클래스
  const routeClass = (route: string) => styles[`route-${route}`] ?? '';

  return (
    <div className={`${styles['history-panel']} ${isExpanded ? styles.expanded : styles.collapsed}`}>
      {/* 토글 버튼 */}
      <button
        onClick={onToggle}
        className={styles['history-toggle-btn']}
        aria-label={isExpanded ? '히스토리 패널 닫기' : '히스토리 패널 열기'}
        type="button"
      >
        {isExpanded ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
        <History size={18} />
      </button>

      {/* 패널 내용 */}
      {isExpanded && (
        <div className={styles['history-content']}>
          <div className={styles['history-header']}>
            <h3 className={styles['history-title']}>
              <MessageCircle size={20} />
              대화 히스토리
            </h3>
          </div>

          {/* 에러 표시 */}
          {historyState.error && (
            <div className={styles['history-error']}>
              <AlertCircle size={16} />
              <span>{historyState.error}</span>
            </div>
          )}

          {/* 로딩 표시 */}
          {historyState.isLoading && (
            <div className={styles['history-loading']}>
              <Loader2 size={20} className={styles.spinning} />
              <span>불러오는 중...</span>
            </div>
          )}

          {/* 세션 목록 */}
          {!historyState.selectedSession && (
            <div className={styles['sessions-list']}>
              {historyState.sessions.length === 0 && !historyState.isLoading ? (
                <div className={styles['empty-state']}>
                  <Clock size={24} />
                  <p>저장된 대화가 없습니다.</p>
                </div>
              ) : (
                historyState.sessions.map((session: any) => (
                  <div
                    key={session.session_id}
                    className={`${styles['session-item']} ${currentSessionId === session.session_id ? styles.current : ''}`}
                    onClick={() => loadSessionHistory(session.session_id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => (e.key === 'Enter' ? loadSessionHistory(session.session_id) : null)}
                  >
                    <div className={styles['session-header']}>
                      <div className={styles['session-info']}>
                        <span className={styles['session-turns']}>{session.total_turns}개 대화</span>
                        <span className={styles['session-time']}>{formatTime(session.last_turn_date)}</span>
                      </div>
                    </div>
                    <div className={styles['session-preview']}>
                      <div className={styles['last-query']}>
                        <strong>질문:</strong> {truncateText(session.last_query)}
                      </div>
                      <div className={styles['last-answer']}>
                        <strong>답변:</strong> {truncateText(session.last_answer)}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* 선택된 세션의 상세 히스토리 */}
          {historyState.selectedSession && (
            <div className={styles['history-detail']}>
              <div className={styles['history-detail-header']}>
                <button
                  onClick={() =>
                    setHistoryState(prev => ({
                      ...prev,
                      selectedSession: null,
                      currentHistory: []
                    }))
                  }
                  className={styles['back-btn']}
                  type="button"
                >
                  <ChevronLeft size={16} />
                  세션 목록으로
                </button>
              </div>

              <div className={styles['turns-list']}>
                {historyState.currentHistory.map((turn: any) => (
                  <div key={`${turn.session_id}-${turn.turn_id}`} className={styles['turn-item']}>
                    <div className={styles['turn-header']}>
                      <span className={styles['turn-number']}>#{turn.turn_id}</span>
                      <span className={styles['turn-time']}>{formatTime(turn.ts_kst)}</span>
                      <span className={`${styles['turn-route']} ${routeClass(turn.route)}`}>{turn.route}</span>
                    </div>

                    <div className={styles['turn-content']}>
                      <div className={styles['turn-query']}>
                        <strong>질문:</strong>
                        <p>{turn.query}</p>
                      </div>
                      <div className={styles['turn-answer']}>
                        <strong>답변:</strong>
                        <p>{turn.answer}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ChatbotHistoryPanel;
