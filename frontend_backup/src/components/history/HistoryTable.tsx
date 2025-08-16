// components/history/HistoryTable.tsx
import React from 'react';
import { ChevronLeft, ChevronRight, FileText } from 'lucide-react';
import { HistoryUtils } from '../../services/HistoryTypes';
import { HistoryTableProps } from '../../services/HistoryTypes';
import styles from './HistoryTable.module.css';

const HistoryTable: React.FC<HistoryTableProps> = ({
  historyState,
  changePage
}) => {
  if (historyState.isLoading) {
    return (
      <div className={styles.loading}>
        <div className={styles.loadingSpinner}></div>
        <span className={styles.loadingText}>데이터를 불러오는 중...</span>
      </div>
    );
  }

  if (historyState.events.length === 0) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyStateIcon}>
          <FileText size={24} />
        </div>
        <div className={styles.emptyStateTitle}>조회된 데이터가 없습니다</div>
        <div className={styles.emptyStateDescription}>
          필터 조건을 변경하거나 다른 날짜를 선택해 보세요.
        </div>
      </div>
    );
  }

  return (
    <>
      <table className={styles.table}>
        <thead className={styles.tableHeader}>
          <tr>
            <th className={styles.tableHeaderCell}>Event ID</th>
            <th className={styles.tableHeaderCell}>Timestamp</th>
            <th className={styles.tableHeaderCell}>Sensor Type</th>
            <th className={styles.tableHeaderCell}>Value</th>
            <th className={styles.tableHeaderCell}>Status</th>
          </tr>
        </thead>
        <tbody>
          {historyState.events.map((event: any) => (
            <tr key={event.eventId} className={styles.tableRow}>
              <td className={styles.tableCell}>
                <span className={styles.eventId}>{event.eventId}</span>
              </td>
              <td className={styles.tableCell}>
                <span className={styles.timestamp}>
                  {HistoryUtils.formatTimestamp(event.timestamp)}
                </span>
              </td>
              <td className={styles.tableCell}>
                <span className={styles.sensorType}>{event.sensorType}</span>
              </td>
              <td className={styles.tableCell}>
                <span className={styles.value}>
                  {event.value}{HistoryUtils.getSensorUnit(event.sensorType)}
                </span>
              </td>
              <td className={styles.tableCell}>
                <span className={`${styles.statusBadge} ${styles[HistoryUtils.getStatusClass(event.status)]}`}>
                  {event.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* 페이지네이션 */}
      {historyState.totalPages > 1 && (
        <div className={styles.pagination}>
          <button
            className={styles.paginationButton}
            onClick={() => changePage(historyState.currentPage - 1)}
            disabled={historyState.currentPage <= 1}
          >
            <ChevronLeft size={16} />
          </button>

          <span className={styles.paginationInfo}>
            {historyState.currentPage} / {historyState.totalPages}
          </span>

          <button
            className={styles.paginationButton}
            onClick={() => changePage(historyState.currentPage + 1)}
            disabled={historyState.currentPage >= historyState.totalPages}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </>
  );
};

export default HistoryTable;