// src/components/common/Sidebar/sidebarComponent.tsx
import React from 'react';
import {
  Home,
  MessageCircle,
  History as HistoryIcon,
  BarChart3,
  Users as UsersIcon,
  Settings as SettingsIcon,
  HelpCircle as HelpCircleIcon,
  LogOut as LogOutIcon,
} from 'lucide-react';

type MenuItem = {
  id: string;
  label: string;
  icon: React.ReactNode;
  path?: string;
  disabled?: boolean;
  badge?: number;
};

const menuItems: MenuItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <Home size={20} />, path: '/dashboard' },
  { id: 'chatbot', label: 'Chatbot', icon: <MessageCircle size={20} />, path: '/chatbot' },
  { id: 'history', label: 'History', icon: <HistoryIcon size={20} />, path: '/history' },
  { id: 'analytics', label: 'Analytics', icon: <BarChart3 size={20} />, path: '/analytics', disabled: true },
  { id: 'users', label: 'Users', icon: <UsersIcon size={20} />, path: '/users', disabled: true },
];

const bottomMenuItems: MenuItem[] = [
  { id: 'settings', label: 'Settings', icon: <SettingsIcon size={20} />, path: '/settings' },
  { id: 'help', label: 'Help', icon: <HelpCircleIcon size={20} />, path: '/help' },
  { id: 'logout', label: 'Logout', icon: <LogOutIcon size={20} />, path: '/logout' },
];

export interface SidebarProps {
  activeMenu?: string;
  onMenuClick?: (id: string) => void;
  className?: string;
}

export default function Sidebar({
  activeMenu = '',
  onMenuClick,
  className = '',
}: SidebarProps) {
  const handleItemClick = (item: MenuItem) => {
    if (item.disabled) return;
    onMenuClick?.(item.id);
    // 라우팅을 쓰는 구조라면 여기서 navigate(item.path!) 호출 또는 NavLink 사용
  };

  const renderMenuItem = (item: MenuItem) => {
    const isActive = activeMenu === item.id;
    const isDisabled = !!item.disabled;

    return (
      <button
        key={item.id}
        onClick={() => handleItemClick(item)}
        disabled={isDisabled}
        className={`w-full flex items-center gap-3 px-6 py-3 text-left transition-colors ${
          isActive ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-800'
        } ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        aria-current={isActive ? 'page' : undefined}
      >
        <span className={`transition-colors duration-200 ${isActive ? 'text-white' : ''}`}>
          {item.icon}
        </span>

        <span className="font-medium text-sm">{item.label}</span>

        {item.badge && item.badge > 0 && (
          <span className="ml-auto bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
            {item.badge > 99 ? '99+' : item.badge}
          </span>
        )}

        {isDisabled && <span className="ml-auto text-xs text-gray-500">Soon</span>}
      </button>
    );
  };

  return (
    <div className={`w-64 bg-gray-900 flex flex-col h-full shadow-xl ${className}`}>
      {/* 헤더 */}
      <div className="px-6 py-6 border-b border-gray-700">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">AWS²</span>
          </div>
          <div>
            <h1 className="text-white font-bold text-lg">AWS² IoT</h1>
            <p className="text-gray-400 text-xs">Air Quality Monitor</p>
          </div>
        </div>
      </div>

      {/* 메인 메뉴 */}
      <nav className="flex-1 py-4">
        <div className="space-y-1">{menuItems.map(renderMenuItem)}</div>
      </nav>

      {/* 하단 메뉴 */}
      <div className="border-t border-gray-700">
        <div className="py-4 space-y-1">{bottomMenuItems.map(renderMenuItem)}</div>
      </div>

      {/* 사용자 정보(예시) */}
      <div className="px-6 py-4 border-t border-gray-700 bg-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-medium">A</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">Admin User</p>
            <p className="text-gray-400 text-xs truncate">admin@example.com</p>
          </div>
        </div>
      </div>
    </div>
  );
}
