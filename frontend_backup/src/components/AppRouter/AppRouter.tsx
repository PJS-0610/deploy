/**
 * ═══════════════════════════════════════════════════════════════
 * 🧭 AppRouter - 중앙 라우팅 컴포넌트
 * ═══════════════════════════════════════════════════════════════
 * 
 * 주요 기능:
 * - 애플리케이션 전체 라우팅 관리
 * - 상태 기반 조건부 렌더링
 * - 컴포넌트 임포트 검증 및 에러 처리
 * - 안전한 컴포넌트 렌더링 보장
 * 
 * 지원하는 라우트:
 * - loading: 3초 스플래시 스크린
 * - main: 애플리케이션 시작 화면
 * - role: 역할 선택 (관리자/사용자)
 * - adminLogin: 관리자 이메일/비밀번호 + 2FA 인증
 * - userCode: 사용자 접근 코드 입력
 * - dashboard: 메인 대시보드 (센서 모니터링)
 * - chatbot: AI 질의응답 시스템
 * - history: 센서 데이터 이력 조회
 * - settings: 시스템 설정 관리
 * 
 * 컴포넌트 안전성:
 * - 개발 환경에서 임포트 실패 즉시 감지
 * - 런타임 컴포넌트 검증 및 명확한 에러 메시지
 * - undefined 컴포넌트 렌더링 방지
 */

import React from 'react';

// 📱 화면 컴포넌트 임포트
import LoadingScreen from '../../pages/Loading/LoadingScreen';     // 초기 로딩 화면 (3초 스플래시)
import MainScreen from '../../pages/Main/MainScreen';               // 메인 시작 화면 (시작 버튼)
import RoleSelectionScreen from '../../pages/RoleSelection/RoleSelectionScreen'; // 역할 선택 (관리자/사용자)
import AuthSystem from '../../pages/Login/LoginScreen';             // 관리자 로그인 (이메일/비밀번호 + 2FA)
import UserCodeScreen from '../../pages/Login/UserCodeScreen';      // 사용자 코드 입력 (접근 코드)
import DashboardScreen from '../../pages/Dashboard/DashboardScreen'; // 메인 대시보드 (실시간 센서 모니터링)
import ChatbotScreen from '../../pages/Chatbot/ChatbotScreen';       // 챗봇 화면 (AI 질의응답)
import HistoryScreen from '../../pages/History/HistoryScreen';       // 이력 조회 (센서 데이터 히스토리)
import SettingScreen from '../../pages/Setting/SettingScreen';       // 설정 화면 (시스템 설정)

// 🔧 훅 및 타입 임포트
import { AppState, AppHandlers, AppNavigation } from '../../Hooks/useAppRouter';

/**
 * 🔍 컴포넌트 임포트 검증 함수
 * 
 * 개발 환경에서만 실행되는 컴포넌트 임포트 상태 검증 함수입니다.
 * 임포트 실패, 경로 오류, export 형식 불일치 등을 즉시 감지합니다.
 * 
 * 검증 항목:
 * - 컴포넌트가 정상적으로 임포트되었는지 확인
 * - 함수 또는 객체 형태인지 타입 검증
 * - undefined 컴포넌트 식별 및 디버깅 정보 제공
 * 
 * 일반적인 임포트 실패 원인:
 * - 파일 경로 오타 (예: '../../pages/Sloading/LoadingScreen')
 * - default export vs named export 혼동
 * - 파일/폴더명 대소문자 불일치
 * - index.ts re-export 설정 오류
 */
const componentsSanityCheck = () => {
  // 프로덕션 환경에서는 성능상 이유로 건너뛰기
  if (process.env.NODE_ENV === 'production') return;
  
  // 임포트된 모든 컴포넌트를 테이블로 구성
  const componentTable = {
    LoadingScreen,      // 로딩 스크린 컴포넌트
    MainScreen,         // 메인 화면 컴포넌트
    RoleSelectionScreen, // 역할 선택 컴포넌트
    AuthSystem,         // 관리자 인증 컴포넌트
    UserCodeScreen,     // 사용자 코드 입력 컴포넌트
    DashboardScreen,    // 대시보드 메인 컴포넌트
    ChatbotScreen,      // 챗봇 인터페이스 컴포넌트
    HistoryScreen,      // 히스토리 조회 컴포넌트
    SettingScreen,      // 설정 관리 컴포넌트
  };
  
  // 각 컴포넌트의 임포트 상태를 개별적으로 검증
  Object.entries(componentTable).forEach(([componentName, Component]) => {
    // React 컴포넌트는 함수이거나 객체 형태여야 함
    const isValidComponent = typeof Component === 'function' || (Component && typeof Component === 'object');
    
    if (!isValidComponent) {
      // 디버깅을 위한 상세한 에러 정보 출력
      // eslint-disable-next-line no-console
      console.error(`[AppRouter] 컴포넌트 임포트 실패 -> ${componentName}:`, Component);
      // eslint-disable-next-line no-console
      console.error(`[AppRouter] 가능한 원인:
        1. 파일 경로 확인: 올바른 상대 경로인지 검증
        2. Export 형식 확인: default export vs named export
        3. 파일명 확인: 대소문자 및 확장자 (.tsx, .ts)
        4. 빌드 에러 확인: TypeScript 컴파일 오류 여부`);
    }
  });
};

