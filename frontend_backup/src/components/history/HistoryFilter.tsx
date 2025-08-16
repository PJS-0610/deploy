// components/history/HistoryFilter.tsx
import React, { useRef, useEffect } from 'react';
import { Filter, RotateCcw, ChevronRight, ChevronDown } from 'lucide-react';
import { HistoryUtils } from '../../services/HistoryTypes';
import Calendar from './Calendar';
import { HistoryFilterProps } from '../../services/HistoryTypes';
import styles from './HistoryFilter.module.css';

const HistoryFilter: React.FC<HistoryFilterProps> = ({
  historyState,
  activeDropdown,
  setActiveDropdown,
  updateFilter,
  resetFilters,
  handleDateSelect,
  applyFilters,
  toggleFilters   
}) => {
  const dropdownRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (activeDropdown && dropdownRefs.current[activeDropdown] &&
        !dropdownRefs.current[activeDropdown]?.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeDropdown, setActiveDropdown]);

  const sensorTypeOptions = ['Temperature', 'Humidity', 'CO Concentration'];
  const statusOptions = ['GOOD', 'NORMAL', 'WARNING'];

  return (
    <section className={styles.filterSection}>
      <div className={styles.filterHeader}>
        <button
          className={styles.filterToggle}
          onClick={toggleFilters}
        >

          <Filter size={16} />
          <span>Filter By</span>
          <ChevronRight
            size={16}
            className={`${styles.filterIcon} ${historyState.showFilters ? styles.open : ''}`}
          />
        </button>

        <button
className={styles.filterToggle}
onClick={toggleFilters}   
>
          <RotateCcw size={14} />
          Reset Filter
        </button>
      </div>

      {historyState.showFilters && (
        <div className={styles.filterContent}>
          {/* 타임스탬프 필터 */}
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Timestamp</label>
            <div
              ref={el => dropdownRefs.current['timestamp'] = el}
              className={styles.datePickerContainer}
            >
              <button
                className={`${styles.filterDropdown} ${activeDropdown === 'timestamp' ? styles.active : ''}`}
                onClick={() => setActiveDropdown(
                  activeDropdown === 'timestamp' ? null : 'timestamp'
                )}
              >
                <span>
                  {historyState.selectedDate
                    ? HistoryUtils.formatDateToString(historyState.selectedDate)
                    : 'Select date'
                  }
                </span>
                <ChevronDown size={16} />
              </button>

              {activeDropdown === 'timestamp' && (
                <Calendar
                  selectedDate={historyState.selectedDate}
                  onDateSelect={handleDateSelect}
                  onClose={() => setActiveDropdown(null)}
                  onCheckNow={() => {
                    applyFilters();
                    setActiveDropdown(null);
                  }}
                />
              )}
            </div>
          </div>

          {/* 센서 타입 필터 */}
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Order Sensor Type</label>
            <div ref={el => dropdownRefs.current['sensorType'] = el}>
              <button
                className={`${styles.filterDropdown} ${activeDropdown === 'sensorType' ? styles.active : ''}`}
                onClick={() => setActiveDropdown(
                  activeDropdown === 'sensorType' ? null : 'sensorType'
                )}
              >
                <span>{historyState.filters.sensorType || 'All types'}</span>
                <ChevronDown size={16} />
              </button>

              {activeDropdown === 'sensorType' && (
                <div className={styles.filterDropdownMenu}>
                  <button
                    className={styles.filterDropdownItem}
                    onClick={() => updateFilter('sensorType', null)}
                  >
                    All types
                  </button>
                  {sensorTypeOptions.map(type => (
                    <button
                      key={type}
                      className={styles.filterDropdownItem}
                      onClick={() => updateFilter('sensorType', type)}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 상태 필터 */}
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Order Status</label>
            <div ref={el => dropdownRefs.current['status'] = el}>
              <button
                className={`${styles.filterDropdown} ${activeDropdown === 'status' ? styles.active : ''}`}
                onClick={() => setActiveDropdown(
                  activeDropdown === 'status' ? null : 'status'
                )}
              >
                <span>{historyState.filters.status || 'All status'}</span>
                <ChevronDown size={16} />
              </button>

              {activeDropdown === 'status' && (
                <div className={styles.filterDropdownMenu}>
                  <button
                    className={styles.filterDropdownItem}
                    onClick={() => updateFilter('status', null)}
                  >
                    All status
                  </button>
                  {statusOptions.map(status => (
                    <button
                      key={status}
                      className={styles.filterDropdownItem}
                      onClick={() => updateFilter('status', status)}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default HistoryFilter;