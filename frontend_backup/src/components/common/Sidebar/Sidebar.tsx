// Sidebar.tsx - 공통 사이드바 컴포넌트
import React from 'react';
import { LayoutDashboard, MessageCircle, History, Settings, LogOut } from 'lucide-react';
import { SidebarProps, SidebarItemProps, MenuItem } from './SidebarTypes';
import styles from './Sidebar.module.css';

// 기본 메뉴 아이템들
const DEFAULT_MENU_ITEMS: MenuItem[] = [
  { icon: React.createElement(LayoutDashboard, { size: 20 }), label: 'Dashboard', path: '/dashboard' },
  { icon: React.createElement(MessageCircle, { size: 20 }), label: 'Chatbot', path: '/chatbot' },
  { icon: React.createElement(History, { size: 20 }), label: 'History', path: '/history' },
  { icon: React.createElement(Settings, { size: 20 }), label: 'Settings', path: '/settings' },
  { icon: React.createElement(LogOut, { size: 20 }), label: 'Logout', path: '/logout' }
];

// 사이드바 아이템 컴포넌트
const SidebarItem: React.FC<SidebarItemProps> = ({ icon, label, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`${styles.sidebarItem} ${isActive ? styles.sidebarItemActive : ''}`}
    aria-current={isActive ? 'page' : undefined}
  >
    <span>{icon}</span>
    <span>{label}</span>
  </button>
);

// 메인 사이드바 컴포넌트
const Sidebar: React.FC<SidebarProps> = ({ 
  activeMenu, 
  onMenuClick, 
  menuItems = DEFAULT_MENU_ITEMS 
}) => {
  return (
    <nav className={styles.sidebar} role="navigation" aria-label="메인 네비게이션">
      {/* 사이드바 헤더 */}
      <div className={styles.sidebarHeader}>
        <h2 className={styles.sidebarTitle}>AWS IOT</h2>
      </div>

      {/* 사이드바 메뉴 */}
      <div className={styles.sidebarMenu}>
        {menuItems.map((item) => (
          <SidebarItem
            key={item.label}
            icon={item.icon}
            label={item.label}
            isActive={activeMenu === item.label}
            onClick={() => onMenuClick(item.label, item.path)}
          />
        ))}
      </div>
    </nav>
  );
};

export default Sidebar;