// 개발 환경에서 모듈 로드 즉시 검증 실행
componentsSanityCheck();

/**
 * 🔧 AppRouter 컴포넌트 Props 인터페이스
 * 
 * AppRouter 컴포넌트가 상위 App 컴포넌트로부터 받는 props를 정의합니다.
 * useAppRouter 훅에서 반환되는 모든 상태와 함수들을 포함합니다.
 */
interface AppRouterProps {
  appState: AppState;        // 현재 라우트, 역할, 메뉴 상태 등 애플리케이션 상태
  handlers: AppHandlers;     // 각종 이벤트 핸들러 함수들 (로그인, 역할 선택 등)
  navigation: AppNavigation; // 라우트 변경 및 네비게이션 관련 함수들
}

/**
 * 🛠️ SettingScreen 컴포넌트 Props 인터페이스
 * 
 * 설정 화면에서 다른 화면으로 이동하기 위한 네비게이션 함수들을 정의합니다.
 * 설정 화면은 모든 주요 화면으로의 이동을 지원해야 합니다.
 */
interface SettingScreenProps {
  onNavigateToChatbot: () => void;    // 챗봇 화면으로 이동
  onNavigateToHistory: () => void;    // 히스토리 화면으로 이동  
  onNavigateToDashboard: () => void;  // 대시보드 화면으로 이동
  onNavigateToRole: () => void;       // 역할 선택(로그아웃) 화면으로 이동
}

/**
 * 🧭 AppRouter - 중앙 라우팅 컴포넌트
 * 
 * 애플리케이션의 현재 상태를 기반으로 적절한 화면 컴포넌트를 렌더링합니다.
 * 모든 라우트 전환과 상태 관리는 이 컴포넌트를 통해 제어됩니다.
 * 
 * @param appState - 현재 애플리케이션 상태 (라우트, 역할, 메뉴)
 * @param handlers - 이벤트 핸들러 함수들
 * @param navigation - 네비게이션 관련 함수들
 */
