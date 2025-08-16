// components/chatbot/ChatbotHeader.tsx
import React from 'react';
import { ChevronLeft, Printer, Star, Trash2 } from 'lucide-react';
import styles from './ChatbotHeader.module.css';

interface ChatbotHeaderProps {
  modelStatus: 'Active' | 'Inactive' | 'Loading';
  onBackClick?: () => void;
}

const ChatbotHeader: React.FC<ChatbotHeaderProps> = ({ 
  modelStatus, 
  onBackClick 
}) => {
  return (
    <div className={styles.chatbotHeader}>
      <div className={styles.chatbotHeaderLeft}>
        <button 
          className={styles.chatbotBackButton}
          onClick={onBackClick}
          aria-label="뒤로 가기"
        >
          <ChevronLeft size={20} />
        </button>
        
        <div className={styles.chatbotModelInfo}>
          <div className={styles.chatbotModelName}>Model Name</div>
          <div className={styles.chatbotModelStatus}>
            <span className={`${styles.chatbotStatusBadge} ${styles[`chatbotStatus${modelStatus}`]}`}>
              {modelStatus}
            </span>
          </div>
        </div>
      </div>
      
      <div className={styles.chatbotHeaderActions}>
        <button className={styles.chatbotActionButton} aria-label="인쇄">
          <Printer size={18} />
        </button>
        <button className={styles.chatbotActionButton} aria-label="즐겨찾기">
          <Star size={18} />
        </button>
        <button className={styles.chatbotActionButton} aria-label="삭제">
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  );
};

export default ChatbotHeader;