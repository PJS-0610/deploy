// src/pages/History/hooks/UseHistoryData.tsx
import { useState, useCallback, useEffect } from 'react';
import { HistoryAPI, HistoryUtils, HistoryState, HistoryFilters } from '../../../services/HistoryTypes';

const initialState: HistoryState = {
  isLoading: false,
  error: null,
  showFilters: false,
  showDatePicker: false,        // ← HistoryState에 필수
  selectedDate: null,
  filters: { date: null, sensorType: null, status: null },
  events: [],
  totalPages: 1,
  currentPage: 1,
};

export default function useHistoryData() {
  const [historyState, setHistoryState] = useState<HistoryState>(initialState);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const updateFilter = useCallback((key: keyof HistoryFilters, value: string | null) => {
    setHistoryState((prev) => ({
      ...prev,
      filters: { ...prev.filters, [key]: value },
    }));
  }, []);

  const resetFilters = useCallback(() => {
    setHistoryState((prev) => ({
      ...prev,
      selectedDate: null,
      filters: { date: null, sensorType: null, status: null },
    }));
  }, []);

  const handleDateSelect = useCallback((date: Date) => {
    setHistoryState((prev) => ({
      ...prev,
      selectedDate: date,
      // formatDate가 Date | string 모두 받도록 HistoryUtils 수정됨
      filters: { ...prev.filters, date: HistoryUtils.formatDate(date) },
    }));
  }, []);

  const applyFilters = useCallback(async (page: number = 1) => {
    setHistoryState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const { events, totalPages } = await HistoryAPI.fetchEvents(historyState.filters, page);
      setHistoryState((prev) => ({
        ...prev,
        events,
        totalPages,
        currentPage: page,
        isLoading: false,
      }));
    } catch (e) {
      setHistoryState((prev) => ({ ...prev, isLoading: false, error: '데이터 로딩 실패' }));
    }
  }, [historyState.filters]);

  const changePage = useCallback(async (page: number) => {
    setHistoryState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const { events } = await HistoryAPI.fetchEvents(historyState.filters, page);
      setHistoryState((prev) => ({
        ...prev,
        events,
        currentPage: page,
        isLoading: false,
      }));
    } catch (e) {
      setHistoryState((prev) => ({ ...prev, isLoading: false, error: '페이지 로딩 실패' }));
    }
  }, [historyState.filters]);

  const toggleFilters = useCallback(() => {
    setHistoryState((prev) => ({ ...prev, showFilters: !prev.showFilters }));
  }, []);

  // HistoryScreen.tsx에서 기대하는 보조 함수들
  const loadHistoryData = useCallback((page?: number) => { void applyFilters(page ?? 1); }, [applyFilters]);
  const updateHistoryState = useCallback((patch: Partial<HistoryState>) => {
    setHistoryState((prev) => ({ ...prev, ...patch }));
  }, []);

  useEffect(() => {
    // 초기 로드
    void applyFilters();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    historyState,
    activeDropdown,
    setActiveDropdown,

    updateFilter,
    resetFilters,
    handleDateSelect,
    applyFilters,
    changePage,
    toggleFilters,

    // HistoryScreen에서 사용
    loadHistoryData,
    updateHistoryState,
  };
}
