import React from 'react';
import styles from './Dropdown.module.css';

export type BaseDropdownProps = {
  isOpen: boolean;
  onClose: () => void;
  /** 드롭다운 내부를 자유롭게 렌더(공통 컨테이너 + 오버레이 제공) */
  children: React.ReactNode;
  /** (옵션) 제목이 필요하면 전달 */
  title?: string;
};

/**
 * BaseDropdown
 * - 공통 컨테이너(포지션/그림자/둥근모서리) + 외부클릭(overlay) 제공
 * - 내부 콘텐츠는 children으로 주입
 */
const BaseDropdown: React.FC<BaseDropdownProps> = ({ isOpen, onClose, children, title }) => {
  if (!isOpen) return null;

  return (
    <>
      <div className={styles.dropdown} role="dialog" aria-modal="true">
        {title && (
          <div className={styles.dropdownHeader}>
            <h3 className={styles.dropdownTitle}>{title}</h3>
          </div>
        )}
        {children}
      </div>
      <button
        className={styles.overlay}
        aria-label="닫기"
        onClick={onClose}
      />
    </>
  );
};

export default BaseDropdown;
