import React, { useState, useEffect, useCallback } from 'react';
import { History, ChevronLeft, ChevronRight, Clock, MessageCircle, Loader2, AlertCircle } from 'lucide-react';
import { ChatbotHistoryAPI } from './ChatbotHistoryAPI';
import {
  ChatbotSession,
  ChatbotTurn,
  HistoryState,
  HistoryPanelProps
} from './ChatbotHistoryTypes';
import styles from './ChatbotHistoyPanel.module.css';

const ChatbotHistoryPanel: React.FC<HistoryPanelProps> = ({
  isExpanded,
  onToggle,
  currentSessionId,
  onHistoryLoad
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
      console.log('🔄 Loading sessions...');
      setHistoryState(prev => ({ ...prev, isLoading: true, error: null }));
      const response = await ChatbotHistoryAPI.getChatbotSessions({});
      console.log('✅ Sessions loaded:', response.sessions?.length || 0, 'sessions');
      setHistoryState(prev => ({
        ...prev,
        sessions: response.sessions || [],
        isLoading: false
      }));
    } catch (error) {
      console.error('❌ Failed to load sessions:', error);
      setHistoryState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : '세션 목록을 불러올 수 없습니다.'
      }));
    }
  }, []);

  // 특정 세션의 히스토리 로드
  const loadSessionHistory = useCallback(async (sessionId: string) => {
    if (!sessionId) {
      console.error('❌ No session ID provided');
      return;
    }
    
    try {
      console.log('🔄 Loading session history for:', sessionId);
      setHistoryState(prev => ({ ...prev, isLoading: true, error: null }));
      const response = await ChatbotHistoryAPI.getChatbotHistory(sessionId, {});
      console.log('✅ Session history loaded:', response.turns?.length || 0, 'turns');
      
      // 채팅창에 히스토리 로드
      if (onHistoryLoad && response.turns && response.turns.length > 0) {
        onHistoryLoad(response.turns);
      }
      
      setHistoryState(prev => ({
        ...prev,
        selectedSession: sessionId,
        currentHistory: response.turns || [],
        isLoading: false
      }));
    } catch (error) {
      console.error('❌ Failed to load session history:', error);
      setHistoryState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : '히스토리를 불러올 수 없습니다.'
      }));
    }
  }, [onHistoryLoad]);

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
              <div>
                <div><strong>API 호출 실패:</strong></div>
                <div>{historyState.error}</div>
                <div style={{ fontSize: '11px', marginTop: '4px', color: '#666' }}>
                  개발자 도구(F12) → Console 탭에서 자세한 로그 확인
                </div>
              </div>
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
