// src/components/chatbot/hooks/ChatbotComponents.tsx

import React, { useState } from 'react';
import { Send, Wifi, WifiOff, AlertCircle, Plus, Info } from 'lucide-react';
import { ChatMessage, SensorData } from '../Services/ChatbotTypes';
import styles from './ChatbotComponents.module.css';

// ========== ChatbotHeader ==========
interface ChatbotHeaderProps {
  modelStatus: 'Active' | 'Inactive' | 'Loading';
  onBackClick?: () => void;  // 선택적으로 변경
  onNewChat?: () => void;    // 새 채팅 버튼 콜백 추가
  sessionNotification?: string;  // 세션 알림 메시지 (선택적)
}

export const ChatbotHeader: React.FC<ChatbotHeaderProps> = ({
  modelStatus,
  onBackClick,
  onNewChat,
  sessionNotification
}) => {
  const getStatusColor = () => {
    switch (modelStatus) {
      case 'Active': return '#10b981';
      case 'Loading': return '#f59e0b';
      case 'Inactive': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getStatusIcon = () => {
    switch (modelStatus) {
      case 'Active': return <Wifi size={16} />;
      case 'Loading': return <div className={styles.loadingSpinner} />;
      case 'Inactive': return <WifiOff size={16} />;
      default: return <WifiOff size={16} />;
    }
  };

  const getStatusText = () => {
    switch (modelStatus) {
      case 'Active': return 'ACTIVE';
      case 'Loading': return 'LOADING...';
      case 'Inactive': return 'INACTIVE';
      default: return 'UNKNOWN';
    }
  };

  return (
    <div className={styles.chatbotHeader}>
      <div className={styles.chatbotHeaderLeft}>
        <div>
          <h2 className={styles.chatbotHeaderTitle}>
            AWS² IoT 공기질 분석 챗봇
          </h2>
        </div>

        <p className={styles.chatbotHeaderSubtitle}>
          실시간 센서 데이터 및 환경 분석 AI
        </p>
        {/* ✅ 여기로 이동 */}
        <div className={styles.chatbotHeaderStatus}>
          <span className={styles.chatbotHeaderStatusGreen}>
            {getStatusIcon()}
          </span>
          <span className={styles.chatbotHeaderStatusGreenBold}>
            {getStatusText()}
          </span>
        </div>

        {/* 세션 알림 영역 - i 아이콘과 호버 툴팁 */}
        {sessionNotification && <SessionInfoTooltip message={sessionNotification} />}
      </div>



      {onNewChat && (
        <button
          onClick={onNewChat}
          className={styles.newChatButton}
          type="button"
        >
          <Plus size={16} />
          NEW CHAT
        </button>
      )}

    </div>
  );
};

// ========== SensorDataCard ==========
interface SensorDataCardProps {
  sensorData: SensorData;
}

// MintrendService 상태 판정 함수들 (인라인으로 복사)
const getTemperatureStatus = (t: number): string => {
  if (t < 22 || t > 28) return 'WARNING';
  if (t >= 24 && t <= 27) return 'GOOD';
  return 'NORMAL';
};

const getHumidityStatus = (h: number): string => {
  if (h < 40 || h > 80) return 'WARNING';
  if (h >= 50 && h <= 70) return 'GOOD';
  return 'NORMAL';
};

const getGasStatus = (g: number): string => {
  if (g > 2500) return 'WARNING';
  if (g <= 2000) return 'GOOD';
  return 'NORMAL';
};

const getStatusColor = (status: string): string => {
  switch (status.toUpperCase()) {
    case 'GOOD': return '#10b981';    // 초록
    case 'NORMAL': return '#8b5cf6';  // 보라
    case 'WARNING': return '#ef4444'; // 빨강
    default: return '#6b7280';
  }
};

export const SensorDataCard: React.FC<SensorDataCardProps> = ({ sensorData }) => {
  const tempStatus = getTemperatureStatus(sensorData.temperature);
  const humStatus = getHumidityStatus(sensorData.humidity);
  const gasStatus = getGasStatus(sensorData.gasConcentration);

  const badgeStyle = (status: string): React.CSSProperties => {
    const color = getStatusColor(status);
    return {
      display: 'inline-flex',      // ✅ 추가
      alignItems: 'center',
      padding: '2px 8px',
      borderRadius: 9999,
      border: `1px solid ${color}`,
      color,
      fontSize: 12,
      fontWeight: 700,
      lineHeight: '18px',
      whiteSpace: 'nowrap',
    };
  };
  return (
    <div className={styles.sensorDataCard}>

      <div className={styles.sensorDataContent}>
        {/* 1) TEMP */}
        <div className={styles.sensorDataRow}>
          <span>🌡️ TEMPERATURE</span>
          <span>{sensorData.temperature.toFixed(1)}°C</span>
          <span 
            className={styles.sensorDataBadge}
            style={badgeStyle(tempStatus)}
          >
            {tempStatus}
          </span>
        </div>

        {/* 2) HUMIDITY */}
        <div className={styles.sensorDataRow}>
          <span>💧 HUMIDITY</span>
          <span>{sensorData.humidity.toFixed(1)}%</span>
          <span 
            className={styles.sensorDataBadge}
            style={badgeStyle(humStatus)}
          >
            {humStatus}
          </span>
        </div>

        {/* 3) CO2 */}
        <div className={styles.sensorDataRow}>
          <span>💨 CO₂ CONCENTRATION</span>
          <span>{sensorData.gasConcentration.toFixed(1)}ppm</span>
          <span 
            className={styles.sensorDataBadge}
            style={badgeStyle(gasStatus)}
          >
            {gasStatus}
          </span>
        </div>
      </div>
    </div>
  );
};


// ========== MessageItem ==========
interface MessageItemProps {
  message: ChatMessage;
}

export const MessageItem: React.FC<MessageItemProps> = ({ message }) => {
  const isUser = message.sender === 'user';

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'Good': return '#10b981';
      case 'Warning': return '#f59e0b';
      case 'Normal': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const getStatusEmoji = (status?: string) => {
    switch (status) {
      case 'Good': return '✅';
      case 'Warning': return '⚠️';
      case 'Normal': return 'ℹ️';
      default: return '';
    }
  };

  const formatTime = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString('ko-KR', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return '';
    }
  };

  // Route 기반 응답 타입 배지 정보
  const getResponseTypeBadge = (route?: string) => {
    if (!route) return null;
    
    switch (route) {
      case 'sensor':
      case 'sensor_cache':
      case 'sensor_detail':
        return {
          text: 'RAG',
          color: '#10b981', // 초록색 - RAG 응답
          bgColor: '#dcfce7'
        };
      case 'general':
        return {
          text: 'LLM',
          color: '#3b82f6', // 파란색 - 일반 LLM 응답
          bgColor: '#dbeafe'
        };
      case 'error':
        return {
          text: 'ERROR',
          color: '#ef4444', // 빨간색 - 에러
          bgColor: '#fee2e2'
        };
      default:
        return null;
    }
  };

  return (
    <div className={`${styles.messageItemContainer} ${isUser ? styles.messageItemContainerUser : styles.messageItemContainerBot}`}>
      {/* 프로필 아이콘 */}
      <div className={`${styles.messageProfileIcon} ${isUser ? styles.messageProfileIconUser : styles.messageProfileIconBot}`}>
        {isUser ? '👤' : '🤖'}
      </div>

      {/* 메시지 컨테이너 */}
      <div className={styles.messageContentContainer}>
        {/* 사용자명 */}
        <div className={`${styles.messageUsername} ${isUser ? styles.messageUsernameUser : styles.messageUsernameBot}`}>
          {isUser ? 'You' : 'AI Assistant'}
        </div>

        {/* 메시지 말풍선 */}
        <div className={`${styles.messageBubble} ${isUser ? styles.messageBubbleUser : styles.messageBubbleBot}`}>
          {/* 말풍선 꼬리 */}
          <div className={`${styles.messageBubbleTail} ${isUser ? styles.messageBubbleTailUser : styles.messageBubbleTailBot}`} />
          
          <div className={styles.messageTextContent}>
            {message.message}
          </div>
        </div>

        {/* 센서 데이터 카드 (봇 메시지에만) */}
        {!isUser && message.sensorData && (
          <div className={styles.sensorDataCardInMessage}>
            <div className={styles.sensorDataCardHeader}>
              Real-time Sensor Readings
            </div>
            <div className={styles.sensorDataCardContent}>
              {[
                { label: '🌡️ TEMPERATURE', value: `${message.sensorData.temperature.toFixed(1)}°C`, status: message.status },
                { label: '💧 HUMIDITY', value: `${message.sensorData.humidity.toFixed(1)}%`, status: message.status },
                { label: '🌬️ CO₂ CONCENTRATION', value: `${message.sensorData.gasConcentration.toFixed(1)}ppm`, status: message.status },
              ].map((item, idx) => (
                <div key={idx} className={styles.sensorDataCardItem}>
                  <span className={styles.sensorDataCardLabel}>{item.label}</span>
                  <div className={styles.sensorDataCardValue}>
                    <span className={styles.sensorDataCardValueText}>{item.value}</span>
                    <span 
                      className={styles.sensorDataCardStatusBadge}
                      style={{ backgroundColor: getStatusColor(item.status) }}
                    >
                      {item.status?.toUpperCase()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 시간 및 배지 */}
        <div className={`${styles.messageTimestampAndBadge} ${isUser ? styles.messageTimestampAndBadgeUser : styles.messageTimestampAndBadgeBot}`}>
          <span>{formatTime(message.timestamp)}</span>
          {!isUser && getResponseTypeBadge(message.route) && (
            <span 
              className={styles.responseTypeBadge}
              style={{
                color: getResponseTypeBadge(message.route)!.color,
                backgroundColor: getResponseTypeBadge(message.route)!.bgColor
              }}
            >
              {getResponseTypeBadge(message.route)!.text}
            </span>
          )}
          {isUser && (
            <span className={styles.userMessageCheckmark}>✓</span>
          )}
        </div>
      </div>

    </div>
  );
};

// ========== TypingIndicator ==========
export const TypingIndicator: React.FC = () => {
  return (
    <div className={styles.typingIndicatorContainer}>
      {/* 봇 프로필 아이콘 */}
      <div className={styles.typingIndicatorBot}>
        🤖
      </div>

      {/* 타이핑 메시지 */}
      <div className={styles.typingIndicatorMessageContainer}>
        {/* 봇 이름 */}
        <div className={styles.typingIndicatorBotName}>
          AI Assistant
        </div>

        {/* 타이핑 말풍선 */}
        <div className={styles.typingIndicatorBubble}>
          {/* 말풍선 꼬리 */}
          <div className={styles.typingIndicatorBubbleTail} />
          
          <div className={styles.typingIndicatorContent}>
            <span>💭 응답 중...</span>
            <div className={styles.typingDots}>
              <span>●</span>
              <span>●</span>
              <span>●</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

// ========== ChatbotInput ==========
interface ChatbotInputProps {
  inputMessage: string;
  isLoading: boolean;
  onInputChange: (value: string) => void;
  onKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  onSendMessage: () => void;
  error: string | null;
}

export const ChatbotInput: React.FC<ChatbotInputProps> = ({
  inputMessage,
  isLoading,
  onInputChange,
  onKeyDown,
  onSendMessage,
  error
}) => {
  const [isFocused, setIsFocused] = React.useState(false);

  return (
    <div className={styles.chatbotInputContainer}>
      {/* 에러 메시지 */}
      {error && (
        <div className={styles.chatbotInputError}>
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* 입력 영역 */}
      <div className={styles.chatbotInputForm}>
        <div className={styles.chatbotInputFieldContainer}>
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={onKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="메시지를 입력하세요... (예: 현재 온도가 어때?, 공기질은 어떄?)"
            disabled={isLoading}
            className={`${styles.chatbotInputField} ${
              isFocused ? styles.chatbotInputFieldFocused : styles.chatbotInputFieldNormal
            } ${
              isLoading ? styles.chatbotInputFieldDisabled : styles.chatbotInputFieldEnabled
            }`}
            style={{ color: '#1f2937' }}
          />

          {/* 글자 수 카운터 */}
          {inputMessage.length > 0 && (
            <div className={`${styles.chatbotInputCounter} ${
              inputMessage.length > 1000 ? styles.chatbotInputCounterWarning : styles.chatbotInputCounterNormal
            }`}>
              {inputMessage.length}/2000
            </div>
          )}
        </div>

        <button
          onClick={() => {
            try {
              if (!isLoading && inputMessage && typeof inputMessage === 'string' && inputMessage.trim()) {
                onSendMessage();
              }
            } catch (error) {
              console.warn('Send button onClick error:', error);
            }
          }}
          disabled={isLoading || !inputMessage || typeof inputMessage !== 'string' || !inputMessage.trim()}
          className={`${styles.chatbotInputSendButton} ${
            (isLoading || !inputMessage || typeof inputMessage !== 'string' || !inputMessage.trim()) 
              ? styles.chatbotInputSendButtonDisabled 
              : styles.chatbotInputSendButtonEnabled
          }`}
          onMouseEnter={(e) => {
            try {
              if (!isLoading && inputMessage && typeof inputMessage === 'string' && inputMessage.trim()) {
                e.currentTarget.style.backgroundColor = '#111827';
                e.currentTarget.style.transform = 'scale(1.05)';
              }
            } catch (error) {
              console.warn('Button onMouseEnter error:', error);
            }
          }}
          onMouseLeave={(e) => {
            try {
              if (!isLoading && inputMessage && typeof inputMessage === 'string' && inputMessage.trim()) {
                e.currentTarget.style.backgroundColor = '#3b82f6';
                e.currentTarget.style.transform = 'scale(1)';
              }
            } catch (error) {
              console.warn('Button onMouseLeave error:', error);
            }
          }}
        >
          {isLoading ? (
            <div className={styles.loadingSpinnerSmall} />
          ) : (
            <Send size={20} />
          )}
        </button>
      </div>

      {/* 도움말 텍스트 */}
      <div className={styles.chatbotInputHelpText}>
        <span>💡</span>
        <span>Enter를 눌러 전송하거나 센서 상태를 물어보세요</span>
      </div>

    </div>
  );
};

// ========== SessionInfoTooltip ==========
interface SessionInfoTooltipProps {
  message: string;
}

const SessionInfoTooltip: React.FC<SessionInfoTooltipProps> = ({ message }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className={styles.sessionInfoTooltipContainer}>
      {/* i 아이콘 */}
      <div 
        className={styles.sessionInfoTooltipIcon}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <Info size={11} />
      </div>

      {/* 호버 툴팁 */}
      {isHovered && (
        <div className={styles.sessionInfoTooltipPopup}>
          {message}
          {/* 화살표 */}
          <div className={styles.sessionInfoTooltipArrow} />
        </div>
      )}

    </div>
  );
};