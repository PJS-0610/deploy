// Dashboard.tsx - 메인 대시보드 컴포넌트 (QuickSight 추가)
import React, { useState, useEffect } from 'react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Bell, User, ChevronDown, Info, ExternalLink, BarChart3 } from 'lucide-react';
import {
  NotificationData,
  SensorData,
  SensorType,
  SidebarItemProps,
  DashboardAPI,
  DashboardUtils,
  SENSOR_OPTIONS,
  MENU_ITEMS
} from '../../services/DashboardTypes';
import {
  MintrendService,
  MintrendResponse,
  MintrendData
} from '../../services/MintrendTypes';
// 🆕 QuickSight 관련 import 추가
import {
  QuickSightService,
  QuickSightDashboardResponse,
  QuickSightSensorType,
  QUICKSIGHT_SENSOR_OPTIONS
} from './hooks/QuickSightTypes';
import styles from "./DashboardScreen.module.css";
import { Sidebar } from '../../components/common/Sidebar';
import NotificationDropdown from '../../components/common/dropdown/NotificationDropdown';
import AdminDropdown from '../../components/common/dropdown/AdminDropdown';
import AnomalyAlert from './hooks/AnomalyAlert';

interface DashboardScreenProps {
  onNavigateToChatbot: () => void;
  onNavigateToHistory: () => void;
  onNavigateToRole?: () => void;
}


// 센서 차트 컴포넌트
const SensorChart: React.FC<{
  sensorData: SensorData | null;
  isLoading: boolean;
  error: string | null;
}> = ({ sensorData, isLoading, error }) => {
  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div>데이터를 불러오는 중...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <div className={styles.errorTitle}>데이터 로딩 실패</div>
        <div className={styles.errorMessage}>{error}</div>
      </div>
    );
  }

  if (!sensorData || !sensorData.success) {
    return (
      <div className={styles.errorContainer}>
        <div className={styles.errorTitle}>데이터를 사용할 수 없습니다</div>
      </div>
    );
  }

  const chartData = sensorData.labels.map((label, index) => ({
    time: label,
    value: sensorData.values[index]
  }));

  const color = DashboardUtils.getChartColor(sensorData.sensorType);

  return (
    <div className={styles.chartContainer}>
      <ResponsiveContainer width="100%" height="100%">
        {sensorData.sensorType === 'gas' ? (
          <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="time"
              stroke="#666"
              fontSize={12}
            />
            <YAxis
              stroke="#666"
              fontSize={12}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '6px'
              }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke={color}
              fill={color}
              fillOpacity={0.3}
              strokeWidth={2}
            />
          </AreaChart>
        ) : (
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="time"
              stroke="#666"
              fontSize={12}
            />
            <YAxis
              stroke="#666"
              fontSize={12}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '6px'
              }}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2}
              dot={{ fill: color, strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: color, strokeWidth: 2 }}
            />
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  );
};

// 🆕 QuickSight 대시보드 컴포넌트
const QuickSightDashboard: React.FC<{
  dashboardData: QuickSightDashboardResponse | null;
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
}> = ({ dashboardData, isLoading, error, onRetry }) => {
  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div>QuickSight 대시보드를 불러오는 중...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <div className={styles.errorTitle}>QuickSight 대시보드 로딩 실패</div>
        <div className={styles.errorMessage}>{error}</div>
        <button onClick={onRetry} className={styles.retryButton}>
          다시 시도
        </button>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className={styles.noDataState}>
        <p>QuickSight 대시보드 데이터가 없습니다.</p>
      </div>
    );
  }

  return (
    <div className={styles.quicksightContainer}>
      <div className={styles.quicksightHeader}>
        <h3 className={styles.quicksightTitle}>
        </h3>
      </div>

      {dashboardData.embedUrl ? (
        <div className={styles.quicksightIframe}>
          {dashboardData?.embedUrl && /\/embed\//.test(dashboardData.embedUrl) ? (
            <iframe
              src={dashboardData.embedUrl}
              width="100%"
              height="600"
              frameBorder="0"
              title={`QuickSight Dashboard - ${dashboardData.dashboard?.name ?? 'QuickSight'}`}
              allow="fullscreen"
            />
          ) : (
            <div style={{ padding: 12, border: '1px solid #eee', borderRadius: 8 }}>
              <strong>임베드 URL이 아니라서 표시할 수 없어요.</strong>
              <div style={{ fontSize: 12, opacity: 0.7, marginTop: 6 }}>
                백엔드가 <code>/embed/</code> 경로의 URL을 반환해야 iframe으로 표시 가능합니다.
              </div>
              {dashboardData?.embedUrl && (
                <div style={{ marginTop: 6, wordBreak: 'break-all', fontSize: 12, opacity: 0.7 }}>
                  현재 URL: <code>{dashboardData.embedUrl}</code>
                </div>
              )}
            </div>
          )}

        </div>
      ) : (
        <div className={styles.quicksightPlaceholder}>
          <BarChart3 size={48} />
          <h4>QuickSight 대시보드</h4>
          <p>임베드 URL을 생성하는 중입니다...</p>
        </div>
      )}
    </div>
  );
};

