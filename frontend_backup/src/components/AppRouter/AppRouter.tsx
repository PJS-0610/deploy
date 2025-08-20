import React from 'react';
// 화면 컴포넌트 임포트
import LoadingScreen from '../../pages/Loading/LoadingScreen';     // 초기 로딩 화면
import MainScreen from '../../pages/Main/MainScreen';               // 메인 시작 화면
import RoleSelectionScreen from '../../pages/RoleSelection/RoleSelectionScreen'; // 역할 선택
import AuthSystem from '../../pages/Login/LoginScreen';             // 관리자 로그인
import UserCodeScreen from '../../pages/Login/UserCodeScreen';      // 사용자 코드 입력
import DashboardScreen from '../../pages/Dashboard/DashboardScreen'; // 메인 대시보드
import ChatbotScreen from '../../pages/Chatbot/ChatbotScreen';       // 챗봇 화면
import HistoryScreen from '../../pages/History/HistoryScreen';       // 이력 조회
import SettingScreen from '../../pages/Setting/SettingScreen';       // 설정 화면
// 훅 및 타입 임포트
import { AppState, AppHandlers, AppNavigation } from '../../Hooks/useAppRouter';

/** ✅ 추가: 임포트 성공 여부를 개발환경에서 즉시 검증 */
const componentsSanityCheck = () => {
  if (process.env.NODE_ENV === 'production') return;
  const table = {
    LoadingScreen,
    MainScreen,
    RoleSelectionScreen,
    AuthSystem,
    UserCodeScreen,
    DashboardScreen,
    ChatbotScreen,
    HistoryScreen,
    SettingScreen,
  };
  Object.entries(table).forEach(([name, Comp]) => {
    const ok = typeof Comp === 'function' || (Comp && typeof Comp === 'object');
    if (!ok) {
      // 어떤 컴포넌트가 undefined인지 바로 확인 가능
      // 경로 오타, 폴더/파일명 불일치, default vs named export 혼동 등을 의심
      // 예: '../../pages/Sloading/LoadingScreen' 경로가 실제로 존재하는지 확인
      // 예: 해당 파일이 `export default ...`로 내보내는지 확인
      // 예: index.ts re-export 사용 중이면 그쪽도 확인
      // eslint-disable-next-line no-console
      console.error(`[AppRouter] Import FAILED -> ${name} is`, Comp);
    }
  });
};
// 즉시 실행
componentsSanityCheck();

/**
 * 🔧 AppRouter 컴포넌트 Props 인터페이스
 */
interface AppRouterProps {
  appState: AppState;
  handlers: AppHandlers;
  navigation: AppNavigation;
}

interface SettingScreenProps {
  onNavigateToChatbot: () => void;
  onNavigateToHistory: () => void;
  onNavigateToDashboard: () => void;
  onNavigateToRole: () => void;
}

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

  /** ✅ 추가: 사용 직전에 undefined면 즉시 명확한 에러 던지기 */
  function ensure<T>(Comp: T, name: string): asserts Comp is NonNullable<T> {
    if (!Comp) {
      throw new Error(`[AppRouter] Component "${name}" is undefined. Check its export or import path.`);
    }
  }

  const renderCurrentScreen = () => {
    console.log(`🖥️ 렌더링: ${currentRoute} (역할: ${selectedRole})`);

    switch (currentRoute) {
      case 'loading':
        ensure(LoadingScreen, 'LoadingScreen');
        return <LoadingScreen onLoadingComplete={onLoadingComplete} />;

      case 'main':
        ensure(MainScreen, 'MainScreen');
        return <MainScreen onNavigateToDashboard={() => onNavigateToRoleSelect()} />;

      case 'role':
        ensure(RoleSelectionScreen, 'RoleSelectionScreen');
        return <RoleSelectionScreen onRoleSelected={onRoleSelected} />;

      case 'adminLogin':
        console.log('🔋 관리자 로그인 화면 표시');
        ensure(AuthSystem, 'AuthSystem');
        return (
          <AuthSystem
            onLoginSuccess={onAdminLoginSuccess}
            selectedRole={selectedRole}
            onGoBack={onGoBackToRole}
          />
        );

      case 'userCode':
        console.log('🔒 사용자 코드 입력 화면 표시');
        ensure(UserCodeScreen, 'UserCodeScreen');
        return <UserCodeScreen onCodeSuccess={onUserCodeSuccess} onGoBack={onGoBackToRole} />;

      case 'dashboard':
        ensure(DashboardScreen, 'DashboardScreen');
        return (
          <DashboardScreen
            onNavigateToChatbot={() => navigateToRoute('chatbot')}
            onNavigateToHistory={() => navigateToRoute('history')}
            onNavigateToSettings={() => navigateToRoute('settings')}
            onNavigateToRole={onLogout}
          />
        );

      case 'chatbot':
        ensure(ChatbotScreen, 'ChatbotScreen');
        return (
          <ChatbotScreen
            onNavigateToHistory={() => navigateToRoute('history')}
            onNavigateToDashboard={() => navigateToRoute('dashboard')}
            onNavigateToSettings={() => navigateToRoute('settings')}
            onNavigateToRole={onLogout}
            activeMenu={activeMenu}
            setActiveMenu={setActiveMenu}
          />
        );

      case 'history':
        ensure(HistoryScreen, 'HistoryScreen');
        return (
          <HistoryScreen
            onNavigateBack={() => navigateToRoute('dashboard')}
            onNavigateToChatbot={() => navigateToRoute('chatbot')}
            onNavigateToDashboard={() => navigateToRoute('dashboard')}
            onNavigateToHistory={() => navigateToRoute('history')}
            onNavigateToSettings={() => navigateToRoute('settings')}
            onNavigateToRole={onLogout}
            activeMenu={activeMenu}
            setActiveMenu={setActiveMenu}
          />
        );

      case 'settings':
        ensure(SettingScreen, 'SettingScreen');
        return (
          <SettingScreen
            onNavigateToChatbot={() => navigateToRoute('chatbot')}
            onNavigateToHistory={() => navigateToRoute('history')}
            onNavigateToDashboard={() => navigateToRoute('dashboard')}
            onNavigateToRole={onLogout}
          />
        );

      default:
        console.warn(`⚠️ 알 수 없는 라우트: ${currentRoute}`);
        return (
          <div className="error-screen">
            <h1>페이지를 찾을 수 없습니다</h1>
            <p>현재 라우트: {currentRoute}</p>
            <button onClick={() => navigateToRoute('loading')}>홈으로 돌아가기</button>
          </div>
        );
    }
  };

  return <div className="app-router">{renderCurrentScreen()}</div>;
};

export default AppRouter;
