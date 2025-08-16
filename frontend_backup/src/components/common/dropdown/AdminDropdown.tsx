import React from 'react';
import BaseDropdown from './BaseDropdown';
import styles from './Dropdown.module.css';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onProfile?: () => void;
  onAccount?: () => void;
  onLogout?: () => void;
};

/** 관리자 메뉴 (공통 스타일 사용) */
const AdminDropdown: React.FC<Props> = ({
  isOpen,
  onClose,
  onProfile,
  onAccount,
  onLogout,
}) => {
  return (
    <BaseDropdown isOpen={isOpen} onClose={onClose} title="관리자 메뉴">
      <div className={styles.list}>
        <button className={styles.item} onClick={() => { onProfile?.(); onClose(); }}>
          프로필 설정
        </button>
        <button className={styles.item} onClick={() => { onAccount?.(); onClose(); }}>
          계정 관리
        </button>

        <div className={styles.divider} />

        <button
          className={`${styles.item} ${styles.itemDanger}`}
          onClick={() => { onLogout?.(); onClose(); }}
        >
          로그아웃
        </button>
      </div>
    </BaseDropdown>
  );
};

export default AdminDropdown;
