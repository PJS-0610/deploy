// /**
//  * ═══════════════════════════════════════════════════════════════
//  * 🧭 AppRouter - 중앙 집중식 라우팅 컴포넌트
//  * ═══════════════════════════════════════════════════════════════
//  * 
//  * 주요 기능:
//  * - 애플리케이션 상태에 따른 조건부 화면 렌더링
//  * - 사용자 역할별 인증 플로우 관리
//  * - 메뉴 네비게이션 및 상태 전달
//  * - 에러 처리 및 폴백 화면
//  * 
//  * 라우트 플로우:
//  * loading → main → role → [adminLogin|userCode] → dashboard ⇄ [chatbot|history]
//  * 
//  * 지원 화면:
//  * - 🔄 loading: 초기 로딩 스플래시
//  * - 🏠 main: 애플리케이션 시작 화면
//  * - 🎭 role: 사용자 역할 선택 (관리자/사용자)
//  * - 🔐 adminLogin: 관리자 인증 (이메일/비밀번호 + 2FA)
//  * - 🔒 userCode: 사용자 접근 코드 입력
//  * - 📊 dashboard: 메인 대시보드 (센서 데이터 시각화)
//  * - 🤖 chatbot: AI 기반 질의응답 시스템
//  * - 📋 history: 센서 데이터 이력 조회
//  */

// import React from 'react';
// // 화면 컴포넌트 임포트
// import LoadingScreen from '../../pages/Sloading/LoadingScreen';     // 초기 로딩 화면
// import MainScreen from '../../pages/Main/MainScreen';               // 메인 시작 화면
// import RoleSelectionScreen from '../../pages/RoleSelection/RoleSelectionScreen'; // 역할 선택
// import AuthSystem from '../../pages/Login/LoginScreen';             // 관리자 로그인
// import UserCodeScreen from '../../pages/Login/UserCodeScreen';      // 사용자 코드 입력
// import DashboardScreen from '../../pages/Dashboard/DashboardScreen'; // 메인 대시보드
// import ChatbotScreen from '../../pages/Chatbot/ChatbotScreen';       // 챗봇 화면
// import HistoryScreen from '../../pages/History/HistoryScreen';       // 이력 조회
// import SettingScreen from '../../pages/Setting/SettingScreen';       // 설정 화면
// // 훅 및 타입 임포트
// import { AppState, AppHandlers, AppNavigation } from '../../hooks/useAppRouter';

// /**
//  * 🔧 AppRouter 컴포넌트 Props 인터페이스
//  * 상위 App 컴포넌트로부터 전달받는 상태와 함수들을 정의
//  */
// interface AppRouterProps {
//   appState: AppState;      // 현재 애플리케이션 상태 (라우트, 역할, 인증 등)
//   handlers: AppHandlers;   // 각종 이벤트 핸들러 함수 모음
//   navigation: AppNavigation; // 네비게이션 관련 함수 모음
// }

// /**
//  * 🧭 애플리케이션 라우터 컴포넌트
//  * 
//  * 현재 라우트 상태에 따라 적절한 화면을 렌더링합니다.
//  * 모든 라우팅 로직을 중앙화하여 관리하며, 각 화면에 필요한
//  * Props를 적절히 전달하는 역할을 담당합니다.
//  * 
//  * 특징:
//  * - 상태 기반 조건부 렌더링
//  * - 각 화면별 Props 커스터마이징
//  * - 디버그 로깅 지원
//  * - 에러 화면 폴백 처리
//  */
// const AppRouter: React.FC<AppRouterProps> = ({ appState, handlers, navigation }) => {
//   /**
//    * 🔄 상태 디스트럭처링 - 애플리케이션 현재 상태 추출
//    * - currentRoute: 현재 활성화된 라우트명
//    * - selectedRole: 선택된 사용자 역할 (admin/user)
//    * - activeMenu: 현재 활성화된 메뉴 항목
//    */
//   const { currentRoute, selectedRole, activeMenu } = appState;
  
