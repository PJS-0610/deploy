// /**
//  * ═══════════════════════════════════════════════════════════════
//  * 📋 HistoryFilter - 히스토리 데이터 필터링 컴포넌트
//  * ═══════════════════════════════════════════════════════════════
//  * 
//  * 히스토리 화면에서 데이터를 필터링하기 위한 종합적인 필터 UI 컴포넌트입니다.
//  * 다양한 조건으로 센서 데이터를 필터링하고 검색할 수 있는 기능을 제공합니다.
//  * 
//  * 주요 기능:
//  * - 날짜 필터: Calendar 컴포넌트를 통한 날짜 선택
//  * - 센서 타입 필터: Temperature, Humidity, CO Concentration
//  * - 상태 필터: GOOD, NORMAL, WARNING
//  * - 필터 토글: 필터 영역 표시/숨기기
//  * - 필터 초기화: 모든 필터 조건 리셋
//  * - 드롭다운 상호배타적 동작: 하나만 열림
//  * - 외부 클릭 감지: 드롭다운 자동 닫기
//  * 
//  * UI/UX 특징:
//  * - 아코디언 스타일 레이아웃
//  * - 현재 선택된 필터 값 표시
//  * - 드롭다운 활성 상태 시각적 피드백
//  * - useRef를 이용한 외부 클릭 감지 최적화
//  * - 각 드롭다운별 개별 ref 관리
//  */
// src/components/history/HistoryFilter.tsx
import React from 'react';
import styles from './HistoryFilter.module.css';
import { Filter, RotateCcw, ChevronDown } from 'lucide-react';
import { HistoryUtils } from '../../Services/HistoryTypes';
import Calendar from './Calendar';

type Props = {
  historyState: any;
  activeDropdown: string | null;
  setActiveDropdown: (v: string | null) => void;
  updateFilter: (key: 'sensorType' | 'status' | 'date', val: any) => void;
  resetFilters: () => void;
  handleDateSelect: (d: Date | null) => void;
  applyFilters: () => void;
  toggleFilters?: () => void; // 안 씀(항상 펼침)
};

// 프로젝트에 이미 있던 옵션 배열이 있다면 그대로 쓰세요.
// 없으면 아래 fallback을 사용해도 됩니다.
// 상단 근처
const SENSOR_OPTIONS = [
  { label: 'TEMPERATURE',         value: 'TEMP' },
  { label: 'HUMIDITY',            value: 'HUMI' },
  { label: 'CO2 CONCENTRATION',   value: 'GAS'  }, // 라벨은 자유, 값은 'GAS'
];

const STATUS_OPTIONS = ['GOOD', 'NORMAL', 'WARNING'];


const HistoryFilter: React.FC<Props> = ({
  historyState,
  activeDropdown,
  setActiveDropdown,
  updateFilter,
  resetFilters,
  handleDateSelect,
  applyFilters,
}) => {
  const openTimestamp = () =>
    setActiveDropdown(activeDropdown === 'timestamp' ? null : 'timestamp');

  const selectedDateText = historyState?.selectedDate
    ? HistoryUtils.formatDateToString(historyState.selectedDate)
    : 'Select date';
return (
  <section className={styles.filterBar}>
    {/* 왼쪽: Timestamp 그룹 */}
    <div className={styles.filterGroup}>
      <label className={styles.filterLabel}>TIMESTAMP</label>
      <div className={styles.datePickerContainer}>
        <button
          type="button"
          className={`${styles.filterDropdown} ${activeDropdown === 'timestamp' ? styles.active : ''}`}
          onClick={() => setActiveDropdown(activeDropdown === 'timestamp' ? null : 'timestamp')}
        >
          <span>
            {historyState?.selectedDate
              ? HistoryUtils.formatDateToString(historyState.selectedDate)
              : 'Select date'}
          </span>
          <ChevronDown size={16} />
        </button>

        {activeDropdown === 'timestamp' && (
          <div className={styles.calendarBox} role="dialog" aria-modal="true">
            <Calendar
              selectedDate={historyState.selectedDate}
              onDateSelect={(d) => { handleDateSelect(d); }}
              onClose={() => setActiveDropdown(null)}
              onCheckNow={() => { applyFilters(); setActiveDropdown(null); }}
            />
          </div>
        )}
      </div>
    </div>

    {/* 오른쪽: Sensor Type & Status 세로 배치 */}
    <div className={styles.filterGroupVertical}>
      {/* Sensor Type 그룹 */}
      <div className={styles.filterSubGroup}>
        <label className={styles.filterLabel}>SENSOR TYPE</label>
        <div className={styles.pillRow}>
          <button
            type="button"
            className={`${styles.filterPill} ${!historyState?.filters?.sensorType ? styles.selected : ''}`}
            onClick={() => { updateFilter('sensorType', null); applyFilters(); }}
          >
            ALL SENSOR TYPE
          </button>

          <button
            type="button"
            className={`${styles.filterPill} ${historyState?.filters?.sensorType === 'TEMP' ? styles.selected : ''}`}
            onClick={() => { updateFilter('sensorType', 'TEMP'); applyFilters(); }}
          >
            TEMPERATURE
          </button>
          <button
            type="button"
            className={`${styles.filterPill} ${historyState?.filters?.sensorType === 'HUMI' ? styles.selected : ''}`}
            onClick={() => { updateFilter('sensorType', 'HUMI'); applyFilters(); }}
          >
            HUMIDITY
          </button>
          <button
            type="button"
            className={`${styles.filterPill} ${historyState?.filters?.sensorType === 'GAS' ? styles.selected : ''}`}
            onClick={() => { updateFilter('sensorType', 'GAS'); applyFilters(); }}
          >
            CO₂ CONCENTRATION
          </button>
        </div>
      </div>

      {/* Status 그룹 */}
      <div className={styles.filterSubGroup}>
        <label className={styles.filterLabel}>STATUS</label>
        <div className={styles.pillRow}>
          <button
            type="button"
            className={`${styles.filterPill} ${!historyState?.filters?.status ? styles.selected : ''}`}
            onClick={() => { updateFilter('status', null); applyFilters(); }}
          >
            ALL STATUS
          </button>
          <button
            type="button"
            className={`${styles.filterPill} ${historyState?.filters?.status === 'GOOD' ? styles.selected : ''}`}
            onClick={() => { updateFilter('status', 'GOOD'); applyFilters(); }}
          >
            GOOD
          </button>
          <button
            type="button"
            className={`${styles.filterPill} ${historyState?.filters?.status === 'NORMAL' ? styles.selected : ''}`}
            onClick={() => { updateFilter('status', 'NORMAL'); applyFilters(); }}
          >
            NORMAL
          </button>
          <button
            type="button"
            className={`${styles.filterPill} ${historyState?.filters?.status === 'WARNING' ? styles.selected : ''}`}
            onClick={() => { updateFilter('status', 'WARNING'); applyFilters(); }}
          >
            WARNING
          </button>
        </div>
      </div>
    </div>

    {/* 오른쪽 끝: Reset 버튼 */}
    <div className={styles.filterActions}>
      <button
        type="button"
        className={styles.resetBtn}
        onClick={() => { resetFilters(); setActiveDropdown(null); }}
      >
        RESET FILTER
      </button>
    </div>
  </section>
);
};

export default HistoryFilter;
