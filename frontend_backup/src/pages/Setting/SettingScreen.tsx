// export default SettingScreen;
// export default Settings;
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Bell, User, ChevronDown } from 'lucide-react';
import styles from './SettingScreen.module.css';

import {
  SensorType,
  Status,
  ControlLogDto,
  // 화면에 쓰는 타입과 유틸들
  type FormattedLogData,
  mapSensorType,
  getSensorUnit,
  getSensorDisplayName,
  getStatusDisplayName,
  formatLogForDisplay,
  determineStatusBySensor,
  getStatusColor,
} from '../../Services/ControlApiTypes';

import { ControlHistoryService } from '../../Hooks/ControlApiHistory';
import { ControlLogService } from '../../Hooks/ControlApiLog';
import { Sidebar } from '../../components/Common/Sidebar';
import AdminDropdown from '../../components/Common/Dropdown/AdminDropdown';
// ✅ 올바른 임포트 (경로만 프로젝트 구조에 맞게)
import { MintrendService, type MintrendResponse } from '../../Hooks/MintrendService';
import AIRecommendationModal from '../../components/AiRecommendation/AIRecommendationModal';


// 원시 센서 코드 → 화면 라벨
const renderSensorType = (t?: string) => {
  if (!t) return '-';
  const map: Record<string, string> = {
    temp: 'TEMPERATURE',
    humidity: 'HUMIDITY',
    gas: 'CO₂ CONCENTRATION',
    co2: 'CO₂ CONCENTRATION',
    pm10: 'PM10',
    pm25: 'PM2.5',
    tvoc: 'TVOC',
  };
  const key = t.toLowerCase();
  return map[key] ?? key.toUpperCase();
};

// 실시간 값/상태 뽑기
const pickLive = (type: SensorKey, m: MintrendResponse['data'] | null) => {
  if (!m) return { value: undefined as number | undefined, status: undefined as string | undefined };
  switch (type) {
    case 'temp': return { value: m.mintemp, status: m.mintemp_status };
    case 'humidity': return { value: m.minhum, status: m.minhum_status };
    case 'co2': return { value: m.mingas, status: m.mingas_status };
    default: return { value: undefined, status: undefined };
  }
};

// 상태 텍스트 → 색상
const colorForStatus = (s?: string) => {
  if (!s) return '#6b7280';
  const u = s.toUpperCase();
  if (u === 'GOOD' || u === 'OK') return '#15803d'; // 초록
  if (u === 'NORMAL') return '#6b7280'; // 회색
  if (u === 'WARNING' || u === 'WARN') return '#dc2626'; // 빨강
  return '#6b7280';
};


// =========================
// 타입 정의
// =========================
interface SensorSetting {
  current: number;
  target: number;
  threshold: number;
  triggerEnabled: boolean;
}
interface SettingsState {
  temp: SensorSetting;
  humidity: SensorSetting;
  co2: SensorSetting;
}
type SensorKey = keyof SettingsState;
type SettingField = keyof SensorSetting;

// =========================
// 상수
// =========================
const API_CALL_INTERVAL = 5000; // 5초 간격으로 조회 제한 (로그 폭발 방지)
const INITIAL_SETTINGS: SettingsState = {
  temp: { current: 0, target: 0, threshold: 28, triggerEnabled: true },
  humidity: { current: 0, target: 0, threshold: 70, triggerEnabled: true },
  co2: { current: 0, target: 0, threshold: 1000, triggerEnabled: true }
};

interface SettingScreenProps {
  onNavigateToChatbot: () => void;
  onNavigateToHistory: () => void;
  onNavigateToDashboard: () => void;
  onNavigateToRole: () => void;
}

