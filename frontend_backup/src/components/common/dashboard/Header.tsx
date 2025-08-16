// src/components/common/dashboard/header.tsx
import React from 'react';
import { Bell, User, ChevronDown } from 'lucide-react';

import NotificationDropdown from '../dropdown/NotificationDropdown';
import AdminDropdown from '../dropdown/AdminDropdown';

import styles from './Header.module.css';

interface DashboardHeaderProps {
  activeMenu: string;
  currentTime: string;
  notificationData: { count: number; notifications: any[] };
  isNotificationOpen: boolean;
  isAdminMenuOpen: boolean;
  setIsNotificationOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsAdminMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  activeMenu,
  currentTime,
  notificationData,
  isNotificationOpen,
  isAdminMenuOpen,
  setIsNotificationOpen,
  setIsAdminMenuOpen,
}) => {
  return (
    <header className={styles.header}>
      <div className={styles.headerLeft}>
        <h1 className={styles.pageTitle}>{activeMenu}</h1>
        <p className={styles.pageSubtitle}>{currentTime}</p>
      </div>

      <div className={styles.headerRight}>
        {/* 알림 버튼 */}
        <div className={styles.headerItem}>
          <button
            onClick={() => {
              setIsNotificationOpen(!isNotificationOpen);
              setIsAdminMenuOpen(false);
            }}
            className={styles.headerButton}
            aria-label="알림"
          >
            <Bell size={20} />
            {notificationData.count > 0 && (
              <span className={styles.notificationBadge}>
                {notificationData.count > 99 ? '99+' : notificationData.count}
              </span>
            )}
          </button>

          <NotificationDropdown
            isOpen={isNotificationOpen}
            onClose={() => setIsNotificationOpen(false)}
            notifications={notificationData.notifications}
          />
        </div>

        {/* 관리자 버튼 */}
        <div className={styles.headerItem}>
          <button
            onClick={() => {
              setIsAdminMenuOpen(!isAdminMenuOpen);
              setIsNotificationOpen(false);
            }}
            className={styles.adminButton}
            aria-label="관리자 메뉴"
          >
            <User size={20} />
            <span>관리자</span>
            <ChevronDown size={16} />
          </button>

          <AdminDropdown
            isOpen={isAdminMenuOpen}
            onClose={() => setIsAdminMenuOpen(false)}
          />
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
