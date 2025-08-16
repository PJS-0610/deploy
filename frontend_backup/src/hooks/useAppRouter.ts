import { useState, useEffect } from 'react';
import { RoleSelectUtils } from '../services/RoleSelectionTypes';

// 타입 정의
export type AppRoute =
  | 'loading'
  | 'main'
  | 'role'
  | 'adminLogin'
  | 'userCode'
  | 'dashboard'
  | 'chatbot'
  | 'history';

export type UserRole = 'admin' | 'user';

export interface AppState {
  currentRoute: AppRoute;
  selectedRole: UserRole | null;
  isAuthenticated: boolean;
  activeMenu: string;
}

export interface AppHandlers {
  onLoadingComplete: (redirectPath: string) => void;
  onNavigateToRoleSelect: () => void;
  onRoleSelected: (role: UserRole, redirect: AppRoute) => void;
  onAdminLoginSuccess: () => void;
  onUserCodeSuccess: () => void;
  onLogout: () => void;
  onGoBackToRole: () => void;
}

export interface AppNavigation {
  navigateToRoute: (route: AppRoute) => void;
  setActiveMenu: (menu: string) => void;
}

export const useAppRouter = () => {
  const [appState, setAppState] = useState<AppState>({
    currentRoute: 'loading',
    selectedRole: null,
    isAuthenticated: false,
    activeMenu: 'Dashboard'
  });

  // 컴포넌트 마운트 시 저장된 상태 복원
  useEffect(() => {
    checkAuthenticationState();
    setupEventListeners();

    return () => {
      cleanup();
    };
  }, []);

  // 인증 상태 확인
const checkAuthenticationState = () => {
  // 새로고침 시 항상 loading으로 이동
  setAppState(prev => ({
    ...prev,
    currentRoute: 'loading',
    selectedRole: null,
    isAuthenticated: false
  }));

  // 첫 방문 여부 확인
  const hasVisited = sessionStorage.getItem('aws_iot_visited');
  if (!hasVisited) {
    sessionStorage.setItem('aws_iot_visited', 'true');
  }
};

  // 이벤트 리스너 설정
  const setupEventListeners = () => {
    // 페이지 새로고침 감지
    const handleBeforeUnload = () => {
      setAppState(prev => ({ ...prev, currentRoute: 'loading' }));
    };

    // ESC 키로 대시보드로 돌아가기 (개발용)
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && appState.currentRoute !== 'loading') {
        navigateToDashboard();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('keydown', handleKeyPress);

    return { handleBeforeUnload, handleKeyPress };
  };

  // 이벤트 리스너 정리
  const cleanup = () => {
    window.removeEventListener('beforeunload', () => { });
    window.removeEventListener('keydown', () => { });
  };

  // 대시보드로 빠른 이동 (개발용)
  const navigateToDashboard = () => {
    setAppState(prev => ({
      ...prev,
      selectedRole: 'admin',
      currentRoute: 'dashboard',
      isAuthenticated: true
    }));
  };

  // 로딩 완료 핸들러
  const handleLoadingComplete = (redirectPath: string) => {
    console.log(`🎬 로딩 완료, 리다이렉트: ${redirectPath}`);
    if (redirectPath === '/main') {
      setAppState(prev => ({ ...prev, currentRoute: 'main' }));
    }
  };

  // 메인에서 역할 선택으로 이동
  const handleNavigateToRoleSelect = () => {
    console.log(`🎯 메인 → 역할 선택 이동`);
    setAppState(prev => ({ ...prev, currentRoute: 'role' }));
  };

  // 역할 선택 완료 핸들러
  const handleRoleSelected = (role: UserRole, redirect: AppRoute) => {
    console.log(`🎯 역할 선택됨: ${role}, 리다이렉트: ${redirect}`);

    if (role === 'admin') {
      setAppState(prev => ({ ...prev, selectedRole: role, currentRoute: 'adminLogin' }));
    } else {
  // user는 코드 입력 화면으로 이동
  setAppState(prev => ({ ...prev, selectedRole: role, currentRoute: 'userCode' }));
}
  };

  // 관리자 로그인 성공 핸들러
  const handleAdminLoginSuccess = () => {
    console.log('✅ 관리자 로그인 성공');
    authenticateUser('dashboard');
  };

  // 사용자 코드 입력 성공 핸들러
  const handleUserCodeSuccess = () => {
    console.log('✅ 사용자 코드 입력 성공');
    authenticateUser('dashboard');
  };

  // 사용자 인증 처리
  const authenticateUser = (targetRoute: AppRoute) => {
    sessionStorage.setItem('isAuthenticated', 'true');

    setAppState(prev => ({
      ...prev,
      isAuthenticated: true,
      currentRoute: targetRoute
    }));
  };

  // 라우트 네비게이션
  const navigateToRoute = (route: AppRoute) => {
    const newActiveMenu = getActiveMenuForRoute(route);

    setAppState(prev => ({
      ...prev,
      currentRoute: route,
      activeMenu: newActiveMenu
    }));
  };

  // 라우트에 따른 활성 메뉴 결정
  const getActiveMenuForRoute = (route: AppRoute): string => {
    switch (route) {
      case 'dashboard': return 'Dashboard';
      case 'chatbot': return 'Chatbot';
      case 'history': return 'History';
      default: return appState.activeMenu;
    }
  };

  // 로그아웃 (역할 선택 화면으로 돌아가기)
  const handleLogout = () => {
    console.log('🚪 로그아웃 처리');

    // 모든 세션 데이터 클리어
    RoleSelectUtils.clearSavedRole();
    sessionStorage.removeItem('isAuthenticated');

    setAppState({
      currentRoute: 'role',
      selectedRole: null,
      isAuthenticated: false,
      activeMenu: 'Dashboard'
    });
  };

  // 메뉴 상태 업데이트
  const setActiveMenu = (menu: string) => {
    setAppState(prev => ({
      ...prev,
      activeMenu: menu
    }));
  };

  // 역할 선택 화면으로 돌아가기
  const goBackToRoleSelection = () => {
    console.log('🔙 역할 선택으로 돌아가기');

    setAppState(prev => ({
      ...prev,
      currentRoute: 'role',
      selectedRole: null,
      isAuthenticated: false
    }));
  };

  // 핸들러들을 객체로 그룹화
  const handlers: AppHandlers = {
    onLoadingComplete: handleLoadingComplete,
    onNavigateToRoleSelect: handleNavigateToRoleSelect,
    onRoleSelected: handleRoleSelected,
    onAdminLoginSuccess: handleAdminLoginSuccess,
    onUserCodeSuccess: handleUserCodeSuccess,
    onLogout: handleLogout,
    onGoBackToRole: goBackToRoleSelection
  };

  // 네비게이션 함수들을 객체로 그룹화
  const navigation: AppNavigation = {
    navigateToRoute,
    setActiveMenu
  };

  return {
    appState,
    handlers,
    navigation
  };
};