const AppRouter: React.FC<AppRouterProps> = ({ appState, handlers, navigation }) => {
  // 🔍 애플리케이션 상태에서 필요한 값들 추출
  const { currentRoute, selectedRole, activeMenu } = appState;

  // 🎯 이벤트 핸들러 함수들 추출
  const {
    onLoadingComplete,      // 로딩 완료 후 메인 화면으로 이동
    onNavigateToRoleSelect, // 역할 선택 화면으로 이동
    onRoleSelected,         // 역할 선택 완료 후 인증 화면으로 이동
    onAdminLoginSuccess,    // 관리자 로그인 성공 후 대시보드로 이동
    onUserCodeSuccess,      // 사용자 코드 입력 성공 후 대시보드로 이동
    onLogout,              // 로그아웃 후 역할 선택 화면으로 이동
    onGoBackToRole         // 인증 화면에서 역할 선택으로 돌아가기
  } = handlers;

  // 🧭 네비게이션 함수들 추출
  const { navigateToRoute, setActiveMenu } = navigation;

  /**
   * 🛡️ 컴포넌트 안전성 검증 함수
   * 
   * 런타임에서 컴포넌트가 undefined인지 확인하고,
   * undefined일 경우 명확한 에러 메시지와 함께 실행을 중단합니다.
   * 
   * TypeScript의 assertion 함수를 사용하여 타입 안전성을 보장합니다.
   * 
   * @param Comp - 검증할 컴포넌트
   * @param name - 컴포넌트 이름 (에러 메시지용)
   */
  function ensure<T>(Comp: T, name: string): asserts Comp is NonNullable<T> {
    if (!Comp) {
      throw new Error(`[AppRouter] 컴포넌트 "${name}"가 undefined입니다. export/import 경로를 확인하세요.`);
    }
  }

  /**
   * 🎭 현재 상태에 따른 화면 렌더링 함수
   * 
   * 애플리케이션의 현재 라우트 상태에 따라 적절한 화면 컴포넌트를 반환합니다.
   * 각 화면 전환 시 필요한 props와 이벤트 핸들러를 전달합니다.
   * 
   * 라우팅 플로우:
   * loading → main → role → (adminLogin|userCode) → dashboard → (chatbot|history|settings)
   */
  const renderCurrentScreen = () => {
    console.log(`🖥️ 렌더링: ${currentRoute} (역할: ${selectedRole})`);

    switch (currentRoute) {
      // 📱 초기 로딩 화면 (3초 스플래시 스크린)
      case 'loading':
        ensure(LoadingScreen, 'LoadingScreen');
        return <LoadingScreen onLoadingComplete={onLoadingComplete} />;

      // 🏠 메인 시작 화면 (시작 버튼)
      case 'main':
        ensure(MainScreen, 'MainScreen');
        return <MainScreen onNavigateToDashboard={() => onNavigateToRoleSelect()} />;

      // 🎭 역할 선택 화면 (관리자 vs 사용자)
      case 'role':
        ensure(RoleSelectionScreen, 'RoleSelectionScreen');
        return <RoleSelectionScreen onRoleSelected={onRoleSelected} />;

      // 🔐 관리자 로그인 화면 (이메일/비밀번호 + 2FA)
      case 'adminLogin':
        console.log('🔋 관리자 로그인 화면 표시');
        ensure(AuthSystem, 'AuthSystem');
        return (
          <AuthSystem
            onLoginSuccess={onAdminLoginSuccess}  // 로그인 성공 시 대시보드로 이동
            selectedRole={selectedRole}          // 현재 선택된 역할 전달
            onGoBack={onGoBackToRole}            // 뒤로가기 시 역할 선택으로 이동
          />
        );

      // 🔑 사용자 코드 입력 화면 (접근 코드)
      case 'userCode':
        console.log('🔒 사용자 코드 입력 화면 표시');
        ensure(UserCodeScreen, 'UserCodeScreen');
        return <UserCodeScreen onCodeSuccess={onUserCodeSuccess} onGoBack={onGoBackToRole} />;

      // 📊 메인 대시보드 화면 (실시간 센서 모니터링)
      case 'dashboard':
        ensure(DashboardScreen, 'DashboardScreen');
        return (
          <DashboardScreen
            onNavigateToChatbot={() => navigateToRoute('chatbot')}   // 챗봇으로 이동
            onNavigateToHistory={() => navigateToRoute('history')}   // 히스토리로 이동
            onNavigateToSettings={() => navigateToRoute('settings')} // 설정으로 이동
            onNavigateToRole={onLogout}                              // 로그아웃 (역할 선택으로)
          />
        );

      // 🤖 챗봇 화면 (AI 질의응답 시스템)
      case 'chatbot':
        ensure(ChatbotScreen, 'ChatbotScreen');
        return (
          <ChatbotScreen
            onNavigateToHistory={() => navigateToRoute('history')}   // 히스토리로 이동
            onNavigateToDashboard={() => navigateToRoute('dashboard')} // 대시보드로 이동
            onNavigateToSettings={() => navigateToRoute('settings')} // 설정으로 이동
            onNavigateToRole={onLogout}                              // 로그아웃
            activeMenu={activeMenu}                                  // 현재 활성 메뉴 상태
            setActiveMenu={setActiveMenu}                            // 메뉴 상태 변경 함수
          />
        );

      // 📈 히스토리 화면 (센서 데이터 이력 조회)
      case 'history':
        ensure(HistoryScreen, 'HistoryScreen');
        return (
          <HistoryScreen
            onNavigateBack={() => navigateToRoute('dashboard')}      // 뒤로가기 (대시보드로)
            onNavigateToChatbot={() => navigateToRoute('chatbot')}   // 챗봇으로 이동
            onNavigateToDashboard={() => navigateToRoute('dashboard')} // 대시보드로 이동
            onNavigateToHistory={() => navigateToRoute('history')}   // 현재 화면 새로고침
            onNavigateToSettings={() => navigateToRoute('settings')} // 설정으로 이동
            onNavigateToRole={onLogout}                              // 로그아웃
            activeMenu={activeMenu}                                  // 현재 활성 메뉴 상태
            setActiveMenu={setActiveMenu}                            // 메뉴 상태 변경 함수
          />
        );

      // ⚙️ 설정 화면 (시스템 설정 관리)
      case 'settings':
        ensure(SettingScreen, 'SettingScreen');
        return (
          <SettingScreen
            onNavigateToChatbot={() => navigateToRoute('chatbot')}   // 챗봇으로 이동
            onNavigateToHistory={() => navigateToRoute('history')}   // 히스토리로 이동
            onNavigateToDashboard={() => navigateToRoute('dashboard')} // 대시보드로 이동
            onNavigateToRole={onLogout}                              // 로그아웃
          />
        );

      // ❌ 정의되지 않은 라우트 처리 (에러 화면)
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

  // 🎭 현재 상태에 따라 적절한 화면 컴포넌트를 렌더링하여 반환
  return <div className="app-router">{renderCurrentScreen()}</div>;
};

export default AppRouter;