const SettingScreen: React.FC<SettingScreenProps> = ({
  onNavigateToChatbot,
  onNavigateToHistory,
  onNavigateToDashboard,
  onNavigateToRole,
}) => {
  // 사이드바 및 메뉴 상태
  const [activeMenu, setActiveMenu] = useState('Control');
  const [isAdminMenuOpen, setIsAdminMenuOpen] = useState(false);

  // 설정값 상태
  const [settings, setSettings] = useState<SettingsState>(INITIAL_SETTINGS);

  // 로그 상태
  const [logs, setLogs] = useState<FormattedLogData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [autoFeedback, setAutoFeedback] = useState<boolean>(true);
  const [connectionStatus, setConnectionStatus] = useState<string>('확인 중...');

  // API 호출 throttle을 위한 마지막 호출 시간 추적
  const [lastApiCall, setLastApiCall] = useState<number>(0);

  // 디버그 정보 표시
  const [debugInfo, setDebugInfo] = useState<string>('디버그 정보 없음');
  
  // 로그 수집 진행 상황 표시
  const [scanProgress, setScanProgress] = useState<{
    current: number;
    total: number;
    currentDate: string;
    foundLogs: number;
    isScanning: boolean;
  }>({
    current: 0,
    total: 0,
    currentDate: '',
    foundLogs: 0,
    isScanning: false
  });

  // 현재 시간 상태
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleString('ko-KR'));

  // 알림 상태
  interface NotificationItem {
    id: string;
    message: string;
    timestamp: string;
  }
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isNotificationOpen, setIsNotificationOpen] = useState<boolean>(false);

  // AI 추천 모달 상태
  const [isAIModalOpen, setIsAIModalOpen] = useState<boolean>(false);

  // ⬇️ 이 4개를 최상단에서 잘라내서, 컴포넌트 안으로 옮긴다
  const [mintrend, setMintrend] = useState<MintrendResponse['data'] | null>(null);
  const [liveErr, setLiveErr] = useState<string | null>(null);

  const loadMintrend = useCallback(async () => {
    try {
      const res = await MintrendService.getLatestMintrendData();
      setMintrend(res.data);
      setLiveErr(null);
    } catch (e: any) {
      setLiveErr(e.message ?? String(e));
    }
  }, []);

  const [visibleCount, setVisibleCount] = useState(30);   // 처음 30개 표시
  const BATCH = 30;                                       // 스크롤 한 번에 30개 더
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!loadMoreRef.current) return;
    const el = loadMoreRef.current;

    const io = new IntersectionObserver((entries) => {
      const [entry] = entries;
      if (entry.isIntersecting) {
        setVisibleCount((prev) => {
          if (prev >= logs.length) return prev;  // 모두 노출했으면 증가 안 함
          return Math.min(prev + BATCH, logs.length);
        });
      }
    }, { root: null, rootMargin: '0px', threshold: 1.0 });

    io.observe(el);
    return () => io.unobserve(el);
  }, [logs.length]);

  useEffect(() => {
    loadMintrend();                       // 최초 1회
    const id = setInterval(loadMintrend, 10000); // 10초마다
    return () => clearInterval(id);
  }, [loadMintrend]);

  // 실시간 센서 데이터로 현재값 업데이트
  useEffect(() => {
    if (mintrend) {
      setSettings(prev => ({
        temp: { 
          ...prev.temp, 
          current: Math.round(mintrend.mintemp || prev.temp.current),
          // target이 0이거나 설정되지 않았다면 현재값을 기본값으로 사용
          target: prev.temp.target || Math.round(mintrend.mintemp || 24)
        },
        humidity: { 
          ...prev.humidity, 
          current: Math.round(mintrend.minhum || prev.humidity.current),
          // target이 0이거나 설정되지 않았다면 현재값을 기본값으로 사용
          target: prev.humidity.target || Math.round(mintrend.minhum || 50)
        },
        co2: { 
          ...prev.co2, 
          current: Math.round(mintrend.mingas || prev.co2.current),
          // target이 0이거나 설정되지 않았다면 현재값을 기본값으로 사용
          target: prev.co2.target || Math.round(mintrend.mingas || 400)
        }
      }));
    }
  }, [mintrend]);

  // =========================
  // 메뉴 클릭 핸들러
  // =========================
  const handleMenuClick = (label: string, path: string) => {
    setActiveMenu(label);

    switch (label) {
      case 'Dashboard':
        onNavigateToDashboard();
        break;
      case 'Chatbot':
        onNavigateToChatbot();
        break;
      case 'History':
        onNavigateToHistory();
        break;
      case 'Control':
      case 'Settings':
        // 현재 화면 유지
        break;
      case 'Logout':
        onNavigateToRole();
        break;
      default:
        break;
    }
  };

  // =========================
  // 알림 핸들러
  // =========================
  const handleNotificationClick = (): void => {
    setIsNotificationOpen(!isNotificationOpen);
  };

  const addNotification = (message: string): void => {
    const timestamp = new Date().toLocaleTimeString('ko-KR');
    const newNotification: NotificationItem = {
      id: `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      message,
      timestamp
    };
    setNotifications(prev => [newNotification, ...prev.slice(0, 4)]); // 최대 5개 유지
  };

  const clearNotifications = (): void => {
    setNotifications([]);
  };

  const removeNotification = (id: string): void => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  // =========================
  // 로그 조회 (성능 최적화)
  // =========================
  const fetchLogs = useCallback(async (fullRefresh: boolean = false): Promise<void> => {
    const now = Date.now();

    if (now - lastApiCall < API_CALL_INTERVAL) {
      const waitMs = API_CALL_INTERVAL - (now - lastApiCall);
      const msg = `⏱️ API 호출 간격 제한 (${Math.ceil(waitMs / 100) / 10}s 후 가능)`;
      setDebugInfo(msg);
      return;
    }
    if (isLoading) {
      setDebugInfo('🔄 이미 로딩 중.');
      return;
    }

    try {
      setIsLoading(true);
      setLastApiCall(now);
      
      // REFRESH 버튼: 30일, 일반 로딩: 3일
      const totalDays = fullRefresh ? 30 : 3;
      const actionText = fullRefresh ? '전체 새로고침' : '최근 로그 조회';
      
      // 진행 상황 초기화
      setScanProgress({
        current: 0,
        total: totalDays,
        currentDate: '',
        foundLogs: 0,
        isScanning: true
      });
      
      setDebugInfo(`📡 ${actionText} 시작... (${totalDays}일)`);
      
      if (fullRefresh) {
        setLogs([]); // REFRESH 시에만 기존 로그 초기화
      }

      // 실시간 진행 상황과 함께 로그 수집
      await fetchLogsWithProgress(totalDays, !fullRefresh);
      
    } catch (err: any) {
      const errorMessage = err?.message || err?.toString() || '알 수 없는 오류';
      
      if (errorMessage.includes('CORS') || errorMessage.includes('Access-Control-Allow-Origin')) {
        setDebugInfo('🌐 CORS 오류 - 서버의 Access-Control-Allow-Origin 설정을 확인하세요');
        setConnectionStatus('CORS 오류');
      } else if (errorMessage.includes('Failed to fetch') || errorMessage.includes('ERR_FAILED')) {
        setDebugInfo('📡 네트워크 연결 오류 - 서버 상태를 확인하세요');
        setConnectionStatus('네트워크 오류');
      } else {
        setDebugInfo('❌ 로그 조회 실패 - 잠시 후 다시 시도하세요');
        setConnectionStatus('오류');
      }
    } finally {
      setIsLoading(false);
      setScanProgress(prev => ({ ...prev, isScanning: false }));
    }
  }, [isLoading, lastApiCall]);

  // 최신 변경사항만 조회 (APPLY 후 사용)
  const fetchRecentChanges = useCallback(async (): Promise<void> => {
    try {
      setDebugInfo('📡 최신 변경사항 확인 중...');
      
      // 서버 응답 대기를 위해 잠시 지연
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 최근 1일만 조회 (429 오류 방지: 30개로 증가)
      const response = await ControlHistoryService.fetchControlHistory(30, undefined, getDateStrKST(0));
      
      if (response && response.logs && response.logs.length > 0) {
        const formattedLogs = response.logs.map(formatLogForDisplay);
        const currentTime = new Date();
        
        // 최근 10분 이내 로그만 필터링 (5분 → 10분으로 확장)
        const recentLogs = formattedLogs.filter(log => {
          const logTime = new Date(log.timestamp);
          const diffMinutes = (currentTime.getTime() - logTime.getTime()) / (1000 * 60);
          return diffMinutes <= 10;
        });
        
        if (recentLogs.length > 0) {
          // 기존 로그와 병합하여 중복 제거
          setLogs(prev => {
            const existingIds = new Set(prev.map(log => log.id));
            const newLogs = recentLogs.filter(log => !existingIds.has(log.id));
            const merged = [...newLogs, ...prev];
            return merged.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 50); // 최대 50개로 제한
          });
          
          setDebugInfo(`✅ ${recentLogs.length}개 최신 로그 추가됨`);
        } else {
          setDebugInfo('ℹ️ 새로운 로그 없음');
        }
      } else {
        setDebugInfo('ℹ️ 새로운 로그 없음');
      }
    } catch (error) {
      setDebugInfo('⚠️ 최신 변경사항 조회 실패');
    }
  }, []);

  // 실시간 진행 상황을 보여주는 로그 수집 함수
  const fetchLogsWithProgress = async (days: number, isIncremental: boolean = false): Promise<void> => {
    const allLogs: any[] = isIncremental ? [...logs] : []; // 증분 조회면 기존 로그 유지
    let totalFound = isIncremental ? logs.length : 0;

    for (let i = 0; i < days; i++) {
      const dateStr = getDateStrKST(-i);
      
      // 진행 상황 업데이트
      setScanProgress(prev => ({
        ...prev,
        current: i + 1,
        currentDate: dateStr,
      }));
      
      setDebugInfo(`📅 ${dateStr} 스캔 중... (${i + 1}/${days})`);

      try {
        // 해당 날짜의 로그 조회 (429 오류 방지: 20개로 제한)
        const response = await ControlHistoryService.fetchControlHistory(20, undefined, dateStr);
        
        if (response && response.logs && response.logs.length > 0) {
          const formattedLogs = response.logs.map(formatLogForDisplay);
          
          if (isIncremental) {
            // 증분 조회: 중복 제거 후 병합
            const existingIds = new Set(allLogs.map(log => log.id));
            const newLogs = formattedLogs.filter(log => !existingIds.has(log.id));
            allLogs.push(...newLogs);
            totalFound += newLogs.length;
          } else {
            allLogs.push(...formattedLogs);
            totalFound += formattedLogs.length;
          }
          
          // 즉시 화면에 로그 표시 (실시간 업데이트)
          setLogs([...allLogs].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
          
          // 진행 상황 업데이트
          setScanProgress(prev => ({
            ...prev,
            foundLogs: totalFound,
          }));
          
          const dayCount = isIncremental ? 
            formattedLogs.filter(log => !new Set(allLogs.slice(0, -formattedLogs.length).map(l => l.id)).has(log.id)).length :
            formattedLogs.length;
          
          setDebugInfo(`📅 ${dateStr}: ${dayCount}개 발견 (총 ${totalFound}개)`);
        } else {
          setDebugInfo(`📅 ${dateStr}: 로그 없음 (총 ${totalFound}개)`);
        }
        
        // 각 요청 사이 간격 (429 오류 방지를 위해 대폭 증가)
        await new Promise(resolve => setTimeout(resolve, 2000)); // 200ms → 2000ms
        
      } catch (error: any) {
        const errorMessage = error?.message || error?.toString() || '알 수 없는 오류';
        
        // CORS 오류 특별 처리
        if (errorMessage.includes('CORS') || errorMessage.includes('Access-Control-Allow-Origin')) {
          setDebugInfo(`🌐 ${dateStr}: CORS 오류 (서버 설정 확인 필요, 총 ${totalFound}개)`);
        } else if (errorMessage.includes('Failed to fetch') || errorMessage.includes('ERR_FAILED')) {
          setDebugInfo(`📡 ${dateStr}: 네트워크 연결 오류 (총 ${totalFound}개)`);
        } else {
          setDebugInfo(`❌ ${dateStr} 스캔 실패 (총 ${totalFound}개)`);
        }
      }
    }

    // 최종 정리
    setConnectionStatus('연결됨');
    setDebugInfo(`✅ 스캔 완료: ${days}일 동안 총 ${totalFound}개 로그 발견`);
  };

  // 날짜 문자열 생성 헬퍼 함수
  const getDateStrKST = (offsetDays: number = 0): string => {
    const now = new Date();
    const utc = now.getTime() + now.getTimezoneOffset() * 60000;
    const kst = new Date(utc + 9 * 60 * 60000 + offsetDays * 86400000);
    const y = kst.getFullYear();
    const m = String(kst.getMonth() + 1).padStart(2, '0');
    const d = String(kst.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  // =========================
  // 입력 변경 / 토글
  // =========================
  // Placeholder 값을 구하는 헬퍼 함수
  const getPlaceholderValue = (type: SensorKey): number => {
    return Math.round(pickLive(type, mintrend).value || (
      type === 'temp' ? 24 :
      type === 'humidity' ? 50 :
      type === 'co2' ? 400 : 0
    ));
  };

  const handleSettingChange = (type: SensorKey, field: SettingField, value: string): void => {
    // 빈 값을 허용하여 사용자가 모든 내용을 지우고 새로 입력할 수 있도록 함
    if (value === '') {
      // 빈 값일 때는 placeholder 값을 기본값으로 사용
      const placeholderValue = getPlaceholderValue(type);
      setSettings(prev => ({
        ...prev,
        [type]: {
          ...prev[type],
          [field]: placeholderValue
        }
      }));
      return;
    }

    // 숫자와 소수점이 포함된 유효한 입력만 허용
    if (!/^-?\d*\.?\d*$/.test(value)) return;

    const numericValue = Number(value);
    // NaN이 아니고 유효한 숫자인 경우에만 업데이트
    if (!isNaN(numericValue)) {
      setSettings(prev => ({
        ...prev,
        [type]: {
          ...prev[type],
          [field]: numericValue
        }
      }));
    }
  };

  const handleTriggerToggle = (type: SensorKey): void => {
    setSettings(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        triggerEnabled: !prev[type].triggerEnabled
      }
    }));
  };

  // =========================
  // 단일 센서 적용
  // =========================
  const handleApplySettings = async (type: SensorKey): Promise<void> => {
    setIsLoading(true);
    const setting = settings[type];

    try {
      const status: Status = determineStatusBySensor(type, setting.current);

      const logData: ControlLogDto = {
        timestamp: new Date().toISOString(),
        sensor_type: mapSensorType(type as SensorType),
        before_value: setting.current,
        status,
        after_value: setting.target || setting.current, // target이 0이면 current 값 사용
      };

      const result = await ControlLogService.createControlLog(logData);

      if (result.success) {
        setSettings(prev => ({
          ...prev,
          [type]: { ...prev[type], status },
        }));
        
        // 새로 생성된 로그를 즉시 UI에 추가
        const newLogEntry = {
          id: `temp_${Date.now()}`, // 임시 ID
          timestamp: logData.timestamp || new Date().toISOString(),
          sensor_type: logData.sensor_type,
          before_value: logData.before_value,
          status: logData.status,
          after_value: logData.after_value,
          displayTime: new Date(logData.timestamp || new Date()).toLocaleString('ko-KR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
          }),
          displaySensorType: getSensorDisplayName(logData.sensor_type),
          displayUnit: getSensorUnit(logData.sensor_type),
          displayStatus: getStatusDisplayName(logData.status),
        };

        // 즉시 로그 목록에 추가
        setLogs(prev => {
          const updated = [newLogEntry, ...prev];
          return updated.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 50);
        });
        
        // 백그라운드에서 실제 로그 데이터로 업데이트
        setTimeout(async () => {
          await fetchRecentChanges();
        }, 2000);
        
        addNotification(`${type.toUpperCase()} 센서 설정이 적용되었습니다.`);
      } else {
        setDebugInfo('⚠️ 적용 실패(success=false)');
      }
    } catch (err) {
      setDebugInfo('❌ 적용 중 오류');
    } finally {
      setIsLoading(false);
    }
  };

  // =========================
  // 전체 적용
  // =========================
  const handleApplyAll = async (): Promise<void> => {
    setIsLoading(true);
    
    try {
      const tempStatus = determineStatusBySensor('temp', settings.temp.current);
      const humidityStatus = determineStatusBySensor('humidity', settings.humidity.current);
      const co2Status = determineStatusBySensor('gas', settings.co2.current);

      const batchResult = await ControlLogService.createBatchControlLogs({
        temp: { current: settings.temp.current, target: settings.temp.target, threshold: settings.temp.threshold, status: tempStatus },
        humidity: { current: settings.humidity.current, target: settings.humidity.target, threshold: settings.humidity.threshold, status: humidityStatus },
        co2: { current: settings.co2.current, target: settings.co2.target, threshold: settings.co2.threshold, status: co2Status },
      });

      if (batchResult.success) {
        // 새로 생성된 배치 로그들을 즉시 UI에 추가
        const timestamp = new Date().toISOString();
        const newLogEntries = [
          {
            id: `temp_batch_${Date.now()}_1`,
            timestamp,
            sensor_type: 'temp',
            before_value: settings.temp.current,
            status: tempStatus,
            after_value: settings.temp.target || settings.temp.current,
            displayTime: new Date(timestamp).toLocaleString('ko-KR', {
              year: 'numeric', month: '2-digit', day: '2-digit',
              hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
            }),
            displaySensorType: getSensorDisplayName('temp'),
            displayUnit: getSensorUnit('temp'),
            displayStatus: getStatusDisplayName(tempStatus),
          },
          {
            id: `temp_batch_${Date.now()}_2`,
            timestamp,
            sensor_type: 'humidity',
            before_value: settings.humidity.current,
            status: humidityStatus,
            after_value: settings.humidity.target || settings.humidity.current,
            displayTime: new Date(timestamp).toLocaleString('ko-KR', {
              year: 'numeric', month: '2-digit', day: '2-digit',
              hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
            }),
            displaySensorType: getSensorDisplayName('humidity'),
            displayUnit: getSensorUnit('humidity'),
            displayStatus: getStatusDisplayName(humidityStatus),
          },
          {
            id: `temp_batch_${Date.now()}_3`,
            timestamp,
            sensor_type: 'gas',
            before_value: settings.co2.current,
            status: co2Status,
            after_value: settings.co2.target || settings.co2.current,
            displayTime: new Date(timestamp).toLocaleString('ko-KR', {
              year: 'numeric', month: '2-digit', day: '2-digit',
              hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
            }),
            displaySensorType: getSensorDisplayName('gas'),
            displayUnit: getSensorUnit('gas'),
            displayStatus: getStatusDisplayName(co2Status),
          }
        ];

        // 즉시 로그 목록에 추가
        setLogs(prev => {
          const updated = [...newLogEntries, ...prev];
          return updated.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 50);
        });

        // 백그라운드에서 실제 로그 데이터로 업데이트
        setTimeout(async () => {
          await fetchRecentChanges();
        }, 2000);

        addNotification('모든 센서 설정이 적용되었습니다.');
      } else {
        setDebugInfo(`⚠️ 일부 실패 (${batchResult.failCount}건)`);
        addNotification(`일부 센서 설정 적용에 실패했습니다. (${batchResult.failCount}건)`);
      }
    } catch (err) {
      setDebugInfo('❌ 전체 적용 중 오류');
    } finally {
      setIsLoading(false);
    }
  };

  // =========================
  // AI 추천 핸들러
  // =========================
  const handleOpenAIModal = (): void => {
    setIsAIModalOpen(true);
  };

  const handleCloseAIModal = (): void => {
    setIsAIModalOpen(false);
  };

  const handleApplyAIRecommendation = async (recommendation: {
    temperature: number;
    humidity: number;
    co2: number;
    answer: string;
  }): Promise<void> => {
    // 먼저 설정값 업데이트
    setSettings(prev => ({
      temp: { ...prev.temp, target: recommendation.temperature, threshold: Math.max(recommendation.temperature + 3, 27) },
      humidity: { ...prev.humidity, target: recommendation.humidity, threshold: Math.max(recommendation.humidity + 15, 65) },
      co2: { ...prev.co2, target: recommendation.co2, threshold: Math.max(recommendation.co2 + 400, 800) }
    }));

    // AI 추천값으로 즉시 APPLY ALL 실행
    setIsLoading(true);
    
    try {
      const tempStatus = determineStatusBySensor('temp', recommendation.temperature);
      const humidityStatus = determineStatusBySensor('humidity', recommendation.humidity);  
      const co2Status = determineStatusBySensor('gas', recommendation.co2);

      const batchResult = await ControlLogService.createBatchControlLogs({
        temp: { current: recommendation.temperature, target: recommendation.temperature, threshold: Math.max(recommendation.temperature + 3, 27), status: tempStatus },
        humidity: { current: recommendation.humidity, target: recommendation.humidity, threshold: Math.max(recommendation.humidity + 15, 65), status: humidityStatus },
        co2: { current: recommendation.co2, target: recommendation.co2, threshold: Math.max(recommendation.co2 + 400, 800), status: co2Status },
      });

      if (batchResult.success) {
        // AI 추천으로 생성된 배치 로그들을 즉시 UI에 추가
        const timestamp = new Date().toISOString();
        const aiLogEntries = [
          {
            id: `ai_batch_${Date.now()}_1`,
            timestamp,
            sensor_type: 'temp',
            before_value: recommendation.temperature,
            status: tempStatus,
            after_value: recommendation.temperature,
            displayTime: new Date(timestamp).toLocaleString('ko-KR', {
              year: 'numeric', month: '2-digit', day: '2-digit',
              hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
            }),
            displaySensorType: getSensorDisplayName('temp'),
            displayUnit: getSensorUnit('temp'),
            displayStatus: getStatusDisplayName(tempStatus),
          },
          {
            id: `ai_batch_${Date.now()}_2`,
            timestamp,
            sensor_type: 'humidity',
            before_value: recommendation.humidity,
            status: humidityStatus,
            after_value: recommendation.humidity,
            displayTime: new Date(timestamp).toLocaleString('ko-KR', {
              year: 'numeric', month: '2-digit', day: '2-digit',
              hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
            }),
            displaySensorType: getSensorDisplayName('humidity'),
            displayUnit: getSensorUnit('humidity'),
            displayStatus: getStatusDisplayName(humidityStatus),
          },
          {
            id: `ai_batch_${Date.now()}_3`,
            timestamp,
            sensor_type: 'gas',
            before_value: recommendation.co2,
            status: co2Status,
            after_value: recommendation.co2,
            displayTime: new Date(timestamp).toLocaleString('ko-KR', {
              year: 'numeric', month: '2-digit', day: '2-digit',
              hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
            }),
            displaySensorType: getSensorDisplayName('gas'),
            displayUnit: getSensorUnit('gas'),
            displayStatus: getStatusDisplayName(co2Status),
          }
        ];

        // 즉시 로그 목록에 추가
        setLogs(prev => {
          const updated = [...aiLogEntries, ...prev];
          return updated.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 50);
        });

        // 백그라운드에서 실제 로그 데이터로 업데이트
        setTimeout(async () => {
          await fetchRecentChanges();
        }, 2000);

        addNotification(`AI 추천 설정이 적용되었습니다. (온도: ${recommendation.temperature}℃, 습도: ${recommendation.humidity}%, CO₂: ${recommendation.co2}ppm)`);
      } else {
        setDebugInfo(`⚠️ AI 추천 적용 중 일부 실패 (${batchResult.failCount}건)`);
        addNotification(`AI 추천 설정 적용 중 일부 실패했습니다. (${batchResult.failCount}건)`);
      }
    } catch (err) {
      setDebugInfo('❌ AI 추천 적용 중 오류');
      addNotification('AI 추천 설정 적용 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // =========================
  // 초기화
  // =========================
  useEffect(() => {
    const initializeData = async () => {
      try {
        const data = await ControlHistoryService.fetchControlHistory(1);
        const isConfigured = !!data && data.success !== undefined;
        if (isConfigured) {
          setConnectionStatus('설정됨');
          
          // 페이지 진입 시 최근 3일 로그 자동 로딩
          setDebugInfo('📡 최근 3일 로그 자동 로딩 중...');
          await fetchLogs(false); // 3일 조회
        } else {
          setConnectionStatus('설정 필요');
        }
      } catch (err) {
        setConnectionStatus('오류');
      }
    };

    initializeData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 실시간 시간 업데이트
  useEffect(() => {
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date().toLocaleString('ko-KR'));
    }, 30000); // 30초마다 업데이트

    return () => clearInterval(timeInterval);
  }, []);

  // 알림 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isNotificationOpen && !(event.target as Element).closest('.headerItem')) {
        setIsNotificationOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isNotificationOpen]);

  // =========================
  // 렌더
  // =========================
  return (
    <div className={styles.dashboardContainer}>
      {/* 사이드바 */}
      <Sidebar
        activeMenu={activeMenu}
        onMenuClick={handleMenuClick}
      />

      {/* 메인 컨텐츠 영역 */}
      <main className={styles.mainContent}>
        {/* 상단 헤더 */}
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <h1 className={styles.pageTitle}>{activeMenu}</h1>
            <p className={styles.pageSubtitle}>{currentTime}</p>
          </div>

          <div className={styles.headerRight}>
            {/* 알림 */}
            <div className={styles.headerItem}>
              <button
                className={styles.notificationButton}
                aria-label="알림"
                onClick={handleNotificationClick}
              >
                <Bell size={20} />
                {notifications.length > 0 && (
                  <span className={styles.notificationBadge}>
                    {notifications.length}
                  </span>
                )}
              </button>

              {isNotificationOpen && (
                <div className={styles.notificationDropdown}>
                  <div className={styles.notificationHeader}>
                    <span>알림</span>
                    {notifications.length > 0 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          clearNotifications();
                        }}
                        className={styles.clearButton}
                      >
                        모두 삭제
                      </button>
                    )}
                  </div>
                  <div className={styles.notificationList}>
                    {notifications.length === 0 ? (
                      <div className={styles.noNotifications}>
                        새 알림이 없습니다.
                      </div>
                    ) : (
                      notifications.map((notification) => (
                        <div key={notification.id} className={styles.notificationItem}>
                          <div className={styles.notificationContent}>
                            <div className={styles.notificationMessage}>
                              {notification.message}
                            </div>
                            <div className={styles.notificationTime}>
                              {notification.timestamp}
                            </div>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              removeNotification(notification.id);
                            }}
                            className={styles.deleteButton}
                            aria-label="알림 삭제"
                          >
                            ×
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* 관리자 메뉴 */}
            <div className={styles.headerItem}>
              <button
                onClick={() => setIsAdminMenuOpen(!isAdminMenuOpen)}
                className={styles.adminButton}
                aria-label="관리자 메뉴"
              >
                <User size={20} />
                <span>관리자</span>
                <ChevronDown size={16} />
              </button>

              <AdminDropdown
                isOpen={isAdminMenuOpen}
                onClose={() => setIsAdminMenuOpen(false)}
              />
            </div>
          </div>
        </header>

        {/* 설정 화면 컨텐츠 */}
        <div className={styles.dashboardContent}>
          <div className={styles.settingContainer}>
            {/* 기존 설정 헤더 정보 */}
            <div className={styles.settingHeader}>
            </div>

            {/* 기존 설정 본문 */}
            <div className={styles.main}>
              {/* 메인 설정 영역 */}
              <div className={styles.card}>
                <div className={styles.grid}>
                  {/* 첫 번째 컬럼: SENSOR DATA */}
                  <div>
                    <h3 className={`${styles.sectionTitle} ${styles.borderBlue}`}>SENSOR DATA</h3>
                    {(Object.keys(settings) as SensorKey[]).map(type => {
                      const setting = settings[type];
                      const live = pickLive(type, mintrend);
                      const value = (live.value ?? setting.current);
                      const statusTxt = live.status;

                      return (
                        <div key={type} className={styles.currentItem}>
                          <div className={styles.currentLeft}>
                            <span className={styles.currentName}>{renderSensorType(type)}</span>
                          </div>
                          <div className={styles.currentRight}>
                            <span className={styles.currentValue}>
                              {value}
                              {type === 'temp' && '°C'}
                              {type === 'humidity' && '%'}
                              {type === 'co2' && 'ppm'}
                            </span>

                            <span
                              className={styles.badge}
                              style={{ backgroundColor: colorForStatus(statusTxt), marginLeft: 8 }}
                              aria-label="sensor-status"
                              title={(statusTxt ?? 'N/A').toUpperCase()}
                            >
                              {(statusTxt ?? 'N/A').toUpperCase()}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* 두 번째 컬럼: CONTROLS - 가로 배치로 수정 */}
                  <div>
                    <h3 className={`${styles.sectionTitle} ${styles.borderGreen}`}>CONTROLS</h3>
                    {(Object.keys(settings) as SensorKey[]).map(type => {
                      const setting = settings[type];

                      return (
                        <div key={type} className={styles.currentItem}>
                          <div className={styles.currentLeft}>
                            <span className={styles.currentName}>{renderSensorType(type)}</span>
                          </div>
                          <div className={styles.currentRight}>
                            <input
                              type="number"
                              value={setting.target || getPlaceholderValue(type)}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleSettingChange(type, 'target', e.target.value)}
                              onInput={(e: React.FormEvent<HTMLInputElement>) => handleSettingChange(type, 'target', (e.target as HTMLInputElement).value)}
                              onFocus={(e: React.FocusEvent<HTMLInputElement>) => {
                                // 포커스 시 값이 placeholder 값과 같다면 빈 값으로 만들어서 사용자가 입력하기 쉽게 함
                                if (Number(e.target.value) === getPlaceholderValue(type)) {
                                  e.target.select(); // 전체 선택하여 덮어쓰기 쉽게 함
                                }
                              }}
                              className={styles.input}
                              step="0.1"
                              min={
                                type === 'temp' ? "0" : 
                                type === 'humidity' ? "0" : 
                                type === 'co2' ? "0" : "0"
                              }
                              max={
                                type === 'temp' ? "50" : 
                                type === 'humidity' ? "100" : 
                                type === 'co2' ? "5000" : "1000"
                              }
                              inputMode="decimal"
                              pattern="[0-9]*\.?[0-9]*"
                              placeholder={
                                type === 'temp' ? `${getPlaceholderValue(type)}°C` :
                                  type === 'humidity' ? `${getPlaceholderValue(type)}%` :
                                    type === 'co2' ? `${getPlaceholderValue(type)}ppm` : 'Target'
                              }
                            />
                            <button
                              onClick={() => handleApplySettings(type)}
                              disabled={isLoading}
                              className={`${styles.btn} ${styles.btnPrimary} ${isLoading ? styles.btnDisabled : ''}`}
                            >
                              {isLoading ? 'LOADING' : 'APPLY'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 자동 Feedback 및 전체 제어 */}
                {/* <div className={styles.footerRow}>
                  <div className={styles.checkboxRow}>
                    <input
                      type="checkbox"
                      id="autoFeedback"
                      checked={autoFeedback}
                      onChange={e => setAutoFeedback(e.target.checked)}
                      className={styles.checkbox}
                    />
                    <label htmlFor="autoFeedback" className={styles.checkboxLabel}>
                      AUTO Feedback
                    </label>
                  </div> */}

                <div className={styles.footerActions}>
                  <button
                    onClick={handleOpenAIModal}
                    className={`${styles.btn} ${styles.btnViolet}`}
                  >
                    AI RECOMMENDATION
                  </button>

                  <button
                    onClick={handleApplyAll}
                    disabled={isLoading}
                    className={`${styles.btn} ${styles.btnPrimary} ${isLoading ? styles.btnDisabled : ''}`}
                  >
                    {isLoading ? 'APPLY ALL' : 'APPLY ALL'}
                  </button>
                </div>

              </div>

              {/* 로그 영역 */}
              <div className={styles.cardLogs}>
                <div className={styles.logsHeader}>
                  <h3 className={styles.logsTitle}>CONTROL LOG</h3>
                  <button
                    onClick={() => {
                      if (isLoading) {
                        alert('다른 작업이 진행 중입니다. 잠시 후 다시 시도해주세요.');
                        return;
                      }
                      fetchLogs(true); // 전체 새로고침 (30일)
                    }}
                    disabled={isLoading}
                    className={`${styles.btn} ${styles.btnSlate} ${isLoading ? styles.btnDisabled : ''}`}
                  >
                    {isLoading ? 'REFRESHING' : 'REFRESH (30일)'}
                  </button>
                </div>

                {/* 스캔 진행 상황 표시 */}
                {scanProgress.isScanning && (
                  <div className={styles.scanProgress}>
                    <div className={styles.progressHeader}>
                      <span className={styles.progressTitle}>로그 스캔 진행 중</span>
                      <span className={styles.progressStats}>
                        {scanProgress.current}/{scanProgress.total} 일자 완료 
                        ({scanProgress.foundLogs}개 로그 발견)
                      </span>
                    </div>
                    
                    <div className={styles.progressBar}>
                      <div 
                        className={styles.progressFill}
                        style={{ 
                          width: `${(scanProgress.current / scanProgress.total) * 100}%`,
                          transition: 'none'
                        }}
                      />
                    </div>
                    
                    <div className={styles.progressDetails}>
                      <span className={styles.currentDate}>
                        현재: {scanProgress.currentDate}
                      </span>
                      <span className={styles.progressPercent}>
                        {Math.round((scanProgress.current / scanProgress.total) * 100)}%
                      </span>
                    </div>
                  </div>
                )}

                {/* 스캔 완료 상태 표시 */}
                {!scanProgress.isScanning && scanProgress.foundLogs > 0 && (
                  <div className={styles.scanComplete}>
                    <span className={styles.completeText}>
                      스캔 완료: {scanProgress.total}일 동안 총 {scanProgress.foundLogs}개 로그 발견
                    </span>
                  </div>
                )}

                <div className={styles.tableWrap}>
                  <div ref={loadMoreRef} style={{ height: 1 }} />
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>TIMESTAMP</th>
                        <th>SENSOR TYPE</th>
                        <th>BEFORE</th>
                        <th>STATUS</th>
                        <th>AFTER</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs.slice(0, visibleCount).map((log, index) => (
                        <tr key={log.id} className={index < logs.length - 1 ? styles.rowBorder : ''}>
                          <td>{log.displayTime}</td>
                          <td>{renderSensorType(log.sensor_type)}</td>
                          <td>
                            <div className={styles.inlineRow}>
                              <span className={styles.valueBlue}>
                                {log.before_value}{log.displayUnit}
                              </span>
                            </div>
                          </td>
                          <td>
                            <span
                              className={styles.badge}
                              style={{ backgroundColor: getStatusColor(log.status) }}
                            >
                              {log.status?.toUpperCase()}
                            </span>
                          </td>
                          <td>
                            <div className={styles.inlineRow}>
                              <span className={styles.valueBlue}>
                                {log.after_value}{log.displayUnit}
                              </span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {logs.length === 0 && (
                    <div className={styles.empty}>로그가 없습니다.</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* AI 추천 모달 */}
      <AIRecommendationModal
        isOpen={isAIModalOpen}
        onClose={handleCloseAIModal}
        onApplyRecommendation={handleApplyAIRecommendation}
      />
    </div>
  );
};

export default SettingScreen;
