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
  formatLogForDisplay,
  determineStatusBySensor,
  getStatusColor,
} from '../../services/ControlApiTypes';

import { ControlHistoryService } from './hooks/ControlApiHistory';
import { ControlLogService } from './hooks/ControlApiLog';
import { Sidebar } from '../../components/common/Sidebar';
import AdminDropdown from '../../components/common/dropdown/AdminDropdown';
// ✅ 올바른 임포트 (경로만 프로젝트 구조에 맞게)
import { MintrendService, type MintrendResponse } from '../Dashboard/hooks/MintrendService';
import AIRecommendationModal from '../../components/ai-recommendation/AIRecommendationModal';


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
  temp: { current: 24, target: 0, threshold: 28, triggerEnabled: true },
  humidity: { current: 30, target: 0, threshold: 70, triggerEnabled: true },
  co2: { current: 500, target: 0, threshold: 1000, triggerEnabled: true }
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
  const [activeMenu, setActiveMenu] = useState('Settings');
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

  // 현재 시간 상태
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleString('ko-KR'));

  // 알림 상태
  const [notifications, setNotifications] = useState<string[]>([]);
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
    const notificationMessage = `[${timestamp}] ${message}`;
    setNotifications(prev => [notificationMessage, ...prev.slice(0, 4)]); // 최대 5개 유지
  };

  const clearNotifications = (): void => {
    setNotifications([]);
  };

  // =========================
  // 로그 조회 (throttle)
  // =========================
  const fetchLogs = useCallback(async (): Promise<void> => {
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
      setDebugInfo('📡 API 호출 중.');

      const data = await ControlHistoryService.fetchControlHistoryAll(90); // 최근 90일 전부 모아서
      if (data.success) {
        const formattedLogs = data.logs.map(formatLogForDisplay);
        setLogs(formattedLogs);
        setConnectionStatus('연결됨');
        setDebugInfo(`✅ 성공: ${data.totalCount}개 로그, ${formattedLogs.length}개 포맷됨`);
      } else {
        setDebugInfo('⚠️ 성공 false 응답');
      }
    } catch (err) {
      console.error(err);
      setDebugInfo('❌ 조회 실패');
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, lastApiCall]); // setLogs, setDebugInfo 제거

  // =========================
  // 입력 변경 / 토글
  // =========================
  const handleSettingChange = (type: SensorKey, field: SettingField, value: string): void => {
    const numericValue = Number(value);
    if (isNaN(numericValue)) return;

    setSettings(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        [field]: numericValue
      }
    }));
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
        after_value: setting.target,
      };

      const result = await ControlLogService.createControlLog(logData);

      if (result.success) {
        setSettings(prev => ({
          ...prev,
          [type]: { ...prev[type], status },
        }));
        setDebugInfo('✅ 적용 완료 - 로그를 보려면 REFRESH 버튼을 클릭하세요');
        addNotification(`${type.toUpperCase()} 센서 설정이 적용되었습니다.`);
      } else {
        setDebugInfo('⚠️ 적용 실패(success=false)');
      }
    } catch (err) {
      console.error(err);
      setDebugInfo('❌ 적용 중 오류');
    } finally {
      setIsLoading(false);
    }
  };

  // =========================
  // 전체 적용
  // =========================
  const handleApplyAll = async (): Promise<void> => {
    try {
      const tempStatus = determineStatusBySensor('temp', settings.temp.current);
      const humidityStatus = determineStatusBySensor('humidity', settings.humidity.current);
      const co2Status = determineStatusBySensor('gas', settings.co2.current);

      const batchResult = await ControlLogService.createBatchControlLogs({
        temp: { current: settings.temp.current, target: settings.temp.target, threshold: settings.temp.threshold, status: tempStatus },
        humidity: { current: settings.humidity.current, target: settings.humidity.target, threshold: settings.humidity.threshold, status: humidityStatus },
        co2: { current: settings.co2.current, target: settings.co2.target, threshold: settings.co2.threshold, status: co2Status },
      });

      setDebugInfo(batchResult.success ? '✅ 전체 적용 완료 - 로그를 보려면 REFRESH 버튼을 클릭하세요' : `⚠️ 일부 실패 (${batchResult.failCount}건)`);
      addNotification(batchResult.success ? '모든 센서 설정이 적용되었습니다.' : `일부 센서 설정 적용에 실패했습니다. (${batchResult.failCount}건)`);
    } catch (err) {
      console.error(err);
      setDebugInfo('❌ 전체 적용 중 오류');
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

  const handleApplyAIRecommendation = (recommendation: {
    temperature: number;
    humidity: number;
    co2: number;
    answer: string;
  }): void => {
    setSettings(prev => ({
      temp: { ...prev.temp, target: recommendation.temperature, threshold: Math.max(recommendation.temperature + 3, 27) },
      humidity: { ...prev.humidity, target: recommendation.humidity, threshold: Math.max(recommendation.humidity + 15, 65) },
      co2: { ...prev.co2, target: recommendation.co2, threshold: Math.max(recommendation.co2 + 400, 800) }
    }));

    addNotification(`AI 추천 설정이 적용되었습니다. (온도: ${recommendation.temperature}℃, 습도: ${recommendation.humidity}%, CO₂: ${recommendation.co2}ppm)`);
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
          console.log('✅ API 설정 확인 완료');
          // 자동 로그 로딩 제거 - 사용자가 수동으로 REFRESH 버튼을 눌러야 함
        } else {
          setConnectionStatus('설정 필요');
          console.warn('⚠️ API 설정이 필요합니다');
        }
      } catch (err) {
        console.error('❌ 초기화 중 오류:', err);
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
                        onClick={clearNotifications}
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
                      notifications.map((notification, index) => (
                        <div key={index} className={styles.notificationItem}>
                          {notification}
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
                              value={setting.target || ''}
                              onChange={e => handleSettingChange(type, 'target', e.target.value)}
                              className={styles.input}
                              style={{ width: '86px', marginRight: '8px' }}
                              placeholder={
                                type === 'temp' ? '24°C' :
                                  type === 'humidity' ? '50%' :
                                    type === 'co2' ? '400ppm' : 'Target'
                              }
                            />
                            {/* <button
                              onClick={() => handleTriggerToggle(type)}
                              className={`${styles.chip} ${setting.triggerEnabled ? styles.chipOn : styles.chipOff}`}
                            >
                              {setting.triggerEnabled ? 'AUTO' : 'MANUAL'}
                            </button> */}
                            <button
                              onClick={() => handleApplySettings(type)}
                              disabled={isLoading}
                              className={`${styles.btn} ${styles.btnPrimary} ${isLoading ? styles.btnDisabled : ''}`}
                              style={{ marginLeft: '8px', padding: '6px 12px', fontSize: '12px' }}
                            >
                              {isLoading ? '⏳' : 'APPLY'}
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
                        alert('⏱️ 다른 작업이 진행 중입니다. 잠시 후 다시 시도해주세요.');
                        return;
                      }
                      fetchLogs();
                    }}
                    disabled={isLoading}
                    className={`${styles.btn} ${styles.btnSlate} ${isLoading ? styles.btnDisabled : ''}`}
                  >
                    {isLoading ? '⏳ 로딩중...' : 'REFRESH'}
                  </button>
                </div>

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
