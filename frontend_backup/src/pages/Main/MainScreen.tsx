/**
 * MainScreen.tsx - 메인 진입 화면 컴포넌트
 * 
 * 애플리케이션 시작 후 사용자가 처음 만나는 메인 화면입니다.
 * 시스템 초기화 상태를 표시하고 자동으로 다음 화면으로 이동합니다.
 * 
 * 주요 기능:
 * - 시스템 초기화 상태 표시
 * - 로딩 애니메이션 제공
 * - 자동 화면 전환 (1초 후)
 * - 수동 진행 버튼 제공 (테스트용)
 */
import React, { useEffect } from "react";
import styles from "./MainScreen.module.css";

/**
 * 메인 화면 컴포넌트의 props 인터페이스
 */
interface MainScreenProps {
  /** 다음 화면으로 이동하는 콜백 함수 */
  onNavigateToDashboard: () => void;
}

/**
 * 메인 진입 화면 컴포넌트
 * 
 * 사용자에게 시스템 초기화 상태를 보여주고 자동으로 다음 화면으로 이동합니다.
 * 
//  * @param props MainScreenProps
//  * @returns 메인 화면 JSX 엘리먼트
 */
const MainScreen: React.FC<MainScreenProps> = ({ onNavigateToDashboard }) => {
  /**
   * 자동 화면 전환 효과
   * 
   * 컴포넌트 마운트 1초 후 자동으로 다음 화면으로 이동합니다.
   */
  useEffect(() => {
    const timer = setTimeout(() => {
      onNavigateToDashboard();
    }, 1000);
    return () => clearTimeout(timer);
  }, [onNavigateToDashboard]);

  return (
    <div className={styles.mainContainer} onClick={onNavigateToDashboard}>
      {/* 배경 기하학적 패턴 */}
      <div className={styles.mainGeometricBackground}>
        <div className={`${styles.mainGeometricShape} ${styles.mainHexagon1}`}></div>
        <div className={`${styles.mainGeometricShape} ${styles.mainHexagon2}`}></div>
        <div className={`${styles.mainGeometricShape} ${styles.mainHexagon3}`}></div>
        <div className={`${styles.mainGeometricShape} ${styles.mainHexagon4}`}></div>
        <div className={`${styles.mainGeometricShape} ${styles.mainCenterHexagon}`}></div>
        <div className={`${styles.mainGeometricShape} ${styles.mainLinePattern1}`}></div>
        <div className={`${styles.mainGeometricShape} ${styles.mainLinePattern2}`}></div>
      </div>

      {/* 메인 로고 영역 */}
      <div className={styles.mainLogoContainer}>
        <div className={styles.mainLogoText}>
          <span className={styles.mainLogoMain}>AWS</span>
          <span className={styles.mainLogoAccent}>²</span>
          <span className={styles.mainLogoMain}>GiOT</span>
        </div>
        <div className={styles.mainLogoSubtext}>Green IoT System</div>

        {/* 화살표 */}
        <div className={styles.mainArrowContainer}>
          <div className={styles.mainArrow}>
            <div className={styles.mainArrowHead}></div>
          </div>
        </div>
      </div>

      {/*상태 표시 영역*/}
      <div className={styles.statusContainer}>
        <div className={styles.statusText}>시스템을 시작하고 있습니다...</div>
        <div className={styles.statusIndicators}>
          <div className={styles.statusIndicator}>
            <div className={`${styles.statusDot} ${styles.statusDotConnected}`}></div>
            <span className={styles.statusLabel}>AWS 연결됨</span>
          </div>
          <div className={styles.statusIndicator}>
            <div className={`${styles.statusDot} ${styles.statusDotConnected}`}></div>
            <span className={styles.statusLabel}>IoT 센서 활성화</span>
          </div>
        </div>

        {/*수동 진행 버튼*/}
        <button onClick={onNavigateToDashboard} className={styles.mainRetryButton} style={{marginTop: '20px'}}>
          Get Started
        </button>
      </div>

      {/* 클릭 힌트 */}
      <div className={styles.clickHint}>화면을 클릭하거나 Get Started 버튼을 눌러주세요</div>

      {/* 하단 카피라이트 */}
      <div className={styles.mainCopyright}>© 2024 AWS² GiOT System. All rights reserved.</div>
    </div>
  );
};

export default MainScreen;