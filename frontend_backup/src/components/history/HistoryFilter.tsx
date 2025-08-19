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

// import React from 'react';
// // Lucide React 아이콘 임포트
// import { Filter, RotateCcw, ChevronRight, ChevronDown } from 'lucide-react';
// // 서비스 및 유틸리티 임포트
// import { HistoryUtils } from '../../services/HistoryTypes';
// // 하위 컴포넌트 임포트
// import Calendar from './Calendar';
// // 타입 정의 임포트
// import { HistoryFilterProps } from '../../services/HistoryTypes';
// // CSS 모듈 스타일 임포트
// import styles from './HistoryFilter.module.css';

// /**
//  * 📋 HistoryFilter 메인 컴포넌트
//  * 
//  * 히스토리 데이터 필터링을 위한 종합적인 UI를 제공합니다.
//  * 다중 드롭다운 관리, 외부 클릭 감지, 필터 상태 관리 등을 담당합니다.
//  * 
//  * @param historyState - 히스토리 전체 상태 (필터, 데이터, UI 상태 등)
//  * @param activeDropdown - 현재 열려있는 드롭다운 ID
//  * @param setActiveDropdown - 드롭다운 열기/닫기 상태 설정 함수
//  * @param updateFilter - 개별 필터 값 업데이트 함수
//  * @param resetFilters - 모든 필터 초기화 함수
//  * @param handleDateSelect - 날짜 선택 처리 함수
//  * @param applyFilters - 필터 적용 및 데이터 조회 함수
//  * @param toggleFilters - 필터 영역 표시/숨기기 토글 함수
//  */

// const HistoryFilter: React.FC<HistoryFilterProps> = ({
//   historyState,
//   activeDropdown,
//   setActiveDropdown,
//   updateFilter,
//   resetFilters,
//   handleDateSelect,
//   applyFilters,
//   toggleFilters
// }) => {
//   // 드롭다운 기반 토글은 제거(항상 펼침)
//   /**
//    * 🌡️ 센서 타입 필터 옵션
//    * 시스템에서 지원하는 센서 종류들
//    */
//   const sensorTypeOptions = ['Temperature', 'Humidity', 'CO₂ Concentration'];

//   /**
//    * 🚨 상태 필터 옵션
//    * 센서 데이터의 상태 분류
//    */
//   const statusOptions = ['GOOD', 'NORMAL', 'WARNING'];

//   return (
//     <section className={styles.filterSection}>
//       <div className={styles.filterHeader}>
//         {/* ✅ 큰 토글 제거: 정적 타이틀로 교체 */}
//         <div className={styles.filterTitle}>
//           <Filter size={16} />
//           <span>Filter By</span>
//         </div>
//         <button
//           className={styles.resetButton}  // 선택: 빨간 테두리 스타일 쓰고 싶으면
//           onClick={() => {
//             resetFilters();         // ✅ 필터 값/데이터 초기화
//             setActiveDropdown(null); // ✅ 열려있던 드롭다운 닫기(옵션)
//           }}
//         >
//           <RotateCcw size={14} />
//           RESET FILTER
//         </button>

//       </div>

//       {/* ✅ 항상 펼침 */}
//       <div className={`${styles.filterContent} ${styles.filtersRow}`}>
//         {/* 타임스탬프 필터 */}
//         <div className={`${styles.filterGroup} ${styles.filterGroupRow}`}>
//           <label className={styles.filterLabel}>TIMESTAMP</label>
//           {/* ✅ 드롭다운 대신 인라인 달력 */}
//           <div className={styles.calendarBox}>
//             <Calendar
//               selectedDate={historyState.selectedDate}
//               onDateSelect={handleDateSelect}
//               onClose={() => { }}
//               onCheckNow={() => {
//                 applyFilters();
//               }}
//             />
//           </div>
//         </div>

//         {/* 센서 타입 필터 */}
//         <div className={`${styles.filterGroup} ${styles.filterGroupRow}`}>
//           {/* ✅ 드롭다운 → 칩 버튼 가로 나열 */}
//           <div className={styles.chips}>
//             <button
//               className={`${styles.chip} ${!historyState.filters.sensorType ? styles.chipActive : ''}`}
//               onClick={() => updateFilter('sensorType', null)}
//             >
//               All types
//             </button>
//             {sensorTypeOptions.map((type) => (
//               <button
//                 key={type}
//                 className={`${styles.chip} ${historyState.filters.sensorType === type ? styles.chipActive : ''}`}
//                 onClick={() => updateFilter('sensorType', type)}
//               >
//                 {type}
//               </button>
//             ))}
//           </div>
//         </div>

