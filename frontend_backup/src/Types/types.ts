/**
 * ═══════════════════════════════════════════════════════════════
 * 🎯 Types - 전역 타입 정의 모음
 * ═══════════════════════════════════════════════════════════════
 * 
 * 애플리케이션 전체에서 공통으로 사용되는 TypeScript 타입과 인터페이스를 정의합니다.
 * 컴포넌트 간 일관된 데이터 구조를 보장하고 타입 안전성을 제공합니다.
 * 
 * 주요 타입 그룹:
 * - 🔔 알림 시스템 관련 타입
 * - 🧭 네비게이션 및 사이드바 관련 타입  
 * - 🎨 드롭다운 컴포넌트 관련 타입
 * - 📱 UI 컴포넌트 공통 인터페이스
 * 
 * 사용하는 컴포넌트:
 * - Sidebar, AdminDropdown, NotificationDropdown
 * - DashboardScreen, ChatbotScreen, HistoryScreen
 * - 모든 알림 관련 컴포넌트
 */

import React from 'react';

// ═══════════════════════════════════════════════════════════════
// 🔔 알림 시스템 관련 타입 정의
// ═══════════════════════════════════════════════════════════════

/**
 * 🔔 개별 알림 아이템 인터페이스
 * 
 * 시스템에서 발생하는 각각의 알림을 나타내는 기본 데이터 구조입니다.
 * 센서 이상치 감지, 시스템 알림 등 모든 종류의 알림에 사용됩니다.
 */
export interface NotificationItem {
  id: string;           // 알림 고유 식별자 (UUID 권장)
  message: string;      // 사용자에게 표시할 알림 메시지
  timestamp: string;    // 알림 발생 시간 (ISO 8601 형식)
  read: boolean;        // 사용자가 읽었는지 여부
}

/**
 * 🔔 확장된 알림 데이터 인터페이스
 * 
 * 더 자세한 알림 정보가 필요한 경우 사용하는 확장된 구조입니다.
 * 알림 시스템의 고도화나 다양한 알림 타입 지원을 위해 정의되었습니다.
 */
export interface ExtendedNotificationData {
  id: string;              // 알림 고유 식별자
  title: string;           // 알림 제목 (헤드라인)
  message: string;         // 알림 상세 내용
  timestamp: string;       // 알림 발생 시각 (ISO 8601 형식)
  read: boolean;           // 읽음 상태 플래그
  type?: 'info' | 'warning' | 'error'; // 알림 중요도/종류 (선택적)
}

/**
 * 📊 알림 데이터 컨테이너 인터페이스
 * 
 * 전체 알림 시스템의 상태를 관리하는 최상위 데이터 구조입니다.
 * 읽지 않은 알림 개수와 알림 목록을 함께 관리합니다.
 */
export interface NotificationData {
  count: number;                    // 읽지 않은 알림의 총 개수
  notifications: NotificationItem[]; // 전체 알림 아이템 배열
}

// ═══════════════════════════════════════════════════════════════
// 🧭 네비게이션 및 사이드바 관련 타입 정의
// ═══════════════════════════════════════════════════════════════

/**
 * 🔘 사이드바 메뉴 아이템 Props 인터페이스
 * 
 * 사이드바의 각 메뉴 항목을 렌더링하는 컴포넌트의 props를 정의합니다.
 * Dashboard, Chatbot, History 등의 메뉴에서 공통으로 사용됩니다.
 */
export interface SidebarItemProps {
  icon: React.ReactNode;    // 메뉴 아이콘 (React 컴포넌트)
  label: string;            // 메뉴 라벨 텍스트
  isActive: boolean;        // 현재 활성화된 메뉴인지 여부
  onClick: () => void;      // 메뉴 클릭 시 호출될 핸들러 함수
}

/**
 * 📋 메뉴 아이템 데이터 인터페이스
 * 
 * 메뉴 시스템에서 사용되는 메뉴 항목의 기본 데이터 구조입니다.
 * 정적 메뉴 설정이나 동적 메뉴 생성에 사용됩니다.
 */
export interface MenuItem {
  icon: React.ReactNode;    // 메뉴를 나타내는 아이콘
  label: string;            // 메뉴 표시 텍스트
  path: string;             // 라우팅 경로 (예: '/dashboard', '/chatbot')
}

// ═══════════════════════════════════════════════════════════════
// 🎨 드롭다운 컴포넌트 관련 타입 정의
// ═══════════════════════════════════════════════════════════════

/**
 * 👤 관리자 드롭다운 Props 인터페이스
 * 
 * 헤더에 있는 관리자 메뉴 드롭다운 컴포넌트의 props를 정의합니다.
 * 프로필 관리, 로그아웃 등의 관리자 전용 기능 메뉴를 제공합니다.
 */
export interface AdminDropdownProps {
  isOpen: boolean;      // 드롭다운 열림/닫힘 상태
  onClose: () => void;  // 드롭다운 닫기 핸들러 함수
  onLogout?: () => void; // 로그아웃 핸들러 함수 (선택적)
}

/**
 * 🔔 알림 드롭다운 Props 인터페이스
 * 
 * 헤더에 있는 알림 벨 아이콘을 클릭했을 때 나타나는 드롭다운의 props입니다.
 * 실시간 알림 목록과 알림 관리 기능을 제공합니다.
 */
export interface NotificationDropdownProps {
  isOpen: boolean;          // 드롭다운 열림/닫힘 상태
  onClose: () => void;      // 드롭다운 닫기 핸들러
  notifications: NotificationItem[]; // 표시할 알림 목록
  onDeleteNotification?: (id: string) => void;    // 개별 알림 삭제 핸들러 (선택적)
  onClearAllNotifications?: () => void;           // 전체 알림 삭제 핸들러 (선택적)
}

