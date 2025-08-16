import React from 'react';
import LoadingScreen from '../../pages/Sloading/LoadingScreen';
import MainScreen from '../../pages/Main/MainScreen';
import RoleSelectionScreen from '../../pages/RoleSelection/RoleSelectionScreen';
import AuthSystem from '../../pages/Login/LoginScreen';
import UserCodeScreen from '../../pages/Login/UserCodeScreen';
import DashboardScreen from '../../pages/Dashboard/DashboardScreen';
import ChatbotScreen from '../../pages/Chatbot/ChatbotScreen';
import HistoryScreen from '../../pages/History/HistoryScreen';
import { AppState, AppHandlers, AppNavigation } from '../../hooks/useAppRouter';

interface AppRouterProps {
  appState: AppState;
  handlers: AppHandlers;
  navigation: AppNavigation;
}

/**
 * 애플리케이션 라우터 컴포넌트
 * 
 * 현재 라우트 상태에 따라 적절한 화면을 렌더링합니다.
 * 모든 라우팅 로직을 중앙화하여 관리합니다.
 */
const AppRouter: React.FC<AppRouterProps> = ({ appState, handlers, navigation }) => {
  const { currentRoute, selectedRole, activeMenu } = appState;
  const {
    onLoadingComplete,
    onNavigateToRoleSelect,
    onRoleSelected,
    onAdminLoginSuccess,
    onUserCodeSuccess,
    onLogout,
    onGoBackToRole
  } = handlers;
  const { navigateToRoute, setActiveMenu } = navigation;

  // 현재 라우트에 따른 화면 렌더링
  const renderCurrentScreen = () => {
    console.log(`🖥️ 렌더링: ${currentRoute} (역할: ${selectedRole})`);
    
    switch (currentRoute) {
      case 'loading':
        return (
          <LoadingScreen 
            onLoadingComplete={onLoadingComplete}
          />
        );
      
      case 'main':
        return (
          <MainScreen 
onNavigateToDashboard={() => onNavigateToRoleSelect()}
/>
        );
      
      case 'role':
        return (
          <RoleSelectionScreen 
            onRoleSelected={onRoleSelected}
          />
        );
      
      case 'adminLogin':
        console.log('🔋 관리자 로그인 화면 표시');
        return (
          <AuthSystem 
            onLoginSuccess={onAdminLoginSuccess}
            selectedRole={selectedRole}
          />
        );
      
      case 'userCode':
        console.log('🔒 사용자 코드 입력 화면 표시');
        return (
          <UserCodeScreen 
  onCodeSuccess={onUserCodeSuccess}
  onGoBack={onGoBackToRole}
/>
        );
      
      case 'dashboard':
        return (
          <DashboardScreen
            onNavigateToChatbot={() => navigateToRoute('chatbot')}
            onNavigateToHistory={() => navigateToRoute('history')}
            onNavigateToRole={onLogout}
            // activeMenu={activeMenu}
            // setActiveMenu={setActiveMenu}
          />
        );
      
      case 'chatbot':
        return (
          <ChatbotScreen
            onNavigateToHistory={() => navigateToRoute('history')}
            onNavigateToDashboard={() => navigateToRoute('dashboard')}
            onNavigateToRole={onLogout}
            activeMenu={activeMenu}
            setActiveMenu={setActiveMenu}
          />
        );
      
      case 'history':
        return (
          <HistoryScreen
            onNavigateBack={() => navigateToRoute('dashboard')}
            onNavigateToChatbot={() => navigateToRoute('chatbot')}
            onNavigateToDashboard={() => navigateToRoute('dashboard')}
            onNavigateToHistory={() => navigateToRoute('history')}
            onNavigateToRole={onLogout}
            activeMenu={activeMenu}
            setActiveMenu={setActiveMenu}
          />
        );
      
      default:
        console.warn(`⚠️ 알 수 없는 라우트: ${currentRoute}`);
        return (
          <div className="error-screen">
            <h1>페이지를 찾을 수 없습니다</h1>
            <p>현재 라우트: {currentRoute}</p>
            <button onClick={() => navigateToRoute('loading')}>
              홈으로 돌아가기
            </button>
          </div>
        );
    }
  };

  return (
    <div className="app-router">
      {renderCurrentScreen()}
    </div>
  );
};

export default AppRouter;