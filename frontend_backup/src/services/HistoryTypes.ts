// src/services/HistoryTypes.ts

// ---------- Types ----------
export type Status = 'GOOD' | 'NORMAL' | 'WARNING';

/** Calendar.tsx */
export interface DayCell {
  date: Date;
  isCurrentMonth: boolean;
}
export interface CalendarProps {
  selectedDate?: Date | null;
  onDateSelect: (date: Date) => void;
  onClose: () => void;
  onCheckNow: () => void;
}

/** 공통 필터/상태 */
export interface HistoryFilters {
  date?: string | null;
  sensorType?: string | null;
  status?: Status | null;
}

export interface HistoryState {
  isLoading: boolean;
  error: string | null;
  showFilters: boolean;
  showDatePicker: boolean;         // ← 훅 초기값에 꼭 넣어주세요
  selectedDate: Date | null;
  filters: HistoryFilters;
  events: any[];
  totalPages: number;
  currentPage: number;
}

/** HistoryFilter.tsx */
export interface HistoryFilterProps {
  historyState: HistoryState;
  activeDropdown: string | null;
  setActiveDropdown: (key: string | null) => void;
  updateFilter: (key: keyof HistoryFilters, value: string | null) => void;
  resetFilters: () => void;
  handleDateSelect: (date: Date) => void;
  applyFilters: () => void;
  toggleFilters: () => void;
}

/** HistoryTable.tsx */
export interface HistoryTableProps {
  historyState: {
    isLoading: boolean;
    events: any[];
    totalPages: number;
    currentPage: number;
  };
  changePage: (page: number) => void;
}

/** HistoryScreen.tsx */
export interface HistoryScreenProps {
  onNavigateBack: () => void;
  onNavigateToChatbot: () => void;
  onNavigateToHistory: () => void;
  onNavigateToRole?: () => void;
  onNavigateToDashboard: () => void;
  activeMenu: string;
  setActiveMenu: (menu: string) => void;
}

/** 공통 알림 */
export interface NotificationItem {
  id: string;
  message: string;
  timestamp: string;
  read: boolean;
}
export interface NotificationData {
  count: number;
  notifications: NotificationItem[];
}

// ---------- Utils ----------
// (선택) 유틸 타입 정의를 쓰고 있다면 이렇게 넓혀주세요
export interface HistoryUtilsType {
  formatDate: (input?: Date | string | number | null) => string;
  formatDateToString: (date?: Date | string | number | null) => string;
  formatTimestamp: (input?: Date | string | number | null) => string;
  getSensorUnit: (sensorType?: string | null) => '°C' | '%' | 'ppm' | '';
  getStatusClass: (status?: string | null) => 'good' | 'warning' | 'normal';
}

// 공용: 안전하게 Date로 바꿔주는 헬퍼
const toDate = (input?: Date | string | number | null): Date | null => {
  if (input == null) return null;
  const d = input instanceof Date ? input : new Date(input);
  return isNaN(d.getTime()) ? null : d;
};

