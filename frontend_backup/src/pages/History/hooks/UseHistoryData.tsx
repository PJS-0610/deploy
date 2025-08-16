// src/pages/History/hooks/UseHistoryData.tsx
import { useState, useCallback, useEffect } from 'react';
import { HistoryAPI, HistoryUtils, HistoryState, HistoryFilters } from '../../../services/HistoryTypes';

const initialState: HistoryState = {
  isLoading: false,
  error: null,
  showFilters: false,
  showDatePicker: false,
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
      // ✅ 수정: formatDate 대신 formatDateToString 사용
      filters: { ...prev.filters, date: HistoryUtils.formatDateToString(date) },
    }));
  }, []);

  const applyFilters = useCallback(async (page: number = 1) => {
    setHistoryState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      // ✅ 수정: fetchEvents 메서드 사용
      const { events, totalPages } = await HistoryAPI.fetchEvents(historyState.filters, page);
      setHistoryState((prev) => ({
        ...prev,
        events,
        totalPages,
        currentPage: page,
        isLoading: false,
      }));
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : '데이터 로드 실패';
      setHistoryState((prev) => ({ 
        ...prev, 
        isLoading: false, 
        error: errorMessage,
        events: [],
        totalPages: 1
      }));
    }
  }, [historyState.filters]);

  const changePage = useCallback(async (page: number) => {
    setHistoryState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      // ✅ 수정: fetchEvents 메서드 사용
      const { events } = await HistoryAPI.fetchEvents(historyState.filters, page);
      setHistoryState((prev) => ({
        ...prev,
        events,
        currentPage: page,
        isLoading: false,
      }));
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : '페이지 로드 실패';
      setHistoryState((prev) => ({ 
        ...prev, 
        isLoading: false, 
        error: errorMessage 
      }));
    }
  }, [historyState.filters]);

  const toggleFilters = useCallback(() => {
    setHistoryState((prev) => ({ ...prev, showFilters: !prev.showFilters }));
  }, []);

  // HistoryScreen.tsx에서 기대하는 보조 함수들
  const loadHistoryData = useCallback((page?: number) => { 
    void applyFilters(page ?? 1); 
  }, [applyFilters]);
  
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