//   /**
//    * 🎯 핸들러 함수들 디스트럭처링 - 각종 이벤트 처리 함수
//    * - onLoadingComplete: 로딩 완료 시 호출
//    * - onNavigateToRoleSelect: 역할 선택 화면으로 이동
//    * - onRoleSelected: 역할 선택 완료 시 호출
//    * - onAdminLoginSuccess: 관리자 로그인 성공 시 호출
//    * - onUserCodeSuccess: 사용자 코드 인증 성공 시 호출
//    * - onLogout: 로그아웃 처리
//    * - onGoBackToRole: 역할 선택 화면으로 돌아가기
//    */
//   const {
//     onLoadingComplete,
//     onNavigateToRoleSelect,
//     onRoleSelected,
//     onAdminLoginSuccess,
//     onUserCodeSuccess,
//     onLogout,
//     onGoBackToRole
//   } = handlers;
  
//   /**
//    * 🧭 네비게이션 함수들 디스트럭처링
//    * - navigateToRoute: 특정 라우트로 이동
//    * - setActiveMenu: 활성 메뉴 설정
//    */
//   const { navigateToRoute, setActiveMenu } = navigation;

//   /**
//    * 🖥️ 현재 라우트에 따른 화면 렌더링 함수
//    * Switch 문을 통해 라우트별로 적절한 컴포넌트를 반환
//    * 각 화면에 필요한 Props를 전달하고 디버그 로깅을 수행
//    */
//   const renderCurrentScreen = () => {
//     console.log(`🖥️ 렌더링: ${currentRoute} (역할: ${selectedRole})`);

//     switch (currentRoute) {
//       // 🔄 초기 로딩 화면 - 앱 시작 시 3초간 표시되는 스플래시 화면
//       case 'loading':
//         return (
//           <LoadingScreen
//             onLoadingComplete={onLoadingComplete} // 로딩 완료 시 메인 화면으로 이동
//           />
//         );

//       // 🏠 메인 시작 화면 - 앱의 첫 번째 인터랙션 화면
//       case 'main':
//         return (
//           <MainScreen
//             onNavigateToDashboard={() => onNavigateToRoleSelect()} // "시작하기" 버튼 클릭 시 역할 선택으로 이동
//           />
//         );

//       // 🎭 역할 선택 화면 - 관리자/사용자 역할을 선택
//       case 'role':
//         return (
//           <RoleSelectionScreen
//             onRoleSelected={onRoleSelected} // 역할 선택 완료 시 해당 인증 화면으로 이동
//           />
//         );

//       // 🔐 관리자 로그인 화면 - 이메일/비밀번호 + 2단계 인증
//       case 'adminLogin':
//         console.log('🔋 관리자 로그인 화면 표시');
//         return (
//           <AuthSystem
//             onLoginSuccess={onAdminLoginSuccess} // 로그인 성공 시 대시보드로 이동
//             selectedRole={selectedRole}         // 선택된 역할 전달 (인증 로직에서 사용)
//             onGoBack={onGoBackToRole}           // 뒤로가기 버튼 시 역할 선택으로 돌아가기
//           />
//         );

//       // 🔒 사용자 코드 입력 화면 - 간단한 접근 코드 인증
//       case 'userCode':
//         console.log('🔒 사용자 코드 입력 화면 표시');
//         return (
//           <UserCodeScreen
//             onCodeSuccess={onUserCodeSuccess} // 코드 인증 성공 시 대시보드로 이동
//             onGoBack={onGoBackToRole}         // 뒤로가기 버튼 시 역할 선택으로 돌아가기
//           />
//         );

//       // 📊 메인 대시보드 - 실시간 센서 데이터 모니터링 화면
//       case 'dashboard':
//         return (
//           <DashboardScreen
//             onNavigateToChatbot={() => navigateToRoute('chatbot')}   // 챗봇 메뉴 클릭 시
//             onNavigateToHistory={() => navigateToRoute('history')}   // 히스토리 메뉴 클릭 시
//             onNavigateToSettings={() => navigateToRoute('settings')} // 설정 메뉴 클릭 시
//             onNavigateToRole={onLogout}                              // 로그아웃 시 역할 선택으로
//             // 주석 처리된 Props: 대시보드에서는 사이드바 메뉴 상태 관리 안 함
//             // activeMenu={activeMenu}
//             // setActiveMenu={setActiveMenu}
//           />
//         );

