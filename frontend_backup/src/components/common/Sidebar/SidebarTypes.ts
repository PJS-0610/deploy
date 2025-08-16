// SidebarTypes.ts - 사이드바 공통 타입 정의
import React from 'react';

export interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
}

export interface MenuItem {
  icon: React.ReactNode;
  label: string;
  path: string;
}

export interface SidebarProps {
  activeMenu: string;
  onMenuClick: (label: string, path: string) => void;
  menuItems?: MenuItem[];
}

export interface NotificationData {
  count: number;
  notifications: Array<{
    id: string;
    message: string;
    timestamp: string;
    read: boolean;
  }>;
}