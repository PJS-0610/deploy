// components/chatbot/MessageItem.tsx
import React from 'react';
import { MoreHorizontal } from 'lucide-react';
import { ChatbotState, ChatMessage, ChatbotAPI } from '../../services/ChatbotTypes';
import { ChatbotUtils } from '../../services/ChatbotTypes';
import styles from './MessageItem.module.css';

interface MessageItemProps {
  message: ChatMessage;
}

const MessageItem: React.FC<MessageItemProps> = ({ message }) => {
  const isBot = message.sender === 'bot';
  
  return (
    <div className={`${styles.chatbotMessageItem} ${styles[message.sender]}`}>
      {isBot && (
        <div className={`${styles.chatbotMessageAvatar} ${styles.bot}`}>AWS²</div>
      )}
      
      <div className={styles.chatbotMessageBubble}>
        <div className={`${styles.chatbotMessageContent} ${styles[message.sender]}`}>
          {message.message.split('\n').map((line, index) => (
            <React.Fragment key={index}>
              {line}
              {index < message.message.split('\n').length - 1 && <br />}
            </React.Fragment>
          ))}
          
          {/* 센서 데이터 표시 (봇 메시지인 경우) */}
          {isBot && message.sensorData && (
            <div className={styles.chatbotSensorData}>
              <div className={styles.chatbotSensorItem}>
                <span>온도:</span>
                <span>{message.sensorData.temperature}°C</span>
              </div>
              <div className={styles.chatbotSensorItem}>
                <span>습도:</span>
                <span>{message.sensorData.humidity}%</span>
              </div>
              <div className={styles.chatbotSensorItem}>
                <span>가스농도:</span>
                <span>{message.sensorData.gasConcentration}ppm</span>
              </div>
            </div>
          )}
        </div>
        
        <div className={`${styles.chatbotMessageMeta} ${styles[message.sender]}`}>
          <span className={styles.chatbotMessageTime}>
            {ChatbotUtils.formatTime(message.timestamp)}
          </span>
          <div className={styles.chatbotMessageActions}>
            <button className={styles.chatbotMessageActionButton}>
              <MoreHorizontal size={12} />
            </button>
          </div>
        </div>
      </div>
      
      {!isBot && (
        <div className={`${styles.chatbotMessageAvatar} ${styles.user}`}>A</div>
      )}
    </div>
  );
};

export default MessageItem;