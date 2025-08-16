import React from 'react';
import BaseDropdown from './BaseDropdown';
import styles from './Dropdown.module.css';

export type Notification = {
  id: string;
  message: string;
  timestamp: string;
  read?: boolean;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  notifications: Notification[];
};

/** 알림 목록 (공통 스타일 사용) */
const NotificationDropdown: React.FC<Props> = ({
  isOpen,
  onClose,
  notifications
}) => {
  return (
    <BaseDropdown isOpen={isOpen} onClose={onClose} title="알림">
      <div className={styles.list}>
        {notifications.length === 0 ? (
          <div className={styles.empty}>새로운 알림이 없습니다</div>
        ) : (
          notifications.map(n => (
            <div
              key={n.id}
              className={`${styles.item} ${!n.read ? styles.itemUnread : ''}`}
              onClick={onClose}
              role="button"
            >
              <span className={styles.message}>{n.message}</span>
              <span className={styles.timestamp}>{n.timestamp}</span>
            </div>
          ))
        )}
      </div>
    </BaseDropdown>
  );
};

export default NotificationDropdown;
