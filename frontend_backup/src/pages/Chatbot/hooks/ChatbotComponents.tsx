// src/components/chatbot/hooks/ChatbotComponents.tsx

import React from 'react';
import { Send, Wifi, WifiOff, AlertCircle } from 'lucide-react';
import { ChatMessage } from '../../../services/ChatbotTypes';

// ========== ChatbotHeader ==========
interface ChatbotHeaderProps {
  modelStatus: 'Active' | 'Inactive' | 'Loading';
  onBackClick?: () => void;  // 선택적으로 변경
}

export const ChatbotHeader: React.FC<ChatbotHeaderProps> = ({ 
  modelStatus, 
  onBackClick 
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
      case 'Active': return '연결됨';
      case 'Loading': return '연결 중...';
      case 'Inactive': return '연결 실패';
      default: return '알 수 없음';
    }
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '16px 24px',
      borderBottom: '1px solid #e5e7eb',
      backgroundColor: 'rgba(59, 130, 246, 0.2)',
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
          <p style={{
            margin: '2px 0 0 0',
            fontSize: '13px',
            color: '#000105'
          }}>
            실시간 센서 데이터 및 환경 분석 AI
          </p>
        </div>
      </div>
      
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 14px',
        borderRadius: '20px',
        backgroundColor: modelStatus === 'Active' ? '#ecfdf5' : 
                        modelStatus === 'Loading' ? '#fef3c7' : '#fef2f2',
        border: `1px solid ${modelStatus === 'Active' ? '#d1fae5' : 
                              modelStatus === 'Loading' ? '#fde68a' : '#fecaca'}`,
        fontSize: '14px'
      }}>
        <span style={{ color: getStatusColor() }}>
          {getStatusIcon()}
        </span>
        <span style={{ 
          color: getStatusColor(), 
          fontWeight: '500',
          fontSize: '13px'
        }}>
          {getStatusText()}
        </span>
      </div>
      
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
    <div style={{
      display: 'flex',
      justifyContent: isUser ? 'flex-end' : 'flex-start',
      marginBottom: '16px',
      animation: 'fadeIn 0.3s ease-in-out'
    }}>
      <div style={{
        maxWidth: '75%',
        padding: '14px 18px',
        borderRadius: isUser ? '20px 20px 6px 20px' : '20px 20px 20px 6px',
        backgroundColor: isUser ? '#3b82f6' : '#ffffff',
        color: isUser ? 'white' : '#1f2937',
        wordWrap: 'break-word',
        boxShadow: isUser ? '0 2px 8px rgba(59, 130, 246, 0.3)' : '0 2px 8px rgba(0, 0, 0, 0.1)',
        border: isUser ? 'none' : '1px solid #e5e7eb'
      }}>
        <div style={{ 
          whiteSpace: 'pre-wrap',
          lineHeight: '1.6',
          fontSize: '14px'
        }}>
          {message.message}
        </div>
        
        {/* 센서 데이터 표시 */}
        {message.sensorData && !isUser && (
          <div style={{
            marginTop: '12px',
            padding: '12px',
            backgroundColor: '#f8fafc',
            borderRadius: '10px',
            fontSize: '13px',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: '8px',
              fontSize: '12px'
            }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '4px',
                color: '#059669'
              }}>
                <span>🌡️</span>
                <span>{message.sensorData.temperature.toFixed(1)}°C</span>
              </div>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '4px',
                color: '#0ea5e9'
              }}>
                <span>💧</span>
                <span>{message.sensorData.humidity.toFixed(1)}%</span>
              </div>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '4px',
                color: '#8b5cf6'
              }}>
                <span>🌬️</span>
                <span>{message.sensorData.gasConcentration.toFixed(0)}ppm</span>
              </div>
            </div>
          </div>
        )}
        
        {/* 상태 및 시간 */}
        <div style={{
          marginTop: '8px',
          fontSize: '11px',
          opacity: 0.8,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <span>{formatTime(message.timestamp)}</span>
          {message.status && !isUser && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <span>{getStatusEmoji(message.status)}</span>
              <span style={{
                color: getStatusColor(message.status),
                fontWeight: '500',
                fontSize: '10px'
              }}>
                {message.status}
              </span>
            </div>
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