export const HistoryUtils: HistoryUtilsType = {
  /** 'YYYY-MM-DD' */
  formatDate(input) {
    const d = toDate(input);
    if (!d) return ''; // ← 안전 가드
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  },

  /** 날짜 라벨용 */
  formatDateToString(date) {
    return this.formatDate(date) || '-';
  },

  /** 'YYYY-MM-DD HH:mm' */
  formatTimestamp(input) {
    const d = toDate(input);
    if (!d) return '-'; // ← 안전 가드
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${y}-${m}-${day} ${hh}:${mm}`;
  },

  getSensorUnit(sensorType) {
    switch ((sensorType || '').toUpperCase()) {
      case 'TEMP':
      case 'TEMPERATURE':
        return '°C';
      case 'HUMI':
      case 'HUMIDITY':
        return '%';
      case 'GAS':
      case 'VOC':
      case 'GASCONCENTRATION':
        return 'ppm';
      default:
        return '';
    }
  },

  getStatusClass(status) {
    const s = (status || '').toUpperCase();
    if (s === 'GOOD') return 'good';
    if (s === 'WARNING') return 'warning';
    return 'normal';
  },
};

// src/services/HistoryTypes.ts 안의 HistoryAPI를 실제 백엔드 호출로 교체
const API_BASE =
  (process.env.REACT_APP_API_BASE_URL as string) ||
  'http://localhost:3001';

// ---------- API (real) ----------
export const HistoryAPI = {
  async fetchEvents(
    filters: HistoryFilters,
    page: number
  ): Promise<{ events: any[]; totalPages: number }> {
    // 1) 날짜 결정(없으면 오늘)
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const dateHyphen = (filters.date && String(filters.date)) || `${yyyy}-${mm}-${dd}`;

    // 2) 서버 요구 포맷으로 변환: YYYYMMDD  (하이픈 제거 안 하면 400 남)
    const yyyymmdd = dateHyphen.replace(/-/g, '');

    // 3) 실제 백엔드 호출  ✅ API_BASE 사용
    const res = await fetch(`${API_BASE}/s3/history/${yyyymmdd}`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      credentials: 'include',
    });


    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      throw new Error(`History API ${res.status} ${txt}`);
    }

    const json = await res.json();
    // 기대 형태: { files: Array<{ filename, data: { timestamp, mintemp, minhum, mingas, ... } }> }

    // 4) 화면에서 쓰기 쉬운 형태로 "평탄화" 매핑 (한 파일 → 여러 행: TEMP/HUMI/GAS)

    // 문자열/숫자 모두 안전하게 숫자로
    const toNum = (v: any): number | null => {
      const n = typeof v === 'number' ? v : (v != null ? Number(v) : NaN);
      return Number.isFinite(n) ? n : null;
    };

    const files = Array.isArray(json.files) ? json.files : [];
    const filterType = (filters.sensorType || '').toUpperCase(); // 'TEMP' | 'HUMI' | 'GAS' | 'TEMPERATURE' 등
    const rows: any[] = [];

    files.forEach((f: any, idx: number) => {
      const tsRaw = f?.data?.timestamp || f?.data?.Timestamp || null;
      const ts = HistoryUtils.formatTimestamp(tsRaw);
      const baseId = f?.filename || `rec-${idx}`;

      const pushRow = (
        type: 'TEMP' | 'HUMI' | 'GAS',
        rawValue: any,
        status?: string | null
      ) => {
        const value = toNum(rawValue);
        if (value == null) return; // 숫자로 못 바꾸면 스킵

        rows.push({
          // 테이블에서 어떤 키를 보든 뜨게 alias를 같이 넣어줌
          id: `${baseId}-${type}`,
          type,                              // 사용중이면 그대로
          sensorType: type,                  // ✅ Sensor Type 컬럼용
          value,                             // ✅ 숫자 값
          unit: HistoryUtils.getSensorUnit(type),
          status: (status || '').toUpperCase(),
          filename: f?.filename || '-',
          timestamp: ts,
        });
      };

      const temp = toNum(f?.data?.mintemp);
      const humi = toNum(f?.data?.minhum);
      const gas = toNum(f?.data?.mingas);

      if (!filterType || filterType === 'ALL' || filterType === 'ALL TYPES') {
        pushRow('TEMP', temp, f?.data?.mintemp_status);
        pushRow('HUMI', humi, f?.data?.minhum_status);
        pushRow('GAS', gas, f?.data?.mingas_status);
      } else if (filterType.startsWith('TEMP')) {
        pushRow('TEMP', temp, f?.data?.mintemp_status);
      } else if (filterType.startsWith('HUMI')) {
        pushRow('HUMI', humi, f?.data?.minhum_status);
      } else if (filterType.startsWith('GAS')) {
        pushRow('GAS', gas, f?.data?.mingas_status);
      }
    });

    // 5) 페이지네이션 (rows 기준)
    const pageSize = 20;
    const start = (page - 1) * pageSize;
    const events = rows.slice(start, start + pageSize);
    const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));

    return { events, totalPages };
  }
}



