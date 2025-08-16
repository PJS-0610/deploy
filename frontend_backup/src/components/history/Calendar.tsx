// components/history/Calendar.tsx
import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { CalendarProps, DayCell } from '../../services/HistoryTypes';
import styles from './Calendar.module.css';

const Calendar: React.FC<CalendarProps> = ({ 
  selectedDate, 
  onDateSelect, 
  onClose, 
  onCheckNow 
}) => {
  const [currentMonth, setCurrentMonth] = useState(
    selectedDate || new Date()
  );

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  const getDaysInMonth = (date: Date): DayCell[] => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: DayCell[] = [];

    // 이전 달의 마지막 날들
    const prevMonthLastDate = new Date(year, month, 0).getDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonthLastDate - i),
        isCurrentMonth: false,
      });
    }

    // 현재 달의 날들
    for (let day = 1; day <= daysInMonth; day++) {
      days.push({
        date: new Date(year, month, day),
        isCurrentMonth: true
      });
    }

    // 다음 달의 첫 날들 (총 42개까지 채우기)
    const remainingDays = 42 - days.length;
    for (let day = 1; day <= remainingDays; day++) {
      days.push({
        date: new Date(year, month + 1, day),
        isCurrentMonth: false
      });
    }

    return days;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + (direction === 'next' ? 1 : -1));
      return newDate;
    });
  };

  const isSelected = (date: Date) => {
    return selectedDate &&
      date.getFullYear() === selectedDate.getFullYear() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getDate() === selectedDate.getDate();
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate();
  };

  const days = getDaysInMonth(currentMonth);

  return (
    <>
      <div className={styles.datePicker}>
        <div className={styles.calendarHeader}>
          <button
            className={styles.calendarNavButton}
            onClick={() => navigateMonth('prev')}
          >
            <ChevronLeft size={16} />
          </button>

          <div className={styles.calendarMonthYear}>
            {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </div>

          <button
            className={styles.calendarNavButton}
            onClick={() => navigateMonth('next')}
          >
            <ChevronRight size={16} />
          </button>
        </div>

        <div className={styles.calendarGrid}>
          {dayNames.map(day => (
            <div key={day} className={styles.calendarDayHeader}>
              {day}
            </div>
          ))}

          {days.map((dayInfo, index) => (
            <button
              key={index}
              className={`${styles.calendarDay} ${!dayInfo.isCurrentMonth ? styles.otherMonth : ''
                } ${isSelected(dayInfo.date) ? styles.selected : ''
                } ${isToday(dayInfo.date) ? styles.today : ''
                }`}
              onClick={() => onDateSelect(dayInfo.date)}
            >
              {dayInfo.date.getDate()}
            </button>
          ))}
        </div>

        <div className={styles.calendarActions}>
          <button
            className={styles.checkNowButton}
            onClick={onCheckNow}
          >
            Check Now
          </button>
        </div>
      </div>

      <div
        className={styles.dropdownOverlay}
        onClick={onClose}
      />
    </>
  );
};

export default Calendar;