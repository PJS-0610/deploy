// src/components/chatbot/hooks/ChatbotComponents.tsx

import React, { useState } from 'react';
import { Send, Wifi, WifiOff, AlertCircle, Plus, Info } from 'lucide-react';
import { ChatMessage, SensorData } from '../Services/ChatbotTypes';

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
      case 'Loading': return <div className="loading-spinner" />;
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
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '16px 24px',
      borderBottom: '1px solid #e5e7eb',
      backgroundColor: '#e5e7eb',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div>
          <h2 style={{
            margin: 0,
            fontSize: '18px',
            fontWeight: '600',
            color: '#000105'
          }}>
            AWS² IoT 공기질 분석 챗봇
          </h2>
        </div>

        <p style={{
          margin: '2px 0 0 0',
          fontSize: '13px',
          color: '#000105'
        }}>
          실시간 센서 데이터 및 환경 분석 AI
        </p>
        {/* ✅ 여기로 이동 */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 12px',
          borderRadius: '20px',
          backgroundColor: modelStatus === 'Active' ? '#ecfdf5' :
            modelStatus === 'Loading' ? '#fef3c7' : '#fef2f2',
          border: `1px solid ${modelStatus === 'Active' ? '#d1fae5' :
            modelStatus === 'Loading' ? '#fde68a' : '#fecaca'}`,
          fontSize: '13px'
        }}>
          <span style={{ color: getStatusColor() }}>
            {getStatusIcon()}
          </span>
          <span style={{ color: getStatusColor(), fontWeight: '500' }}>
            {getStatusText()}
          </span>
        </div>

        {/* 세션 알림 영역 - i 아이콘과 호버 툴팁 */}
        {sessionNotification && <SessionInfoTooltip message={sessionNotification} />}
      </div>



      {onNewChat && (
        <button
          onClick={onNewChat}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 12px',
            background: '#4e5150ff',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            transition: 'background-color 0.2s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = '#4e5150ff'}
          onMouseLeave={(e) => e.currentTarget.style.background = '#4e5150ff'}
          type="button"
        >
          <Plus size={16} />
          NEW CHAT
        </button>
      )}

      <style>{`
        .loading-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid #f3f4f6;
          border-top: 2px solid #f59e0b;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
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
    <div style={{
      marginTop: 0,                          // 위 여백 제거
      padding: 10,                           // 패딩 살짝 줄임
      backgroundColor: '#fff',               // 흰색 배경
      borderRadius: 10,                      // 라운드 살짝 키움
      border: '1px solid #e5e7eb',           // 더 중립적인 테두리
      boxShadow: '0 1px 2px rgba(0,0,0,0.04)', // 은은한 그림자
      fontSize: 13,
      minWidth: 300,                         // 카드 최소폭
      maxWidth: 340                          // 카드 최대폭
    }}>

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        fontSize: 15
      }}>
        {/* 1) TEMP */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#111827' }}>
          <span>🌡️ TEMPERATURE</span>
          <span>{sensorData.temperature.toFixed(1)}°C</span>
          <span style={badgeStyle(tempStatus)}>{tempStatus}</span>
        </div>

        {/* 2) HUMIDITY */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#111827' }}>
          <span>💧 HUMIDITY</span>
          <span>{sensorData.humidity.toFixed(1)}%</span>
          <span style={badgeStyle(humStatus)}>{humStatus}</span>
        </div>

        {/* 3) CO2 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#111827' }}>
          <span>💨 CO₂ CONCENTRATION</span>
          <span>{sensorData.gasConcentration.toFixed(1)}ppm</span>
          <span style={badgeStyle(gasStatus)}>{gasStatus}</span>
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
    <div style={{
      display: 'flex',
      flexDirection: isUser ? 'row-reverse' : 'row',
      alignItems: 'flex-start',
      padding: '8px 16px',
      gap: '12px',
      maxWidth: '100%',
      animation: 'fadeIn 0.3s ease-out'
    }}>
      {/* 프로필 아이콘 */}
      <div style={{
        width: '36px',
        height: '36px',
        borderRadius: '50%',
        backgroundColor: isUser ? '#007bff' : '#28a745',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        fontSize: '16px',
        color: 'white',
        fontWeight: '600',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        {isUser ? '👤' : '🤖'}
      </div>

      {/* 메시지 컨테이너 */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        maxWidth: '70%',
        gap: '4px'
      }}>
        {/* 사용자명 */}
        <div style={{
          fontSize: '12px',
          fontWeight: '600',
          color: '#6b7280',
          marginLeft: isUser ? 'auto' : '0',
          marginRight: isUser ? '0' : 'auto'
        }}>
          {isUser ? 'You' : 'AI Assistant'}
        </div>

        {/* 메시지 말풍선 */}
        <div style={{
          backgroundColor: isUser ? '#007bff' : '#f1f3f4',
          color: isUser ? 'white' : '#202124',
          borderRadius: '18px',
          padding: '12px 16px',
          fontSize: '14px',
          lineHeight: '1.4',
          wordWrap: 'break-word',
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
          position: 'relative',
          maxWidth: 'fit-content'
        }}>
          {/* 말풍선 꼬리 */}
          <div style={{
            position: 'absolute',
            top: '8px',
            [isUser ? 'right' : 'left']: '-8px',
            width: '0',
            height: '0',
            borderStyle: 'solid',
            borderWidth: isUser ? '8px 0 8px 8px' : '8px 8px 8px 0',
            borderColor: isUser 
              ? `transparent transparent transparent #007bff`
              : `transparent #f1f3f4 transparent transparent`
          }} />
          
          <div style={{ whiteSpace: 'pre-wrap' }}>
            {message.message}
          </div>
        </div>

        {/* 센서 데이터 카드 (봇 메시지에만) */}
        {!isUser && message.sensorData && (
          <div style={{
            backgroundColor: '#f8f9fa',
            border: '1px solid #e9ecef',
            borderRadius: '12px',
            padding: '12px',
            marginTop: '6px',
            fontSize: '12px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <div style={{ 
              fontWeight: '600', 
              color: '#495057', 
              marginBottom: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              Real-time Sensor Readings
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {[
                { label: '🌡️ TEMPERATURE', value: `${message.sensorData.temperature.toFixed(1)}°C`, status: message.status },
                { label: '💧 HUMIDITY', value: `${message.sensorData.humidity.toFixed(1)}%`, status: message.status },
                { label: '🌬️ CO₂ CONCENTRATION', value: `${message.sensorData.gasConcentration.toFixed(1)}ppm`, status: message.status },
              ].map((item, idx) => (
                <div key={idx} style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  padding: '4px 0'
                }}>
                  <span style={{ color: '#6c757d' }}>{item.label}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ fontWeight: '600', color: '#212529' }}>{item.value}</span>
                    <span style={{ 
                      backgroundColor: getStatusColor(item.status),
                      color: 'white',
                      fontSize: '10px',
                      padding: '2px 6px',
                      borderRadius: '10px',
                      fontWeight: '600'
                    }}>
                      {item.status?.toUpperCase()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 시간 및 배지 */}
        <div style={{
          fontSize: '11px',
          color: '#9ca3af',
          marginLeft: isUser ? 'auto' : '0',
          marginRight: isUser ? '0' : 'auto',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          marginTop: '2px'
        }}>
          <span>{formatTime(message.timestamp)}</span>
          {!isUser && getResponseTypeBadge(message.route) && (
            <span style={{
              fontSize: '9px',
              fontWeight: '600',
              padding: '2px 5px',
              borderRadius: '8px',
              color: getResponseTypeBadge(message.route)!.color,
              backgroundColor: getResponseTypeBadge(message.route)!.bgColor,
              textTransform: 'uppercase' as const,
              letterSpacing: '0.3px'
            }}>
              {getResponseTypeBadge(message.route)!.text}
            </span>
          )}
          {isUser && (
            <span style={{ fontSize: '12px', color: '#10b981' }}>✓</span>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

// ========== TypingIndicator ==========
export const TypingIndicator: React.FC = () => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'flex-start',
      padding: '8px 16px',
      gap: '12px',
      maxWidth: '100%',
      animation: 'fadeIn 0.3s ease-out'
    }}>
      {/* 봇 프로필 아이콘 */}
      <div style={{
        width: '36px',
        height: '36px',
        borderRadius: '50%',
        backgroundColor: '#28a745',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        fontSize: '16px',
        color: 'white',
        fontWeight: '600',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        🤖
      </div>

      {/* 타이핑 메시지 */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        maxWidth: '70%',
        gap: '4px'
      }}>
        {/* 봇 이름 */}
        <div style={{
          fontSize: '12px',
          fontWeight: '600',
          color: '#6b7280'
        }}>
          AI Assistant
        </div>

        {/* 타이핑 말풍선 */}
        <div style={{
          backgroundColor: '#f1f3f4',
          color: '#6b7280',
          borderRadius: '18px',
          padding: '12px 16px',
          fontSize: '14px',
          lineHeight: '1.4',
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
          position: 'relative',
          maxWidth: 'fit-content'
        }}>
          {/* 말풍선 꼬리 */}
          <div style={{
            position: 'absolute',
            top: '8px',
            left: '-8px',
            width: '0',
            height: '0',
            borderStyle: 'solid',
            borderWidth: '8px 8px 8px 0',
            borderColor: 'transparent #f1f3f4 transparent transparent'
          }} />
          
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span>💭 응답 중...</span>
            <div className="typing-dots">
              <span>●</span>
              <span>●</span>
              <span>●</span>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .typing-dots {
          display: flex;
          gap: 2px;
        }
        
        .typing-dots span {
          animation: blink 1.4s infinite both;
          font-size: 8px;
          color: #111827;
        }
        
        .typing-dots span:nth-child(1) {
          animation-delay: 0s;
        }
        
        .typing-dots span:nth-child(2) {
          animation-delay: 0.2s;
        }
        
        .typing-dots span:nth-child(3) {
          animation-delay: 0.4s;
        }
        
        @keyframes blink {
          0%, 80%, 100% {
            opacity: 0.3;
            transform: scale(0.8);
          }
          40% {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
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
    <div style={{
      padding: '20px 24px',
      borderTop: '1px solid #e5e7eb',
      backgroundColor: 'white',
      boxShadow: '0 -1px 3px rgba(0, 0, 0, 0.05)'
    }}>
      {/* 에러 메시지 */}
      {error && (
        <div style={{
          marginBottom: '12px',
          padding: '10px 14px',
          backgroundColor: '#fef2f2',
          color: '#dc2626',
          borderRadius: '8px',
          fontSize: '13px',
          border: '1px solid #fecaca',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* 입력 영역 */}
      <div style={{
        display: 'flex',
        gap: '12px',
        alignItems: 'flex-end'
      }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={onKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="메시지를 입력하세요... (예: 현재 온도가 어때?, 공기질은 어떄?)"
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '14px 18px',
              borderRadius: '25px',
              border: `2px solid ${isFocused ? '#111827' : '#e5e7eb'}`,
              outline: 'none',
              fontSize: '14px',
              backgroundColor: isLoading ? '#f9fafb' : 'white',
              transition: 'all 0.2s ease',
              boxSizing: 'border-box',
              color: '#1f2937',
              lineHeight: '1.5'
            }}
          />

          {/* 글자 수 카운터 */}
          {inputMessage.length > 0 && (
            <div style={{
              position: 'absolute',
              right: '18px',
              bottom: '-20px',
              fontSize: '11px',
              color: inputMessage.length > 1000 ? '#dc2626' : '#6b7280'
            }}>
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
          style={{
            padding: '14px',
            borderRadius: '50%',
            border: 'none',
            backgroundColor: (isLoading || !inputMessage || typeof inputMessage !== 'string' || !inputMessage.trim()) ? '#d1d5db' : '#111827',
            color: 'white',
            cursor: (isLoading || !inputMessage || typeof inputMessage !== 'string' || !inputMessage.trim()) ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease',
            minWidth: '48px',
            minHeight: '48px',
            boxShadow: (isLoading || !inputMessage || typeof inputMessage !== 'string' || !inputMessage.trim()) ? 'none' : '0 2px 8px rgba(59, 130, 246, 0.3)'
          }}
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
            <div className="loading-spinner-small" />
          ) : (
            <Send size={20} />
          )}
        </button>
      </div>

      {/* 도움말 텍스트 */}
      <div style={{
        marginTop: '12px',
        fontSize: '12px',
        color: '#6b7280',
        textAlign: 'center',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '4px'
      }}>
        <span>💡</span>
        <span>Enter를 눌러 전송하거나 센서 상태를 물어보세요</span>
      </div>

      <style>{`
        .loading-spinner-small {
          width: 20px;
          height: 20px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top: 2px solid white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
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
    <div style={{
      position: 'relative',
      marginLeft: '8px'
    }}>
      {/* i 아이콘 */}
      <div 
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '18px',
          height: '18px',
          borderRadius: '50%',
          backgroundColor: '#e0e7ff',
          border: '1px solid #c7d2fe',
          color: '#4338ca',
          cursor: 'help',
          fontSize: '11px',
          fontWeight: '600',
          transition: 'all 0.2s ease'
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <Info size={11} />
      </div>

      {/* 호버 툴팁 */}
      {isHovered && (
        <div style={{
          position: 'absolute',
          top: '25px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: '#1f2937',
          color: 'white',
          padding: '8px 12px',
          borderRadius: '8px',
          fontSize: '11px',
          fontWeight: '500',
          whiteSpace: 'nowrap',
          zIndex: 1000,
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          animation: 'tooltipFadeIn 0.2s ease-out'
        }}>
          {message}
          {/* 화살표 */}
          <div style={{
            position: 'absolute',
            top: '-4px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '0',
            height: '0',
            borderLeft: '4px solid transparent',
            borderRight: '4px solid transparent',
            borderBottom: '4px solid #1f2937'
          }} />
        </div>
      )}

      <style>{`
        @keyframes tooltipFadeIn {
          from { 
            opacity: 0; 
            transform: translateX(-50%) translateY(-5px); 
          }
          to { 
            opacity: 1; 
            transform: translateX(-50%) translateY(0); 
          }
        }
      `}</style>
    </div>
  );
};