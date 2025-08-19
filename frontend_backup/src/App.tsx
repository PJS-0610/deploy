/**
 * ═══════════════════════════════════════════════════════════════
 * 🚀 App - 메인 애플리케이션 컴포넌트
 * ═══════════════════════════════════════════════════════════════
 * 
 * 주요 기능:
 * - 전체 애플리케이션의 라우팅 및 상태 관리
 * - 사용자 인증 플로우 제어
 * - 역할 기반 접근 제어 (관리자/사용자)
 * - 세션 관리 및 지속성
 * 
 * 애플리케이션 플로우:
 * 1. 🔄 로딩 화면 (3초 스플래시)
 * 2. 🏠 메인 화면 (시작 버튼)
 * 3. 🎭 역할 선택 (admin/user)
 * 4. 🔐 인증 단계:
 *    - 관리자: 이메일/비밀번호 + 2단계 인증
 *    - 사용자: 접근 코드 입력
 * 5. 📊 대시보드 진입 (실시간 센서 모니터링)
 * 6. 🔄 기능 화면 이동:
 *    - 대시보드: 센서 데이터 시각화
 *    - 챗봇: AI 기반 질의응답
 *    - 히스토리: 센서 데이터 이력 조회
 * 
 * 상태 관리:
 * - useAppRouter 훅을 통한 중앙 집중식 상태 관리
 * - 세션 스토리지를 통한 인증 상태 지속성
 * - 로컬 스토리지를 통한 역할 선택 기억
 * 
 * 개발 도구:
 * - 개발 환경에서 실시간 상태 디버그 정보 표시
 * - 라우트, 역할, 인증 상태, 활성 메뉴 추적
 */

// App.tsx - 메인 애플리케이션 컴포넌트
import React from 'react';
import AppRouter from './components/AppRouter/AppRouter';
import { useAppRouter } from './hooks/useAppRouter';
import AnomalyAlert from './pages/Dashboard/hooks/AnomalyAlert';
import './App.css';

/**
 * 🎯 메인 애플리케이션 컴포넌트
 * 
 * 최상위 컴포넌트로서 전체 애플리케이션의 상태와 라우팅을 관리합니다.
 * 모든 화면 전환과 사용자 인증 플로우가 이곳에서 제어됩니다.
 */
const App: React.FC = () => {
  /**
   * 🔧 애플리케이션 상태 및 라우터 훅
   * - appState: 현재 라우트, 사용자 역할, 인증 상태 등
   * - handlers: 각종 이벤트 핸들러 함수들
   * - navigation: 라우트 변경 및 네비게이션 함수들
   */
  const { appState, handlers, navigation } = useAppRouter();

  return (
    <div className="app">
      {/* ✅ 전역 알림 트리거: 어떤 라우트(history 포함)에서도 ANOMALY_TRIGGER 사용 가능 */}
      <AnomalyAlert
        enabled={true}
        interval={60000}
        autoHideDelay={60000}
        s3ApiEndpoint={process.env.REACT_APP_S3_API_ENDPOINT}
        thresholds={{
          temperature: { dangerMax: 35 }, // 최소 필요 필드만 지정해도 OK
          humidity: { dangerMax: 80 },
          gas: { dangerMax: 1000 },
        }}
      />

      {/* 🧭 중앙 라우터 컴포넌트 */}
      {/* 
        AppRouter가 현재 상태에 따라 적절한 화면 컴포넌트를 렌더링
        - 상태 기반 조건부 렌더링
        - 이벤트 핸들러 Props 전달
        - 네비게이션 함수 제공
      */}
      <AppRouter
        appState={appState}       // 현재 애플리케이션 상태
        handlers={handlers}       // 이벤트 핸들러 모음
        navigation={navigation}   // 네비게이션 함수 모음
      />
    </div>
  );
};

export default App;