//       // 🤖 챗봇 화면 - AI 기반 질의응답 시스템
//       case 'chatbot':
//         return (
//           <ChatbotScreen
//             onNavigateToHistory={() => navigateToRoute('history')}     // 히스토리 메뉴로 이동
//             onNavigateToDashboard={() => navigateToRoute('dashboard')}  // 대시보드 메뉴로 이동
//             onNavigateToSettings={() => navigateToRoute('settings')}   // 설정 메뉴로 이동
//             onNavigateToRole={onLogout}                                // 로그아웃
//             activeMenu={activeMenu}                                    // 현재 활성 메뉴 상태
//             setActiveMenu={setActiveMenu}                              // 메뉴 상태 변경 함수
//           />
//         );

//       // 📋 히스토리 화면 - 센서 데이터 이력 조회 및 필터링
//       case 'history':
//         return (
//           <HistoryScreen
//             onNavigateBack={() => navigateToRoute('dashboard')}        // 뒤로가기 (대시보드로)
//             onNavigateToChatbot={() => navigateToRoute('chatbot')}      // 챗봇 메뉴로 이동
//             onNavigateToDashboard={() => navigateToRoute('dashboard')}  // 대시보드 메뉴로 이동
//             onNavigateToHistory={() => navigateToRoute('history')}      // 히스토리 새로고침
//             onNavigateToSettings={() => navigateToRoute('settings')}   // 설정 메뉴로 이동
//             onNavigateToRole={onLogout}                                // 로그아웃
//             activeMenu={activeMenu}                                    // 현재 활성 메뉴 상태
//             setActiveMenu={setActiveMenu}                              // 메뉴 상태 변경 함수
//           />
//         );

//       // ⚙️ 설정 화면 - 시스템 설정 및 환경 변수 관리
//       case 'settings':
//         return (
//           <SettingScreen
//             onNavigateToChatbot={() => navigateToRoute('chatbot')}      // 챗봇 메뉴로 이동
//             onNavigateToHistory={() => navigateToRoute('history')}      // 히스토리 메뉴로 이동
//             onNavigateToDashboard={() => navigateToRoute('dashboard')}   // 대시보드 메뉴로 이동
//             onNavigateToRole={onLogout}                                 // 로그아웃
//           />
//         );

//       // ⚠️ 알 수 없는 라우트 처리 - 에러 폴백 화면
//       default:
//         console.warn(`⚠️ 알 수 없는 라우트: ${currentRoute}`);
//         return (
//           <div className="error-screen">
//             <h1>페이지를 찾을 수 없습니다</h1>
//             <p>현재 라우트: {currentRoute}</p>
//             <button onClick={() => navigateToRoute('loading')}>
//               홈으로 돌아가기
//             </button>
//           </div>
//         );
//     }
//   };

//   /**
//    * 🎬 최종 렌더링 - 라우터 컨테이너와 현재 화면 표시
//    * app-router 클래스로 감싸서 전체 레이아웃 제어
//    */
//   return (
//     <div className="app-router">
//       {renderCurrentScreen()} {/* 현재 라우트에 맞는 화면 컴포넌트 렌더링 */}
//     </div>
//   );
// };

// export default AppRouter;

import React from 'react';
// 화면 컴포넌트 임포트
import LoadingScreen from '../../pages/Sloading/LoadingScreen';     // 초기 로딩 화면
import MainScreen from '../../pages/Main/MainScreen';               // 메인 시작 화면
import RoleSelectionScreen from '../../pages/RoleSelection/RoleSelectionScreen'; // 역할 선택
import AuthSystem from '../../pages/Login/LoginScreen';             // 관리자 로그인
import UserCodeScreen from '../../pages/Login/UserCodeScreen';      // 사용자 코드 입력
import DashboardScreen from '../../pages/Dashboard/DashboardScreen'; // 메인 대시보드
import ChatbotScreen from '../../pages/Chatbot/ChatbotScreen';       // 챗봇 화면
import HistoryScreen from '../../pages/History/HistoryScreen';       // 이력 조회
import SettingScreen from '../../pages/Setting/SettingScreen';       // 설정 화면
// 훅 및 타입 임포트
import { AppState, AppHandlers, AppNavigation } from '../../hooks/useAppRouter';

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
