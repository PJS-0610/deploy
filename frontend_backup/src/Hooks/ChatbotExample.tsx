// src/components/examples/ChatbotExample.tsx
// 간단한 챗봇 사용 예시 컴포넌트

import React from 'react';
import { useChatbot } from '../Services/UseChatbot';
import { ChatbotUtils } from '../Services/ChatbotTypes';
import styles from './ChatbotExample.module.css';

const ChatbotExample: React.FC = () => {
  const {
    chatbotState,
    messagesEndRef,
    sendMessage,
    handleInputChange,
    handleKeyDown,
    retryConnection,
    clearHistory,
  } = useChatbot();

  const quickQuestions = [
    "현재 온도가 어때?",
    "습도는 어떻게 되지?",
    "공기질 상태는?",
    "센서 데이터 보여줘"
  ];

  const handleQuickQuestion = (question: string) => {
    sendMessage(question);
  };

  return (
    <div className={styles.container}>
      <h2>챗봇 API 연동 예시</h2>
      
      {/* 연결 상태 표시 */}
      <div className={`${styles.connectionStatus} ${
        chatbotState.isConnected ? styles.connectionStatusConnected : styles.connectionStatusDisconnected
      }`}>
        <strong>연결 상태:</strong> {chatbotState.modelStatus}
        {!chatbotState.isConnected && (
          <button 
            onClick={retryConnection}
            className={styles.reconnectButton}
          >
            재연결
          </button>
        )}
      </div>

      {/* 빠른 질문 버튼들 */}
      <div className={styles.quickQuestionsContainer}>
        <h4>빠른 질문:</h4>
        <div className={styles.quickQuestionsButtonGrid}>
          {quickQuestions.map((question, index) => (
            <button
              key={index}
              onClick={() => handleQuickQuestion(question)}
              disabled={chatbotState.isLoading}
              className={styles.quickQuestionButton}
            >
              {question}
            </button>
          ))}
        </div>
      </div>

      {/* 메시지 영역 */}
      <div className={styles.messageArea}>
        {chatbotState.messages.map((message) => (
          <div 
            key={message.id}
            className={`${styles.messageContainer} ${
              message.sender === 'user' ? styles.messageContainerUser : styles.messageContainerBot
            }`}
          >
            <div className={`${styles.messageBubble} ${
              message.sender === 'user' ? styles.messageBubbleUser : styles.messageBubbleBot
            }`}>
              <div className={styles.messageText}>
                {message.message}
              </div>
              
              {/* 센서 데이터 표시 */}
              {message.sensorData && (
                <div className={styles.sensorData}>
                  🌡️ {message.sensorData.temperature.toFixed(1)}°C | 
                  💧 {message.sensorData.humidity.toFixed(1)}% | 
                  🌬️ {message.sensorData.gasConcentration.toFixed(1)}ppm
                </div>
              )}
              
              <div className={styles.messageTimestamp}>
                {ChatbotUtils.formatTime(message.timestamp)}
              </div>
            </div>
          </div>
        ))}
        
        {/* 타이핑 인디케이터 */}
        {chatbotState.isTyping && (
          <div className={styles.typingIndicator}>
            <div className={styles.typingIndicatorBubble}>
              <span>챗봇이 입력 중</span>
              <span className={styles.typingIndicatorAnimation}>...</span>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* 에러 메시지 */}
      {chatbotState.error && (
        <div className={styles.errorMessage}>
          <strong>오류:</strong> {chatbotState.error}
        </div>
      )}

      {/* 입력 영역 */}
      <div className={styles.inputArea}>
        <input
          type="text"
          value={chatbotState.inputMessage}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="메시지를 입력하세요..."
          disabled={chatbotState.isLoading}
          className={styles.inputField}
        />
        <button
          onClick={() => sendMessage()}
          disabled={chatbotState.isLoading || !chatbotState.inputMessage.trim()}
          className={styles.sendButton}
        >
          {chatbotState.isLoading ? '전송 중...' : '전송'}
        </button>
        <button
          onClick={clearHistory}
          className={styles.clearButton}
        >
          초기화
        </button>
      </div>

      {/* 디버그 정보 (개발 모드) */}
      {process.env.NODE_ENV === 'development' && (
        <details className={styles.debugInfo}>
          <summary className={styles.debugSummary}>
            디버그 정보
          </summary>
          <pre className={styles.debugContent}>
            {JSON.stringify({
              messageCount: chatbotState.messages.length,
              isLoading: chatbotState.isLoading,
              isTyping: chatbotState.isTyping,
              modelStatus: chatbotState.modelStatus,
              isConnected: chatbotState.isConnected,
              error: chatbotState.error,
              inputLength: chatbotState.inputMessage.length
            }, null, 2)}
          </pre>
        </details>
      )}

    </div>
  );
};

export default ChatbotExample;