//         {/* 상태 필터 */}
//         <div className={`${styles.filterGroup} ${styles.filterGroupRow}`}>
//           {/* ✅ 드롭다운 → 칩 버튼 가로 나열 */}
//           <div className={styles.chips}>
//             <button
//               className={`${styles.chip} ${!historyState.filters.status ? styles.chipActive : ''}`}
//               onClick={() => updateFilter('status', null)}
//             >
//               All status
//             </button>
//             {statusOptions.map((status) => (
//               <button
//                 key={status}
//                 className={`${styles.chip} ${historyState.filters.status === status ? styles.chipActive : ''}`}
//                 onClick={() => updateFilter('status', status)}
//               >
//                 {status}
//               </button>
//             ))}
//           </div>
//         </div>
//         </div>
//     </section>
//   );
// };

// export default HistoryFilter;
// src/components/history/HistoryFilter.tsx
import React from 'react';
import styles from './HistoryFilter.module.css';
import { Filter, RotateCcw, ChevronDown } from 'lucide-react';
import { HistoryUtils } from '../../services/HistoryTypes';
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
      <label className={styles.filterLabel}>Timestamp</label>
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
        <label className={styles.filterLabel}>Sensor Type</label>
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
            CO2 CONCENTRATION
          </button>
        </div>
      </div>

      {/* Status 그룹 */}
      <div className={styles.filterSubGroup}>
        <label className={styles.filterLabel}>Status</label>
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
        Reset Filter
      </button>
    </div>
  </section>
);

//   return (
//     <section className={styles.filterSection}>
//       {/* 헤더 */}
//       <div className={styles.filterHeader}>
//         <div className={styles.filterTitle}>
//           <Filter size={16} />
//           <span>Filter By</span>
//         </div>

//         <button
//           type="button"
//           className={styles.resetButton}
//           onClick={() => {
//             resetFilters();
//             setActiveDropdown(null);
//           }}
//         >
//           <RotateCcw size={14} />
//           Reset Filter
//         </button>
//       </div>

//       {/* 항상 펼침 + 가로 배치 */}
//       <div className={`${styles.filterContent} ${styles.filtersRow}`}>
//         {/* Timestamp (달력만 토글) */}
//         <div className={`${styles.filterGroup} ${styles.filterGroupRow}`}>
//           <label className={styles.filterLabel}>Timestamp</label>

//           <div className={styles.datePickerContainer}>
//             <button
//               type="button"
//               className={`${styles.filterDropdown} ${activeDropdown === 'timestamp' ? styles.active : ''
//                 }`}
//               onClick={openTimestamp}
//             >
//               <span>{selectedDateText}</span>
//               <ChevronDown size={16} />
//             </button>

//             {activeDropdown === 'timestamp' && (
//               <div className={styles.calendarBox} role="dialog" aria-modal="true">
//                 <Calendar
//                   selectedDate={historyState.selectedDate}
//                   onDateSelect={(d) => {
//                     handleDateSelect(d);
//                   }}
//                   onClose={() => setActiveDropdown(null)}
//                   onCheckNow={() => {
//                     applyFilters();
//                     setActiveDropdown(null);
//                   }}
//                 />
//               </div>
//             )}
//           </div>
//         </div>

// {/* Sensor Type */}
// <div className={styles.sectionBox}>
//   <div className={styles.sectionTitle}>Sensor Type</div>
//   <div className={styles.chips}>
//     {/* All */}
//     <button
//       type="button"
//       key="sensor-all"
//       className={`${styles.chip} ${!historyState?.filters?.sensorType ? styles.chipActive : ''}`}
//       onClick={() => { updateFilter('sensorType', null); applyFilters(); }}
//     >
//       ALL SENSOR TYPE
//     </button>

//     {SENSOR_OPTIONS.map(opt => (
//       <button
//         key={`sensor-${opt.value}`}
//         type="button"
//         className={`${styles.chip} ${historyState?.filters?.sensorType === opt.value ? styles.chipActive : ''}`}
//         onClick={() => { updateFilter('sensorType', opt.value); applyFilters(); }}
//       >
//         {opt.label}
//       </button>
//     ))}
//   </div>
// </div>

// {/* Status */}
// <div className={styles.sectionBox}>
//   <div className={styles.sectionTitle}>Status</div>
//   <div className={styles.chips}>
//     <button
//       type="button"
//       key="status-all"
//       className={`${styles.chip} ${!historyState?.filters?.status ? styles.chipActive : ''}`}
//       onClick={() => { updateFilter('status', null); applyFilters(); }}
//     >
//       ALL STATUS
//     </button>

//     {STATUS_OPTIONS.map(st => (
//       <button
//         key={`status-${st}`}
//         type="button"
//         className={`${styles.chip} ${historyState?.filters?.status === st ? styles.chipActive : ''}`}
//         onClick={() => { updateFilter('status', st); applyFilters(); }}
//       >
//         {st}
//       </button>
//     ))}
//   </div>
// </div>

//       </div>
//     </section>
//   );
};

export default HistoryFilter;