// 메인 대시보드 컴포넌트
const DashboardScreen: React.FC<DashboardScreenProps> = ({
  onNavigateToChatbot,
  onNavigateToHistory,
  onNavigateToRole,
}) => {
  const [activeMenu, setActiveMenu] = useState('Dashboard');
  const [notificationData, setNotificationData] = useState<NotificationData>({
    count: 0,
    notifications: []
  });
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isAdminMenuOpen, setIsAdminMenuOpen] = useState(false);
  const [selectedSensor, setSelectedSensor] = useState<SensorType>('temperature');
  const [sensorData, setSensorData] = useState<SensorData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [allSensorData, setAllSensorData] = useState<Record<SensorType, SensorData | null>>({
    temperature: null,
    humidity: null,
    gas: null,
  });

  // Mintrend 데이터 관련 state
  const [mintrendData, setMintrendData] = useState<MintrendResponse | null>(null);
  const [mintrendLoading, setMintrendLoading] = useState(false);
  const [mintrendError, setMintrendError] = useState<string | null>(null);

  // 🆕 QuickSight 관련 state 추가
  const [selectedQuickSightSensor, setSelectedQuickSightSensor] = useState<QuickSightSensorType>('TEMPERATURE');
  const [quickSightData, setQuickSightData] = useState<QuickSightDashboardResponse | null>(null);
  const [quickSightLoading, setQuickSightLoading] = useState(false);
  const [quickSightError, setQuickSightError] = useState<string | null>(null);

  // 센서 데이터 가져오기
  const fetchSensorData = async (sensorType: SensorType) => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await DashboardAPI.getSensorData(sensorType);

      if (data.success) {
        setSensorData(data as SensorData);
        setAllSensorData(prev => ({
          ...prev,
          [sensorType]: data as SensorData
        }));
      } else {
        setError('데이터를 불러올 수 없습니다.');
      }
    } catch (err) {
      setError('데이터를 가져오는 중 오류가 발생했습니다.');
      console.error('센서 데이터 가져오기 실패:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Mintrend 데이터 가져오기
  const fetchMintrendData = async () => {
    setMintrendLoading(true);
    setMintrendError(null);

    try {
      const data = await MintrendService.getLatestMintrendData();
      setMintrendData(data);
      console.log('✅ Mintrend 데이터 로드 성공:', data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Mintrend 데이터를 가져오는 중 오류가 발생했습니다.';
      setMintrendError(errorMessage);
      console.error('❌ Mintrend 데이터 로드 실패:', err);
    } finally {
      setMintrendLoading(false);
    }
  };

  // 🆕 QuickSight 데이터 가져오기
  const fetchQuickSightData = async (sensorType: QuickSightSensorType) => {
    setQuickSightLoading(true);
    setQuickSightError(null);

    try {
      const data = await QuickSightService.getDashboardByType(sensorType);
      setQuickSightData(data);
      console.log('✅ QuickSight 대시보드 로드 성공:', data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'QuickSight 대시보드를 가져오는 중 오류가 발생했습니다.';
      setQuickSightError(errorMessage);
      console.error('❌ QuickSight 대시보드 로드 실패:', err);
    } finally {
      setQuickSightLoading(false);
    }
  };

  // 전체 함수
  const fetchAllSensorData = async () => {
    try {
      const results = await Promise.all(
        SENSOR_OPTIONS.map(opt => DashboardAPI.getSensorData(opt.value as SensorType))
      );

      const newAllSensorData: Record<SensorType, SensorData | null> = {
        temperature: null,
        humidity: null,
        gas: null,
      };

      results.forEach((result, index) => {
        if (result.success) {
          const sensorType = SENSOR_OPTIONS[index].value as SensorType;
          newAllSensorData[sensorType] = result as SensorData;
        }
      });

      setAllSensorData(newAllSensorData);
    } catch (err) {
      console.error('전체 센서 데이터 가져오기 실패:', err);
    }
  };

  // 알림 데이터 가져오기
  const fetchNotifications = async () => {
    try {
      const data = await DashboardAPI.getNotifications();
      setNotificationData(data);
    } catch (error) {
      console.error('알림 데이터 가져오기 실패:', error);
    }
  };

  // 메뉴 클릭 핸들러
  const handleMenuClick = (label: string, path: string) => {
    setActiveMenu(label);

    switch (label) {
      case 'Chatbot':
        onNavigateToChatbot();
        break;
      case 'History':
        onNavigateToHistory();
        break;
      case 'Dashboard':
        // 대시보드면 현재 화면 유지
        break;
      case 'Logout':
        onNavigateToRole?.();  // 역할 선택 화면으로
        break;
      default:
        break;
    }
  };

  // 센서 선택 핸들러
  const handleSensorSelect = (sensorType: SensorType) => {
    setSelectedSensor(sensorType);
    fetchSensorData(sensorType);
  };

  // 🆕 QuickSight 센서 선택 핸들러
  const handleQuickSightSensorSelect = (sensorType: QuickSightSensorType) => {
    setSelectedQuickSightSensor(sensorType);
    fetchQuickSightData(sensorType);
  };

  // 컴포넌트 마운트 시 초기 데이터 로딩
  useEffect(() => {
    fetchNotifications();
    fetchSensorData('temperature'); // 기본값
    fetchAllSensorData(); // 테이블용 전체 데이터
    fetchMintrendData(); // Mintrend 데이터 가져오기
    fetchQuickSightData('TEMPERATURE'); // 🆕 QuickSight 데이터 가져오기

    // 주기적으로 데이터 업데이트 (30초마다)
    const interval = setInterval(() => {
      // fetchNotifications();
      // fetchSensorData(selectedSensor);
      // fetchAllSensorData();
      fetchMintrendData(); // Mintrend 데이터도 주기적으로 업데이트
      // QuickSight는 주기적으로 업데이트 안함 (임베드 URL 캐싱 때문)
    }, 30000);

    return () => clearInterval(interval);
  }, [selectedSensor]);

  // 선택된 센서 변경 시 데이터 다시 가져오기
  useEffect(() => {
    if (allSensorData[selectedSensor]) {
      setSensorData(allSensorData[selectedSensor]);
    }
  }, [selectedSensor, allSensorData]);

  // 실시간 시간 업데이트를 위한 useEffect 추가
  const [currentTime, setCurrentTime] = useState(DashboardUtils.getCurrentDateTime());

  useEffect(() => {
    const timeInterval = setInterval(() => {
      setCurrentTime(DashboardUtils.getCurrentDateTime());
    }, 30000); // 30초마다 업데이트

    return () => clearInterval(timeInterval);
  }, []);

  return (
    <div className={styles.dashboardContainer}>
      {/* 사이드바 */}
      {/* <nav className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <h2 className={styles.sidebarTitle}>AWS IOT</h2>
        </div>

        <div className={styles.sidebarMenu}>
          {MENU_ITEMS.map((item) => (
            <button
              key={item.label}
              className={`${styles.sidebarItem} ${activeMenu === item.label ? styles.active : ''}`}
              onClick={() => handleMenuClick(item.label, item.path)}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </nav> */}
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
            {/* 알림 아이콘 */}
            <div className={styles.headerItem}>
              <button
                onClick={() => {
                  setIsNotificationOpen(!isNotificationOpen);
                  setIsAdminMenuOpen(false);
                }}
                className={styles.headerButton}
                aria-label="알림"
              >
                <Bell size={20} />
                {notificationData.count > 0 && (
                  <span className={styles.notificationBadge}>
                    {notificationData.count > 99 ? '99+' : notificationData.count}
                  </span>
                )}
              </button>

              <NotificationDropdown
                isOpen={isNotificationOpen}
                onClose={() => setIsNotificationOpen(false)}
                notifications={notificationData.notifications}
              />
            </div>

            {/* 관리자 메뉴 */}
            <div className={styles.headerItem}>
              <button
                onClick={() => {
                  setIsAdminMenuOpen(!isAdminMenuOpen);
                  setIsNotificationOpen(false);
                }}
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

        {/* 메인 대시보드 컨텐츠 */}
        <div className={styles.dashboardContent}>
          {activeMenu === 'Dashboard' ? (
            <>
              {/* 시간평균 데이터 차트 섹션 */}


              {/* 현재 & 예측 데이터 테이블 섹션 */}
              <section className={styles.summarySection}>
                <div className={styles.sectionHeader}>
                  <h2 className={styles.sectionTitle}>CURRENT DATA</h2>
                  <div className={styles.infoIcon}>
                    <Info size={16} />
                  </div>
                </div>

                <div className={styles.summaryCard}>
                  <table className={styles.summaryTable}>
                    <thead>
                      <tr>
                        <th>TIME</th>
                        <th>TEMPERATURE</th>
                        <th>HUMIDITY</th>
                        <th>GAS CONCENTRATION</th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* 현재 데이터 행 */}
                      <tr>
                        <td>
                          {(() => {
                            const ts =
                              allSensorData.temperature?.timestamp ||
                              allSensorData.humidity?.timestamp ||
                              allSensorData.gas?.timestamp ||
                              mintrendData?.data?.timestamp; // 백업
                            return ts ? new Date(ts).toLocaleString('ko-KR', { hour12: false }) : '-';
                          })()}
                        </td>

                        <td>
                          {allSensorData.temperature ? (
                            <span className={DashboardUtils.getStatusClass(allSensorData.temperature.current.status)}>
                              {allSensorData.temperature.current.value.toFixed(2)}{allSensorData.temperature.unit}
                            </span>
                          ) : (
                            <span>로딩 중...</span>
                          )}
                        </td>
                        <td>
                          {allSensorData.humidity ? (
                            <span className={DashboardUtils.getStatusClass(allSensorData.humidity.current.status)}>
                              {allSensorData.humidity.current.value.toFixed(1)}{allSensorData.humidity.unit}
                            </span>
                          ) : (
                            <span>로딩 중...</span>
                          )}
                        </td>
                        <td>
                          {allSensorData.gas ? (
                            <span className={DashboardUtils.getStatusClass(allSensorData.gas.current.status)}>
                              {allSensorData.gas.current.value.toFixed(0)}{allSensorData.gas.unit}
                            </span>
                          ) : (
                            <span>로딩 중...</span>
                          )}
                        </td>
                      </tr>

                      {/* 예측 데이터 행 */}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* 🆕 QuickSight 대시보드 섹션 */}
              <section className={styles.quicksightSection}>
                <div className={styles.sectionHeader}>
                  <h2 className={styles.sectionTitle}>QUICKSIGHT ANALYTICS DASHBOARD</h2>

                  {/* QuickSight 센서 선택 드롭다운 */}
                  <div className={styles.sensorSelector}>
                    <select
                      value={selectedQuickSightSensor}
                      onChange={(e) => handleQuickSightSensorSelect(e.target.value as QuickSightSensorType)}
                      className={styles.sensorSelect}
                    >
                      {QUICKSIGHT_SENSOR_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className={styles.quicksightCard}>
                  <QuickSightDashboard
                    dashboardData={quickSightData}
                    isLoading={quickSightLoading}
                    error={quickSightError}
                    onRetry={() => fetchQuickSightData(selectedQuickSightSensor)}
                  />
                </div>
              </section>
            </>
          ) : (
            // 다른 메뉴 선택 시 플레이스홀더
            <div style={{ textAlign: 'center', padding: '80px 20px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#374151', marginBottom: '16px' }}>
                {activeMenu} 페이지
              </h2>
              <p style={{ color: '#6b7280', marginBottom: '8px' }}>
                현재 선택된 메뉴: {activeMenu}
              </p>
              <p style={{ fontSize: '14px', color: '#9ca3af' }}>
                실제 페이지 컨텐츠를 여기에 구현하세요.
              </p>
            </div>
          )}
        </div>          
      </main>  

      {/* 🚨 이상치 알림 컴포넌트 추가 - 화면 우상단에 팝업으로 표시 */}
      <AnomalyAlert 
        interval={60000}        // 60초마다 체크
autoHideDelay={60000}   // 60초 표시
        s3ApiEndpoint="/s3/file/last/mintrend"  // 기존 S3 API 사용
        enabled={activeMenu === 'Dashboard'}    // 대시보드 화면에서만 활성화
        maxAlerts={3}           // 최대 3개까지만 표시
        thresholds={{           // 커스텀 임계값 (선택사항)
          temperature: {
            warningMax: 28,     // 28도 이상 경고
            dangerMax: 32,      // 32도 이상 위험
          },
          humidity: {
            warningMax: 75,     // 75% 이상 경고
            dangerMax: 85,      // 85% 이상 위험
          },
          gas: {
            warningMax: 800,    // 800ppm 이상 경고
            dangerMax: 1200,    // 1200ppm 이상 위험
          }
        }}
      />                    
    </div>             
  );
};

export default DashboardScreen;