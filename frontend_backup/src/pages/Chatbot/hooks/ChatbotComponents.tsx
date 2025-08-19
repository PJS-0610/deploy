// src/components/chatbot/hooks/ChatbotComponents.tsx

import React from 'react';
import { Send, Wifi, WifiOff, AlertCircle, Plus } from 'lucide-react';
import { ChatMessage, SensorData } from '../../../services/ChatbotTypes';

// ========== ChatbotHeader ==========
interface ChatbotHeaderProps {
  modelStatus: 'Active' | 'Inactive' | 'Loading';
  onBackClick?: () => void;  // 선택적으로 변경
  onNewChat?: () => void;    // 새 채팅 버튼 콜백 추가
}

export const ChatbotHeader: React.FC<ChatbotHeaderProps> = ({ 
  modelStatus, 
  onBackClick,
  onNewChat
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
          새 채팅
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
      marginTop: '12px',
      padding: '12px',
      backgroundColor: '#f7f7f8',
      borderRadius: '8px',
      fontSize: '13px',
      border: '1px solid #ececf1'
    }}>
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'auto auto auto',
        justifyContent: 'center', 
        alignItems: 'center', 
        gap: '12',
        fontSize: '18px'
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '10px',
          color: 'black'
        }}>
          <span>🌡️TEMPERATURE</span>
          <span>{sensorData.temperature.toFixed(1)}°C</span>
          <span style={badgeStyle(tempStatus)}>{tempStatus}</span>
        </div>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '10px',
          color: 'black'
        }}>
          <span>💧HUMIDITY</span>
          <span>{sensorData.humidity.toFixed(1)}%</span>
          <span style={badgeStyle(humStatus)}>{humStatus}</span>
        </div>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '10px',
          color: 'black'
        }}>
          <span>💨CO₂ CONCENTRATION</span>
          <span>{sensorData.gasConcentration.toFixed(0)}ppm</span>
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

  return (
    <>
      <div style={{
        width: '100%',
        backgroundColor: isUser ? '#f7f7f8' : '#ffffff',
        borderTop: isUser ? 'none' : '1px solid #ececf1',
        padding: '32px 24px',
        position: 'relative'
      }}>
        {/* 사용자 */}
        <div style={{
          fontSize: '14px',
          fontWeight: '600',
          color: isUser ? '#8e8ea0' : '#19c37d',
          marginBottom: '12px',
          textTransform: 'uppercase' as const
        }}>
          {isUser ? 'You' : 'CHATBOT'}
        </div>
        
        <div style={{ 
          whiteSpace: 'pre-wrap',
          lineHeight: '1.5',
          fontSize: '16px',
          color: '#353740'
        }}>
          {message.message}
        </div>
        
        {/* 센서 데이터 표시 */}
        {message.sensorData && !isUser && (
          <SensorDataCard sensorData={message.sensorData} />
        )}
        
        {/* 타임스탬프 (선택적으로 표시) */}
        <div style={{
          marginTop: '8px',
          fontSize: '11px',
          color: '#8e8ea0'
        }}>
          {formatTime(message.timestamp)}
        </div>
      </div>
      
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
};

// ========== TypingIndicator ==========
export const TypingIndicator: React.FC = () => {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'flex-start',
      marginBottom: '16px',
      animation: 'fadeIn 0.3s ease-in-out'
    }}>
      <div style={{
        padding: '14px 18px',
        borderRadius: '20px 20px 20px 6px',
        backgroundColor: '#ffffff',
        color: '#6b7280',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        border: '1px solid #e5e7eb'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '14px'
        }}>
          <span>챗봇이 응답 중입니다</span>
          <div className="typing-dots">
            <span>●</span>
            <span>●</span>
            <span>●</span>
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
          color: #3b82f6;
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
              border: `2px solid ${isFocused ? '#3b82f6' : '#e5e7eb'}`,
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
          onClick={onSendMessage}
          disabled={isLoading || !inputMessage.trim()}
          style={{
            padding: '14px',
            borderRadius: '50%',
            border: 'none',
            backgroundColor: (isLoading || !inputMessage.trim()) ? '#d1d5db' : '#3b82f6',
            color: 'white',
            cursor: (isLoading || !inputMessage.trim()) ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease',
            minWidth: '48px',
            minHeight: '48px',
            boxShadow: (isLoading || !inputMessage.trim()) ? 'none' : '0 2px 8px rgba(59, 130, 246, 0.3)'
          }}
          onMouseEnter={(e) => {
            if (!isLoading && inputMessage.trim()) {
              e.currentTarget.style.backgroundColor = '#2563eb';
              e.currentTarget.style.transform = 'scale(1.05)';
            }
          }}
          onMouseLeave={(e) => {
            if (!isLoading && inputMessage.trim()) {
              e.currentTarget.style.backgroundColor = '#3b82f6';
              e.currentTarget.style.transform = 'scale(1)';
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