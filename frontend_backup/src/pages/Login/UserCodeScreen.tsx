// pages/UserCode/UserCodeScreen.tsx - 사용자 코드 입력 화면 (LoginScreen과 일관성 맞춤)
import React, { useState } from 'react';
import styles from './UserCodeScreen.module.css';

interface UserCodeScreenProps {
  onCodeSuccess: () => void;
  onGoBack: () => void;
}

const UserCodeScreen: React.FC<UserCodeScreenProps> = ({ onCodeSuccess, onGoBack }) => {
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // 유효한 코드 목록 (실제로는 서버에서 검증해야 함)
  const validCodes = ['USER001', 'USER002', 'USER003', 'DEMO2024'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!code.trim()) {
      setError('코드를 입력해주세요.');
      return;
    }

    setIsLoading(true);
    setError('');

    // 코드 검증 시뮬레이션 (실제로는 API 호출)
    setTimeout(() => {
      if (validCodes.includes(code.toUpperCase())) {
        onCodeSuccess();
      } else {
        setError('유효하지 않은 코드입니다. 다시 시도해주세요.');
      }
      setIsLoading(false);
    }, 1000);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCode(e.target.value.toUpperCase());
    setError('');
  };

  return (
    <div className={`${styles.container} ${isLoading ? styles.loading : ""}`}>
      {/* 배경 패턴 - LoginScreen과 동일한 패턴 */}
      <div className={styles.backgroundPattern} aria-hidden="true">
        <svg viewBox="0 0 1000 1000" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="geometric" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
              <path d="M20,20 L80,20 L50,80 Z" fill="none" stroke="#f39c12" strokeWidth="1" opacity="0.1"/>
              <circle cx="80" cy="80" r="15" fill="none" stroke="#3498db" strokeWidth="1" opacity="0.1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#geometric)"/>
          <path d="M100,500 Q300,300 500,500 T900,500" stroke="#f39c12" strokeWidth="2" fill="none" opacity="0.2"/>
          <path d="M200,200 L400,300 L600,200 L800,300" stroke="#e67e22" strokeWidth="1" fill="none" opacity="0.3"/>
        </svg>
      </div>

      {/* 헤더 - LoginScreen과 동일한 구조 */}
      <header className={styles.header}>
        <div className={styles.logo}>
          <span className={styles.logoText}>AWS²</span>
          <div className={styles.logoGiot}>
            GIOT
            <div className={styles.wifiIcon}></div>
          </div>
        </div>
        <div className={styles.subtitle}>Air Watch System</div>
      </header>

      {/* 메인 카드 - LoginScreen의 authContainer와 동일한 구조 */}
      <div className={styles.card}>
        <div className={styles.cardPanel}>
          {/* 뒤로가기 버튼 */}
          <button 
            type="button"
            className={styles.backButton}
            onClick={onGoBack}
            disabled={isLoading}
          >
            ← 역할 선택으로 돌아가기
          </button>

          {/* 역할 표시기 */}
          <div className={styles.roleIndicator}>
            <span className={styles.roleLabel}>선택된 역할:</span>
            <span className={styles.roleValue}>사용자</span>
          </div>

          {/* 아이콘과 제목 */}
          <div className={styles.iconContainer}>
            <span className={styles.icon}>🔑</span>
          </div>
          
          <h2 className={styles.title}>사용자 코드 입력</h2>
          <p className={styles.subtitle}>관리자로부터 받은 접근 코드를 입력해주세요</p>

          {/* 코드 입력 폼 */}
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formGroup}>
              <label className={styles.label}>접근 코드</label>
              <input
                type="text"
                value={code}
                onChange={handleInputChange}
                placeholder="코드를 입력하세요 (예: USER001)"
                className={`${styles.input} ${error ? styles.inputError : ''}`}
                disabled={isLoading}
              />
              {error && (
                <div className={styles.errorMessage}>{error}</div>
              )}
            </div>

            {/* 버튼들 */}
            <div className={styles.buttonGroup}>
              <button
                type="button"
                onClick={onGoBack}
                disabled={isLoading}
                className={styles.secondaryButton}
              >
                뒤로가기
              </button>
              
              <button
                type="submit"
                disabled={isLoading || !code.trim()}
                className={styles.primaryButton}
              >
                {isLoading ? (
                  <>
                    <div className={styles.spinner} />
                    확인 중...
                  </>
                ) : (
                  '접속하기'
                )}
              </button>
            </div>
          </form>

          {/* 도움말 */}
          <div className={styles.helpSection}>
            <h3 className={styles.helpTitle}>💡 도움말</h3>
            <ul className={styles.helpList}>
              <li>접근 코드는 시스템 관리자로부터 받을 수 있습니다</li>
              <li>코드는 대문자로 입력해주세요</li>
              <li>문제가 있다면 관리자에게 문의하세요</li>
              <li><strong>테스트 코드:</strong> USER001, DEMO2024</li>
            </ul>
          </div>
        </div>

        {/* 사이드 패널 - LoginScreen과 동일한 오렌지 그라데이션 */}
        <div className={styles.sidePanel}></div>
      </div>

      {/* 푸터 - LoginScreen과 동일 */}
      <footer className={styles.footer}>2025 GBSA AWS</footer>
    </div>
  );
};

export default UserCodeScreen;