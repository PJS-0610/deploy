// components/chatbot/TypingIndicator.tsx
import React from 'react';
import styles from './TypingIndicator.module.css';

const TypingIndicator: React.FC = () => (
  <div className={`${styles.chatbotMessageItem} ${styles.bot}`}>
    <div className={`${styles.chatbotMessageAvatar} ${styles.bot}`}>AWS²</div>
    <div className={styles.chatbotTypingIndicator}>
      <div className={styles.chatbotTypingBubble}>
        <div className={styles.chatbotTypingDot}></div>
        <div className={styles.chatbotTypingDot}></div>
        <div className={styles.chatbotTypingDot}></div>
      </div>
    </div>
  </div>
);

export default TypingIndicator;