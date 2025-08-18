// // // // export default Settings;
// // // import React, { useState, useEffect } from 'react';
// // // import { Bell, User, ChevronDown } from 'lucide-react';
// // // import styles from './SettingScreen.module.css';
// // // import { Sidebar } from '../../components/common/Sidebar';
// // // import NotificationDropdown from '../../components/common/dropdown/NotificationDropdown';
// // // import AdminDropdown from '../../components/common/dropdown/AdminDropdown';
// // // import {
// // //   ControlService,
// // //   SensorType,
// // //   Status,
// // //   FormattedLogData,
// // //   ControlLogDto
// // // } from './ControlApi';
// // // import { NotificationData } from '../../services/DashboardTypes';

// // // interface SettingScreenProps {
// // //   onNavigateToChatbot?: () => void;
// // //   onNavigateToHistory?: () => void;
// // //   onNavigateToDashboard?: () => void;
// // //   onNavigateToRole?: () => void;
// // // }

// // // // Settings 컴포넌트 전용 타입 정의
// // // interface SensorSetting {
// // //   current: number;
// // //   target: number;
// // //   threshold: number;
// // //   triggerEnabled: boolean;
// // //   status: Status;
// // // }

// // // interface SettingsState {
// // //   temp: SensorSetting;
// // //   humidity: SensorSetting;
// // //   co2: SensorSetting;
// // // }

// // // type SensorKey = keyof SettingsState;
// // // type NumericField = 'current' | 'target' | 'threshold';

// // // // 없으면 임시 구현
// // // // 기존 함수 전체 교체
// // // const determineStatus = (current: number, target: number, threshold: number): Status => {
// // //   const diff = Math.abs(current - target);
// // //   const toStatus = (s: 'normal' | 'warning' | 'critical') => s as unknown as Status; // ✅ 캐스팅

// // //   if (diff <= 0.1 * threshold) return toStatus('normal');
// // //   if (diff <= 0.3 * threshold) return toStatus('warning');
// // //   return toStatus('critical');
// // // };


// // // const Settings: React.FC<SettingScreenProps> = ({
// // //   onNavigateToChatbot: _onNavigateToChatbot,
// // //   onNavigateToHistory: _onNavigateToHistory,
// // //   onNavigateToDashboard: _onNavigateToDashboard,
// // //   onNavigateToRole: _onNavigateToRole,
// // // }) => {
// // //   // 사이드바 상태
// // //   const [activeMenu, setActiveMenu] = useState('Settings');

// // //   // 설정값 상태
// // //   const [settings, setSettings] = useState<SettingsState>({
// // //     temp: {
// // //       current: 24,
// // //       target: 24,
// // //       threshold: 28,
// // //       triggerEnabled: true,
// // //       status: determineStatus(24, 24, 28)    // ✅ 추가
// // //     },
// // //     humidity: {
// // //       current: 30,
// // //       target: 50,
// // //       threshold: 70,
// // //       triggerEnabled: true,
// // //       status: determineStatus(30, 50, 70)    // ✅ 추가
// // //     },
// // //     co2: {
// // //       current: 500,
// // //       target: 400,
// // //       threshold: 1000,
// // //       triggerEnabled: true,
// // //       status: determineStatus(500, 400, 1000) // ✅ 추가
// // //     }
// // //   });


// // //   // 로그 상태
// // //   const [logs, setLogs] = useState<FormattedLogData[]>([]);
// // //   const [isLoading, setIsLoading] = useState<boolean>(false);
// // //   const [autoFeedback, setAutoFeedback] = useState<boolean>(true);

// // //   // 알림 및 관리자 메뉴 상태
// // //   const [notificationData, setNotificationData] = useState<NotificationData>({
// // //     count: 0,
// // //     notifications: []
// // //   });
// // //   const [isNotificationOpen, setIsNotificationOpen] = useState(false);
// // //   const [isAdminMenuOpen, setIsAdminMenuOpen] = useState(false);

// // //   // 실시간 시간 상태
// // //   const [currentTime, setCurrentTime] = useState(() => {
// // //     const now = new Date();
// // //     return now.toLocaleString('ko-KR', {
// // //       year: 'numeric',
// // //       month: '2-digit',
// // //       day: '2-digit',
// // //       hour: '2-digit',
// // //       minute: '2-digit',
// // //       second: '2-digit',
// // //       hour12: false
// // //     });
// // //   });

// // //   // 메뉴 클릭 핸들러
// // //   const handleMenuClick = (label: string, path: string) => {
// // //     setActiveMenu(label);

// // //     // 네비게이션 처리
// // //     switch (label) {
// // //       case 'Dashboard':
// // //         _onNavigateToDashboard?.();
// // //         break;
// // //       case 'Chatbot':
// // //         _onNavigateToChatbot?.();
// // //         break;
// // //       case 'History':
// // //         _onNavigateToHistory?.();
// // //         break;
// // //       case 'Settings':
// // //         // 현재 페이지이므로 아무 작업 안함
// // //         break;
// // //       case 'Logout':
// // //         // 로그아웃 처리 (향후 구현)
// // //         console.log('Logout clicked');
// // //         break;
// // //       default:
// // //         break;
// // //     }
// // //   };

// // //   // 로그 조회
// // //   const fetchLogs = async (): Promise<void> => {
// // //     try {
// // //       const data = await ControlService.fetchControlHistory(10);
// // //       if (data.success) {
// // //         setLogs(data.logs.map(ControlService.formatLogForDisplay));
// // //       }
// // //     } catch (error) {
// // //       console.error('로그 조회 실패:', error);
// // //     }
// // //   };

// // //   // 제어 로그 전송
// // //   const sendControlLog = async (
// // //     sensorType: SensorKey,
// // //     beforeValue: number,
// // //     status: Status,
// // //     afterValue: number
// // //   ): Promise<boolean> => {
// // //     try {
// // //       const logData: ControlLogDto = {
// // //         sensor_type: ControlService.mapSensorType(sensorType as SensorType),
// // //         before_value: beforeValue,
// // //         status: status,
// // //         after_value: afterValue
// // //       };

// // //       const result = await ControlService.createControlLog(logData);
// // //       if (result.success) {
// // //         await fetchLogs(); // 로그 새로고침
// // //         return true;
// // //       }
// // //     } catch (error) {
// // //       console.error('제어 로그 전송 실패:', error);
// // //     }
// // //     return false;
// // //   };

// // //   // 설정값 변경
// // //   const handleSettingChange = (type: SensorKey, field: NumericField, value: string): void => {
// // //     const numericValue = Number(value);
// // //     if (isNaN(numericValue)) return;
// // //     setSettings(prev => {
// // //       const next = {
// // //         ...prev,
// // //         [type]: {
// // //           ...prev[type],
// // //           [field]: numericValue
// // //         }
// // //       };
// // //       // ✅ 재계산
// // //       const s = next[type];
// // //       next[type].status = ControlService.determineStatus(s.current, s.target, s.threshold);
// // //       return next;
// // //     });
// // //   };


// // //   // 트리거 토글
// // //   const handleTriggerToggle = (type: SensorKey): void => {
// // //     setSettings(prev => ({
// // //       ...prev,
// // //       [type]: {
// // //         ...prev[type],
// // //         triggerEnabled: !prev[type].triggerEnabled
// // //       }
// // //     }));
// // //   };

// // //   //   // 적용하기 버튼
// // //   //   const handleApplySettings = async (type: SensorKey) => {
// // //   //   const setting = settings[type];

// // //   //   try {
// // //   //     const success = await ControlService.applySetting(type, {
// // //   //       target: setting.target,
// // //   //       threshold: setting.threshold,
// // //   //       triggerEnabled: setting.triggerEnabled,
// // //   //     });

// // //   //     if (!success) return;

// // //   //     // ✅ current를 target으로 반영 + STATUS 재계산
// // //   //     setSettings(prev => {
// // //   //       const next = { ...prev };
// // //   //       const updated = {
// // //   //         ...next[type],
// // //   //         current: next[type].target,
// // //   //       };
// // //   //       updated.status = ControlService.determineStatus(
// // //   //         updated.current,
// // //   //         updated.target,
// // //   //         updated.threshold
// // //   //       );
// // //   //       next[type] = updated;
// // //   //       return next;
// // //   //     });
// // //   //   } catch (e) {
// // //   //     console.error(e);
// // //   //   }
// // //   // };

// // //   // 전체 적용하기
// // //   //   const handleApplyAll = async () => {
// // //   //   try {
// // //   //     const success = await ControlService.applyAll({
// // //   //       temp: {
// // //   //         target: settings.temp.target,
// // //   //         threshold: settings.temp.threshold,
// // //   //         triggerEnabled: settings.temp.triggerEnabled,
// // //   //       },
// // //   //       humidity: {
// // //   //         target: settings.humidity.target,
// // //   //         threshold: settings.humidity.threshold,
// // //   //         triggerEnabled: settings.humidity.triggerEnabled,
// // //   //       },
// // //   //       co2: {
// // //   //         target: settings.co2.target,
// // //   //         threshold: settings.co2.threshold,
// // //   //         triggerEnabled: settings.co2.triggerEnabled,
// // //   //       },
// // //   //     });

// // //   //     if (!success) return;

// // //   //     // ✅ 모든 센서: current를 target으로 맞춘 뒤 STATUS 재계산
// // //   //     setSettings(prev => {
// // //   //       const next = { ...prev };

// // //   //       (['temp', 'humidity', 'co2'] as SensorKey[]).forEach((t) => {
// // //   //         const updated = {
// // //   //           ...next[t],
// // //   //           current: next[t].target,
// // //   //         };
// // //   //         updated.status = ControlService.determineStatus(
// // //   //           updated.current,
// // //   //           updated.target,
// // //   //           updated.threshold
// // //   //         );
// // //   //         next[t] = updated;
// // //   //       });

// // //   //       return next;
// // //   //     });
// // //   //   } catch (e) {
// // //   //     console.error(e);
// // //   //   }
// // //   // };
// // //   // 기존 handleApplySettings 전체 교체
// // //   const handleApplySettings = async (type: SensorKey) => {
// // //     // ❗ 서버 연동 대기: 버튼은 존재하지만 동작하지 않음
// // //     console.info('[Settings] Apply clicked (single):', type);
// // //     // 필요하면 토스트:
// // //     // toast.info('아직 연결되지 않은 기능입니다.');
// // //   };
// // //   // 기존 handleApplyAll 전체 교체
// // //   const handleApplyAll = async () => {
// // //     // ❗ 서버 연동 대기: 버튼은 존재하지만 동작하지 않음
// // //     console.info('[Settings] Apply All clicked');
// // //     // 필요하면 토스트:
// // //     // toast.info('아직 연결되지 않은 기능입니다.');
// // //   };

// // //   // LLM 추천
// // //   const handleLLMRecommendation = (): void => {
// // //     const currentTemp = settings.temp.current;
// // //     const currentHumidity = settings.humidity.current;
// // //     const currentCO2 = settings.co2.current;

// // //     const optimalTemp = currentTemp > 26 ? 24 : currentTemp < 20 ? 22 : 24;
// // //     const optimalHumidity = currentHumidity > 60 ? 50 : currentHumidity < 40 ? 45 : 50;
// // //     const optimalCO2 = currentCO2 > 800 ? 400 : 450;

// // //     setSettings(prev => ({
// // //       temp: { ...prev.temp, target: optimalTemp, threshold: 27 },
// // //       humidity: { ...prev.humidity, target: optimalHumidity, threshold: 65 },
// // //       co2: { ...prev.co2, target: optimalCO2, threshold: 800 }
// // //     }));

// // //     alert(`LLM 추천 완료!\n온도: ${optimalTemp}℃\n습도: ${optimalHumidity}%\nCO₂: ${optimalCO2}ppm`);
// // //   };

// // //   // 센서별 정보 반환
// // //   const getSensorInfo = (type: SensorKey): {
// // //     name: string;
// // //     unit: string;
// // //   } => {
// // //     const mappedType = ControlService.mapSensorType(type as SensorType);
// // //     return {
// // //       name: type === 'temp' ? 'TEMPERATURE' :
// // //         type === 'humidity' ? 'HUMIDITY' : 'CO₂ CONCENTRATION',
// // //       unit: ControlService.getSensorUnit(mappedType)
// // //     };
// // //   };

// // //   // 컴포넌트 마운트 시 로그 조회 및 시간 업데이트
// // //   useEffect(() => {
// // //     fetchLogs();

// // //     // 30초마다 시간 업데이트
// // //     const timeInterval = setInterval(() => {
// // //       const now = new Date();
// // //       setCurrentTime(now.toLocaleString('ko-KR', {
// // //         year: 'numeric',
// // //         month: '2-digit',
// // //         day: '2-digit',
// // //         hour: '2-digit',
// // //         minute: '2-digit',
// // //         second: '2-digit',
// // //         hour12: false
// // //       }));
// // //     }, 30000);

// // //     return () => clearInterval(timeInterval);
// // //   }, []);

// // //   return (
// // //     <div className={styles.container}>
// // //       {/* 사이드바 */}
// // //       <Sidebar
// // //         activeMenu={activeMenu}
// // //         onMenuClick={handleMenuClick}
// // //       />

// // //       {/* 메인 컨텐츠 영역 */}
// // //       <main className={styles.mainContent}>
// // //         {/* 상단 헤더 */}
// // //         <header className={styles.header}>
// // //           <div className={styles.headerLeft}>
// // //             <h1 className={styles.pageTitle}>Settings</h1>
// // //             <p className={styles.pageSubtitle}>{currentTime}</p>
// // //           </div>

// // //           <div className={styles.headerRight}>
// // //             {/* 알림 아이콘 */}
// // //             <div className={styles.headerItem}>
// // //               <button
// // //                 onClick={() => {
// // //                   setIsNotificationOpen(!isNotificationOpen);
// // //                   setIsAdminMenuOpen(false);
// // //                 }}
// // //                 className={styles.headerButton}
// // //                 aria-label="알림"
// // //               >
// // //                 <Bell size={20} />
// // //                 {notificationData.count > 0 && (
// // //                   <span className={styles.notificationBadge}>
// // //                     {notificationData.count > 99 ? '99+' : notificationData.count}
// // //                   </span>
// // //                 )}
// // //               </button>

// // //               <NotificationDropdown
// // //                 isOpen={isNotificationOpen}
// // //                 onClose={() => setIsNotificationOpen(false)}
// // //                 notifications={notificationData.notifications}
// // //               />
// // //             </div>

// // //             {/* 관리자 메뉴 */}
// // //             <div className={styles.headerItem}>
// // //               <button
// // //                 onClick={() => {
// // //                   setIsAdminMenuOpen(!isAdminMenuOpen);
// // //                   setIsNotificationOpen(false);
// // //                 }}
// // //                 className={styles.adminButton}
// // //                 aria-label="관리자 메뉴"
// // //               >
// // //                 <User size={20} />
// // //                 <span>관리자</span>
// // //                 <ChevronDown size={16} />
// // //               </button>

// // //               <AdminDropdown
// // //                 isOpen={isAdminMenuOpen}
// // //                 onClose={() => setIsAdminMenuOpen(false)}
// // //               />
// // //             </div>
// // //           </div>
// // //         </header>

// // //         {/* 설정 제목 섹션 */}
// // //         <div className={styles.settingsTitleSection}>
// // //           <h2 className={styles.settingsTitle}>🔧 Refrigerator 모드 이거 하지 말까?</h2>
// // //         </div>

// // //         <div className={styles.content}>
// // //           {/* 메인 설정 영역 */}
// // //           <div className={styles.mainSection}>
// // //             {/* 좌우 분할 레이아웃 */}
// // //             <div className={styles.gridLayout}>
// // //               {/* 왼쪽: 현재 값들 */}
// // //               <div>
// // //                 <h3 className={styles.sectionTitle}>
// // //                   SENSOR VALUES
// // //                 </h3>

// // //                 {(Object.keys(settings) as SensorKey[]).map((type) => {
// // //                   const setting = settings[type];
// // //                   const sensorInfo = getSensorInfo(type);

// // //                   return (
// // //                     <div key={type} className={styles.valueItem}>
// // //                       <div className={styles.valueLeft}>
// // //                         <span className={styles.sensorName}>{sensorInfo.name}</span>
// // //                       </div>
// // //                       <div className={styles.valueRight}>
// // //                         <span className={styles.currentValue}>
// // //                           {setting.current}{sensorInfo.unit}
// // //                         </span>
// // //                         <span
// // //                           className={`${styles.statusValue} ${setting.status === 'critical'
// // //                               ? styles.statusCritical
// // //                               : setting.status === 'warning'
// // //                                 ? styles.statusWarning
// // //                                 : styles.statusNormal
// // //                             }`}
// // //                         >
// // //                           {setting.status === 'critical'
// // //                             ? 'Critical'
// // //                             : setting.status === 'warning'
// // //                               ? 'Warning'
// // //                               : 'Normal'}
// // //                         </span>

// // //                       </div>
// // //                     </div>
// // //                   );
// // //                 })}
// // //               </div>

// // //               {/* 오른쪽: 설정값들 */}
// // //               <div>
// // //                 <h3 className={styles.sectionTitleGreen}>
// // //                   CONTROLS
// // //                 </h3>

// // //                 {(Object.keys(settings) as SensorKey[]).map((type) => {
// // //                   const setting = settings[type];
// // //                   const sensorInfo = getSensorInfo(type);

// // //                   return (
// // //                     <div key={type} className={styles.controlItem}>
// // //                       <div className={styles.controlHeader}>
// // //                         <span className={styles.controlLabel}>
// // //                           {sensorInfo.name}
// // //                         </span>
// // //                         <button
// // //                           onClick={() => handleTriggerToggle(type)}
// // //                           className={`${styles.toggleButton} ${setting.triggerEnabled ? styles.toggleEnabled : styles.toggleDisabled}`}
// // //                         >
// // //                           {setting.triggerEnabled ? 'AUTO' : 'MANUAL'}
// // //                         </button>
// // //                       </div>

// // //                       <div className={styles.inputGroup}>
// // //                         <div className={styles.inputWrapper}>
// // //                           <label className={styles.inputLabel}>
// // //                             TARGET
// // //                           </label>
// // //                           <input
// // //                             type="number"
// // //                             value={setting.target}
// // //                             onChange={(e) => handleSettingChange(type, 'target', e.target.value)}
// // //                             className={styles.input}
// // //                           />
// // //                         </div>
// // //                         <div className={styles.inputWrapper}>
// // //                           <label className={styles.inputLabel}>
// // //                             THRESHOLD
// // //                           </label>
// // //                           <input
// // //                             type="number"
// // //                             value={setting.threshold}
// // //                             onChange={(e) => handleSettingChange(type, 'threshold', e.target.value)}
// // //                             className={styles.input}
// // //                           />
// // //                         </div>
// // //                       </div>

// // //                       <button
// // //                         onClick={() => handleApplySettings(type)}
// // //                         disabled={isLoading}
// // //                         className={`${styles.applyButton} ${isLoading ? styles.applyButtonDisabled : ''}`}
// // //                       >
// // //                         APPLY
// // //                       </button>
// // //                     </div>
// // //                   );
// // //                 })}
// // //               </div>
// // //             </div>

// // //             {/* 자동 Feedback 및 전체 제어 */}
// // //             <div className={styles.bottomControls}>
// // //               <div className={styles.checkboxGroup}>
// // //                 <input
// // //                   type="checkbox"
// // //                   id="autoFeedback"
// // //                   checked={autoFeedback}
// // //                   onChange={(e) => setAutoFeedback(e.target.checked)}
// // //                   className={styles.checkbox}
// // //                 />
// // //                 <label htmlFor="autoFeedback" className={styles.checkboxLabel}>
// // //                   AUTO Feedback
// // //                 </label>
// // //               </div>

// // //               <div className={styles.buttonGroup}>
// // //                 <button
// // //                   onClick={handleLLMRecommendation}
// // //                   className={styles.llmButton}
// // //                 >
// // //                   LLM 추천/AL SUGGESTION
// // //                 </button>

// // //                 <button
// // //                   onClick={handleApplyAll}
// // //                   disabled={isLoading}
// // //                   className={`${styles.applyAllButton} ${isLoading ? styles.applyAllButtonDisabled : ''}`}
// // //                 >
// // //                   {isLoading ? '적용 중...' : 'APPLY ALL'}
// // //                 </button>
// // //               </div>
// // //             </div>
// // //           </div>

// // //           {/* 로그 영역 */}
// // //           <div className={styles.logSection}>
// // //             <div className={styles.logHeader}>
// // //               <h3 className={styles.logTitle}>CONTROL LOG</h3>
// // //               <button
// // //                 onClick={fetchLogs}
// // //                 className={styles.refreshButton}
// // //               >
// // //                 REFRESH
// // //               </button>
// // //             </div>

// // //             <div className={styles.tableWrapper}>
// // //               <table className={styles.table}>
// // //                 <thead>
// // //                   <tr className={styles.tableHead}>
// // //                     <th className={styles.tableHeader}>TIMESTAMP</th>
// // //                     <th className={styles.tableHeader}>SENSOR VALUE</th>
// // //                     <th className={styles.tableHeader}>STATUS</th>
// // //                     <th className={styles.tableHeader}>APPLIED VALUE</th>
// // //                   </tr>
// // //                 </thead>
// // //                 <tbody>
// // //                   {logs.slice(0, 6).map((log, index) => (
// // //                     <tr key={log.id} className={styles.tableRow}>
// // //                       <td className={styles.tableCell}>
// // //                         {log.displayTime}
// // //                       </td>
// // //                       <td className={styles.tableCell}>
// // //                         <div className={styles.logValueGroup}>
// // //                           <span>{log.displaySensorType}:</span>
// // //                           <span className={styles.logValue}>
// // //                             {log.before_value}{log.displayUnit}
// // //                           </span>
// // //                         </div>
// // //                       </td>
// // //                       <td className={styles.tableCell}>
// // //                         <span className={styles.statusBadge} style={{
// // //                           backgroundColor: ControlService.getStatusColor(log.status)
// // //                         }}>
// // //                           {log.status === 'critical' ? '🔴 Critical' :
// // //                             log.status === 'warning' ? '⚠️ Warning' : '✅ Normal'}
// // //                         </span>
// // //                       </td>
// // //                       <td className={styles.tableCell}>
// // //                         <div className={styles.logValueGroup}>
// // //                           <span>{log.displaySensorType}:</span>
// // //                           <span className={styles.actionValue}>
// // //                             {log.after_value}{log.displayUnit}
// // //                           </span>
// // //                         </div>
// // //                       </td>
// // //                     </tr>
// // //                   ))}
// // //                 </tbody>
// // //               </table>

// // //               {logs.length === 0 && (
// // //                 <div className={styles.noDataMessage}>
// // //                   로그가 없습니다.
// // //                 </div>
// // //               )}
// // //             </div>
// // //           </div>
// // //         </div>
// // //       </main>
// // //     </div>
// // //   );
// // // };

// // // export default Settings;
// // import React, { useState, useEffect } from 'react';
// // import {
// //   ControlService,
// //   SensorType,
// //   Status,
// //   FormattedLogData,
// //   ControlLogDto
// // } from './ControlApi';

// // // Settings 컴포넌트 전용 타입 정의
// // interface SensorSetting {
// //   current: number;
// //   target: number;
// //   threshold: number;
// //   triggerEnabled: boolean;
// // }

// // interface SettingsState {
// //   temp: SensorSetting;
// //   humidity: SensorSetting;
// //   co2: SensorSetting;
// // }

// // interface SettingScreenProps {
// //   onNavigateToChatbot: () => void;
// //   onNavigateToHistory: () => void;
// //   onNavigateToDashboard: () => void;
// //   onNavigateToRole: () => void;
// // }

// // type SensorKey = keyof SettingsState;
// // type SettingField = keyof SensorSetting;


// // const handleConnectionTest = async () => {
// //   console.info('[Settings] Connection Test clicked');
// //   // TODO: 필요하면 ControlService.fetchControlHistory(1) 같은 간단 ping 호출 넣기
// // };

// // const Settings: React.FC<SettingScreenProps> = ({
// //   onNavigateToChatbot,
// //   onNavigateToHistory,
// //   onNavigateToDashboard,
// //   onNavigateToRole,
// // }) => {
// //   // 설정값 상태
// //   const [settings, setSettings] = useState<SettingsState>({
// //     temp: { current: 24, target: 24, threshold: 28, triggerEnabled: true },
// //     humidity: { current: 30, target: 50, threshold: 70, triggerEnabled: true },
// //     co2: { current: 500, target: 400, threshold: 1000, triggerEnabled: true }
// //   });

// //   // 로그 상태
// //   const [logs, setLogs] = useState<FormattedLogData[]>([]);
// //   const [isLoading, setIsLoading] = useState<boolean>(false);
// //   const [autoFeedback, setAutoFeedback] = useState<boolean>(true);

// //   // 로그 조회
// //   const fetchLogs = async (): Promise<void> => {
// //     try {
// //       const data = await ControlService.fetchControlHistory(10);
// //       if (data.success) {
// //         setLogs(data.logs.map(ControlService.formatLogForDisplay));
// //       }
// //     } catch (error) {
// //       console.error('로그 조회 실패:', error);
// //     }
// //   };

// //   // 설정값 변경
// //   const handleSettingChange = (
// //     type: SensorKey,
// //     field: SettingField,
// //     value: string
// //   ): void => {
// //     const numericValue = Number(value);
// //     if (isNaN(numericValue)) return;

// //     setSettings(prev => ({
// //       ...prev,
// //       [type]: {
// //         ...prev[type],
// //         [field]: numericValue
// //       }
// //     }));
// //   };

// //   // 트리거 토글
// //   const handleTriggerToggle = (type: SensorKey): void => {
// //     setSettings(prev => ({
// //       ...prev,
// //       [type]: {
// //         ...prev[type],
// //         triggerEnabled: !prev[type].triggerEnabled
// //       }
// //     }));
// //   };

// //   // 적용하기 버튼
// //   const handleApplySettings = async (type: SensorKey): Promise<void> => {
// //     setIsLoading(true);
// //     const setting = settings[type];

// //     try {
// //       // 상태 결정
// //       const status = ControlService.determineStatus(setting.current, setting.target, setting.threshold);

// //       // 개별 센서 제어 로그 전송
// //       const logData: ControlLogDto = {
// //         sensor_type: ControlService.mapSensorType(type as SensorType),
// //         before_value: setting.current,
// //         status: status,
// //         after_value: setting.target
// //       };

// //       const result = await ControlService.createControlLog(logData);

// //       if (result.success) {
// //         // 현재값을 목표값으로 업데이트
// //         setSettings(prev => ({
// //           ...prev,
// //           [type]: {
// //             ...prev[type],
// //             current: setting.target
// //           }
// //         }));

// //         // 로그 새로고침
// //         await fetchLogs();

// //         alert(`✅ ${getSensorInfo(type).name} 설정이 적용되었습니다!`);
// //       } else {
// //         alert('❌ 설정 적용에 실패했습니다.');
// //       }
// //     } catch (error) {
// //       console.error('설정 적용 실패:', error);
// //       alert('❌ 설정 적용 중 오류가 발생했습니다.');
// //     }

// //     setIsLoading(false);
// //   };

// //   // 전체 적용하기
// //   const handleApplyAll = async (): Promise<void> => {
// //     setIsLoading(true);

// //     try {
// //       // 모든 센서의 상태 결정
// //       const tempStatus = ControlService.determineStatus(
// //         settings.temp.current,
// //         settings.temp.target,
// //         settings.temp.threshold
// //       );
// //       const humidityStatus = ControlService.determineStatus(
// //         settings.humidity.current,
// //         settings.humidity.target,
// //         settings.humidity.threshold
// //       );
// //       const co2Status = ControlService.determineStatus(
// //         settings.co2.current,
// //         settings.co2.target,
// //         settings.co2.threshold
// //       );

// //       // 배치 제어 로그 전송 (temp, humidity, gas 총 3번)
// //       const batchResult = await ControlService.createBatchControlLogs({
// //         temp: {
// //           current: settings.temp.current,
// //           target: settings.temp.target,
// //           threshold: settings.temp.threshold,
// //           status: tempStatus
// //         },
// //         humidity: {
// //           current: settings.humidity.current,
// //           target: settings.humidity.target,
// //           threshold: settings.humidity.threshold,
// //           status: humidityStatus
// //         },
// //         co2: {
// //           current: settings.co2.current,
// //           target: settings.co2.target,
// //           threshold: settings.co2.threshold,
// //           status: co2Status
// //         }
// //       });

// //       if (batchResult.success) {
// //         // 모든 현재값을 목표값으로 업데이트
// //         setSettings(prev => ({
// //           temp: { ...prev.temp, current: prev.temp.target },
// //           humidity: { ...prev.humidity, current: prev.humidity.target },
// //           co2: { ...prev.co2, current: prev.co2.target }
// //         }));

// //         // 로그 새로고침
// //         await fetchLogs();

// //         alert(`🎉 모든 센서 설정이 적용되었습니다!\n성공: ${batchResult.successCount}/3개`);
// //       } else {
// //         alert(`⚠️ 일부 설정 적용에 실패했습니다.\n성공: ${batchResult.successCount}/3개\n실패: ${batchResult.failCount}/3개`);
// //       }
// //     } catch (error) {
// //       console.error('전체 설정 적용 실패:', error);
// //       alert('❌ 전체 설정 적용 중 오류가 발생했습니다.');
// //     }

// //     setIsLoading(false);
// //   };

// //   // LLM 추천
// //   const handleLLMRecommendation = (): void => {
// //     const currentTemp = settings.temp.current;
// //     const currentHumidity = settings.humidity.current;
// //     const currentCO2 = settings.co2.current;

// //     const optimalTemp = currentTemp > 26 ? 24 : currentTemp < 20 ? 22 : 24;
// //     const optimalHumidity = currentHumidity > 60 ? 50 : currentHumidity < 40 ? 45 : 50;
// //     const optimalCO2 = currentCO2 > 800 ? 400 : 450;

// //     setSettings(prev => ({
// //       temp: { ...prev.temp, target: optimalTemp, threshold: 27 },
// //       humidity: { ...prev.humidity, target: optimalHumidity, threshold: 65 },
// //       co2: { ...prev.co2, target: optimalCO2, threshold: 800 }
// //     }));

// //     alert(`🤖 LLM 추천 완료!\n온도: ${optimalTemp}℃\n습도: ${optimalHumidity}%\nCO₂: ${optimalCO2}ppm`);
// //   };

// //   // 상태 아이콘
// //   const getStatusIcon = (current: number, target: number, threshold: number): string => {
// //     if (current >= threshold) return '🔴';
// //     if (current > target + 2) return '⚠️';
// //     return '✅';
// //   };

// //   // 센서별 정보 반환
// //   const getSensorInfo = (type: SensorKey): {
// //     icon: string;
// //     name: string;
// //     unit: string;
// //   } => {
// //     const mappedType = ControlService.mapSensorType(type as SensorType);
// //     return {
// //       icon: ControlService.getSensorIcon(mappedType),
// //       name: type === 'temp' ? '온도' :
// //         type === 'humidity' ? '습도' : 'CO₂',
// //       unit: ControlService.getSensorUnit(mappedType)
// //     };
// //   };

// //   // 컴포넌트 마운트 시 로그 조회
// //   useEffect(() => {
// //     const initializeData = async () => {
// //       // API 연결 테스트
// //       try {
// //         const isConnected = await ControlService.testConnection();
// //         if (isConnected) {
// //           console.log('✅ API 연결 성공');
// //           await fetchLogs();
// //         } else {
// //           console.warn('⚠️ API 연결 실패 - 테스트 모드로 실행');
// //         }
// //       } catch (error) {
// //         console.error('❌ 초기화 중 오류:', error);
// //       }
// //     };

// //     initializeData();
// //   }, []);

// //   return (
// //     <div style={{
// //       minHeight: '100vh',
// //       backgroundColor: '#0f172a',
// //       color: '#e2e8f0',
// //       fontFamily: 'system-ui, -apple-system, sans-serif'
// //     }}>
// //       {/* 헤더 */}
// //       <div style={{
// //         backgroundColor: '#1e293b',
// //         padding: '1rem 2rem',
// //         borderBottom: '1px solid #334155'
// //       }}>
// //         <h1 style={{
// //           margin: 0,
// //           fontSize: '1.5rem',
// //           fontWeight: '600'
// //         }}>Setting</h1>
// //         <p style={{
// //           margin: '0.5rem 0 0 0',
// //           color: '#94a3b8',
// //           fontSize: '0.875rem'
// //         }}>🔧 Refrigerator 모드 | API: {process.env.REACT_APP_API_BASE_URL || 'localhost:3001'}</p>
// //       </div>

// //       <div style={{ padding: '2rem' }}>
// //         {/* 메인 설정 영역 */}
// //         <div style={{
// //           backgroundColor: '#1e293b',
// //           padding: '1.5rem',
// //           borderRadius: '0.75rem',
// //           border: '1px solid #334155',
// //           marginBottom: '2rem'
// //         }}>
// //           {/* 좌우 분할 레이아웃 */}
// //           <div style={{
// //             display: 'grid',
// //             gridTemplateColumns: '1fr 1fr',
// //             gap: '2rem',
// //             marginBottom: '1.5rem'
// //           }}>
// //             {/* 왼쪽: 현재 값들 */}
// //             <div>
// //               <h3 style={{
// //                 margin: '0 0 1rem 0',
// //                 color: '#f1f5f9',
// //                 borderBottom: '2px solid #3b82f6',
// //                 paddingBottom: '0.5rem'
// //               }}>
// //                 📊 현재 Values
// //               </h3>

// //               {(Object.keys(settings) as SensorKey[]).map((type) => {
// //                 const setting = settings[type];
// //                 const sensorInfo = getSensorInfo(type);

// //                 return (
// //                   <div key={type} style={{
// //                     display: 'flex',
// //                     alignItems: 'center',
// //                     justifyContent: 'space-between',
// //                     padding: '0.75rem',
// //                     margin: '0.5rem 0',
// //                     backgroundColor: '#334155',
// //                     borderRadius: '0.5rem',
// //                     border: '1px solid #475569'
// //                   }}>
// //                     <div style={{ display: 'flex', alignItems: 'center' }}>
// //                       <span style={{ fontSize: '1.25rem', marginRight: '0.5rem' }}>
// //                         {sensorInfo.icon}
// //                       </span>
// //                       <span style={{ fontWeight: '500' }}>{sensorInfo.name}</span>
// //                     </div>
// //                     <div style={{ display: 'flex', alignItems: 'center' }}>
// //                       <span style={{ fontSize: '1.5rem', marginRight: '0.5rem' }}>
// //                         {getStatusIcon(setting.current, setting.target, setting.threshold)}
// //                       </span>
// //                       <span style={{
// //                         fontSize: '1.25rem',
// //                         fontWeight: '600',
// //                         color: '#3b82f6'
// //                       }}>
// //                         {setting.current}{sensorInfo.unit}
// //                       </span>
// //                     </div>
// //                   </div>
// //                 );
// //               })}
// //             </div>

// //             {/* 오른쪽: 설정값들 */}
// //             <div>
// //               <h3 style={{
// //                 margin: '0 0 1rem 0',
// //                 color: '#f1f5f9',
// //                 borderBottom: '2px solid #10b981',
// //                 paddingBottom: '0.5rem'
// //               }}>
// //                 ⚙️ 설정 Controls
// //               </h3>

// //               {(Object.keys(settings) as SensorKey[]).map((type) => {
// //                 const setting = settings[type];
// //                 const sensorInfo = getSensorInfo(type);

// //                 return (
// //                   <div key={type} style={{
// //                     padding: '1rem',
// //                     margin: '0.5rem 0',
// //                     backgroundColor: '#334155',
// //                     borderRadius: '0.5rem',
// //                     border: '1px solid #475569'
// //                   }}>
// //                     <div style={{
// //                       display: 'flex',
// //                       justifyContent: 'space-between',
// //                       alignItems: 'center',
// //                       marginBottom: '0.75rem'
// //                     }}>
// //                       <span style={{ fontWeight: '500', color: '#cbd5e1' }}>
// //                         {sensorInfo.icon} {sensorInfo.name}
// //                       </span>
// //                       <button
// //                         onClick={() => handleTriggerToggle(type)}
// //                         style={{
// //                           backgroundColor: setting.triggerEnabled ? '#10b981' : '#6b7280',
// //                           color: 'white',
// //                           border: 'none',
// //                           padding: '0.25rem 0.75rem',
// //                           borderRadius: '1rem',
// //                           cursor: 'pointer',
// //                           fontSize: '0.75rem'
// //                         }}
// //                       >
// //                         {setting.triggerEnabled ? 'AUTO' : 'MANUAL'}
// //                       </button>
// //                     </div>

// //                     <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
// //                       <div style={{ flex: 1 }}>
// //                         <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.25rem' }}>
// //                           목표값
// //                         </label>
// //                         <input
// //                           type="number"
// //                           value={setting.target}
// //                           onChange={(e) => handleSettingChange(type, 'target', e.target.value)}
// //                           style={{
// //                             width: '100%',
// //                             padding: '0.375rem',
// //                             backgroundColor: '#475569',
// //                             border: '1px solid #64748b',
// //                             borderRadius: '0.25rem',
// //                             color: '#e2e8f0',
// //                             fontSize: '0.875rem'
// //                           }}
// //                         />
// //                       </div>
// //                       <div style={{ flex: 1 }}>
// //                         <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.25rem' }}>
// //                           임계값
// //                         </label>
// //                         <input
// //                           type="number"
// //                           value={setting.threshold}
// //                           onChange={(e) => handleSettingChange(type, 'threshold', e.target.value)}
// //                           style={{
// //                             width: '100%',
// //                             padding: '0.375rem',
// //                             backgroundColor: '#475569',
// //                             border: '1px solid #64748b',
// //                             borderRadius: '0.25rem',
// //                             color: '#e2e8f0',
// //                             fontSize: '0.875rem'
// //                           }}
// //                         />
// //                       </div>
// //                     </div>

// //                     <button
// //                       onClick={() => handleApplySettings(type)}
// //                       disabled={isLoading}
// //                       style={{
// //                         width: '100%',
// //                         backgroundColor: '#3b82f6',
// //                         color: 'white',
// //                         border: 'none',
// //                         padding: '0.5rem',
// //                         borderRadius: '0.375rem',
// //                         cursor: 'pointer',
// //                         fontSize: '0.875rem',
// //                         fontWeight: '500',
// //                         opacity: isLoading ? 0.6 : 1
// //                       }}
// //                     >
// //                       적용
// //                     </button>
// //                   </div>
// //                 );
// //               })}
// //             </div>
// //           </div>

// //           {/* 자동 Feedback 및 전체 제어 */}
// //           <div style={{
// //             borderTop: '1px solid #475569',
// //             paddingTop: '1rem',
// //             display: 'flex',
// //             justifyContent: 'space-between',
// //             alignItems: 'center',
// //             flexWrap: 'wrap',
// //             gap: '1rem'
// //           }}>
// //             <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
// //               <input
// //                 type="checkbox"
// //                 id="autoFeedback"
// //                 checked={autoFeedback}
// //                 onChange={(e) => setAutoFeedback(e.target.checked)}
// //                 style={{
// //                   width: '1rem',
// //                   height: '1rem',
// //                   accentColor: '#10b981'
// //                 }}
// //               />
// //               <label htmlFor="autoFeedback" style={{ color: '#cbd5e1', fontSize: '0.875rem' }}>
// //                 자동 Feedback
// //               </label>
// //             </div>

// //             <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
// //               <button
// //                 onClick={handleConnectionTest}
// //                 disabled={isLoading}
// //                 style={{
// //                   backgroundColor: '#64748b',
// //                   color: 'white',
// //                   border: 'none',
// //                   padding: '0.75rem 1rem',
// //                   borderRadius: '0.5rem',
// //                   cursor: 'pointer',
// //                   fontSize: '0.875rem',
// //                   fontWeight: '500',
// //                   opacity: isLoading ? 0.6 : 1
// //                 }}
// //               >
// //                 🔗 연결 테스트
// //               </button>

// //               <button
// //                 onClick={handleLLMRecommendation}
// //                 style={{
// //                   backgroundColor: '#8b5cf6',
// //                   color: 'white',
// //                   border: 'none',
// //                   padding: '0.75rem 1rem',
// //                   borderRadius: '0.5rem',
// //                   cursor: 'pointer',
// //                   fontSize: '0.875rem',
// //                   fontWeight: '500'
// //                 }}
// //               >
// //                 🤖 AI 추천
// //               </button>

// //               <button
// //                 onClick={handleApplyAll}
// //                 disabled={isLoading}
// //                 style={{
// //                   backgroundColor: '#10b981',
// //                   color: 'white',
// //                   border: 'none',
// //                   padding: '0.75rem 1.5rem',
// //                   borderRadius: '0.5rem',
// //                   cursor: 'pointer',
// //                   fontSize: '0.875rem',
// //                   fontWeight: '500',
// //                   opacity: isLoading ? 0.6 : 1
// //                 }}
// //               >
// //                 {isLoading ? '적용 중...' : '🚀 전체 적용'}
// //               </button>
// //             </div>
// //           </div>
// //         </div>

// //         {/* 로그 영역 */}
// //         <div style={{
// //           backgroundColor: '#1e293b',
// //           padding: '1.5rem',
// //           borderRadius: '0.75rem',
// //           border: '1px solid #334155'
// //         }}>
// //           <div style={{
// //             display: 'flex',
// //             justifyContent: 'space-between',
// //             alignItems: 'center',
// //             marginBottom: '1rem'
// //           }}>
// //             <h3 style={{ margin: 0, color: '#f1f5f9' }}>📋 Control Log</h3>
// //             <button
// //               onClick={fetchLogs}
// //               style={{
// //                 backgroundColor: '#64748b',
// //                 color: 'white',
// //                 border: 'none',
// //                 padding: '0.5rem 1rem',
// //                 borderRadius: '0.375rem',
// //                 cursor: 'pointer'
// //               }}
// //             >
// //               새로고침
// //             </button>
// //           </div>

// //           <div style={{ overflowX: 'auto' }}>
// //             <table style={{
// //               width: '100%',
// //               borderCollapse: 'collapse',
// //               fontSize: '0.875rem'
// //             }}>
// //               <thead>
// //                 <tr style={{ borderBottom: '2px solid #475569' }}>
// //                   <th style={{ padding: '0.75rem', textAlign: 'left', color: '#cbd5e1', fontWeight: '600' }}>Time</th>
// //                   <th style={{ padding: '0.75rem', textAlign: 'left', color: '#cbd5e1', fontWeight: '600' }}>Values</th>
// //                   <th style={{ padding: '0.75rem', textAlign: 'left', color: '#cbd5e1', fontWeight: '600' }}>Status</th>
// //                   <th style={{ padding: '0.75rem', textAlign: 'left', color: '#cbd5e1', fontWeight: '600' }}>Action</th>
// //                 </tr>
// //               </thead>
// //               <tbody>
// //                 {logs.slice(0, 6).map((log, index) => (
// //                   <tr key={log.id} style={{
// //                     borderBottom: index < logs.length - 1 ? '1px solid #374151' : 'none'
// //                   }}>
// //                     <td style={{ padding: '0.75rem', fontWeight: '500' }}>
// //                       {log.displayTime}
// //                     </td>
// //                     <td style={{ padding: '0.75rem' }}>
// //                       <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
// //                         <span>{log.displaySensorType}:</span>
// //                         <span style={{ fontWeight: '600', color: '#3b82f6' }}>
// //                           {log.before_value}{log.displayUnit}
// //                         </span>
// //                       </div>
// //                     </td>
// //                     <td style={{ padding: '0.75rem' }}>
// //                       <span style={{
// //                         padding: '0.25rem 0.5rem',
// //                         borderRadius: '0.25rem',
// //                         fontSize: '0.75rem',
// //                         fontWeight: '500',
// //                         backgroundColor: ControlService.getStatusColor(log.status),
// //                         color: 'white'
// //                       }}>
// //                         {log.status === 'critical' ? '🔴 Critical' :
// //                           log.status === 'warning' ? '⚠️ Warning' : '✅ Normal'}
// //                       </span>
// //                     </td>
// //                     <td style={{ padding: '0.75rem' }}>
// //                       <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
// //                         <span>{log.displaySensorType}:</span>
// //                         <span style={{ fontWeight: '600', color: '#10b981' }}>
// //                           {log.after_value}{log.displayUnit}
// //                         </span>
// //                       </div>
// //                     </td>
// //                   </tr>
// //                 ))}
// //               </tbody>
// //             </table>

// //             {logs.length === 0 && (
// //               <div style={{
// //                 textAlign: 'center',
// //                 padding: '2rem',
// //                 color: '#94a3b8'
// //               }}>
// //                 로그가 없습니다.
// //               </div>
// //             )}
// //           </div>
// //         </div>
// //       </div>
// //     </div>
// //   );
// // };

// // export default Settings;
// import React, { useState, useEffect } from 'react';
// import { 
//   ControlService,
//   SensorType,
//   Status,
//   FormattedLogData,
//   ControlLogDto
// } from './ControlApi';

// // Settings 컴포넌트 전용 타입 정의
// interface SensorSetting {
//   current: number;
//   target: number;
//   threshold: number;
//   triggerEnabled: boolean;
// }

// interface SettingsState {
//   temp: SensorSetting;
//   humidity: SensorSetting;
//   co2: SensorSetting;
// }

// type SensorKey = keyof SettingsState;
// type SettingField = keyof SensorSetting;

// interface SettingScreenProps {
//   onNavigateToChatbot: () => void;
//   onNavigateToHistory: () => void;
//   onNavigateToDashboard: () => void;
//   onNavigateToRole: () => void;
// }

// const handleConnectionTest = async () => {
//   console.info('[Settings] Connection Test clicked');
//   // TODO: 필요하면 ControlService.fetchControlHistory(1) 같은 간단 ping 호출 넣기
// };

// const Settings: React.FC<SettingScreenProps> = ({
//   onNavigateToChatbot,
//   onNavigateToHistory,
//   onNavigateToDashboard,
//   onNavigateToRole,
// }) => {
//   // 설정값 상태
//   const [settings, setSettings] = useState<SettingsState>({
//     temp: { current: 24, target: 24, threshold: 28, triggerEnabled: true },
//     humidity: { current: 30, target: 50, threshold: 70, triggerEnabled: true },
//     co2: { current: 500, target: 400, threshold: 1000, triggerEnabled: true }
//   });

//   // 로그 상태
//   const [logs, setLogs] = useState<FormattedLogData[]>([]);
//   const [isLoading, setIsLoading] = useState<boolean>(false);
//   const [autoFeedback, setAutoFeedback] = useState<boolean>(true);
//   const [connectionStatus, setConnectionStatus] = useState<string>('확인 중...');

//   // API 호출 throttle을 위한 마지막 호출 시간 추적
//   const [lastApiCall, setLastApiCall] = useState<number>(0);
//   const API_CALL_INTERVAL = 2000; // 2초 간격으로 제한

//   // 로그 조회 (throttle 적용)
//   const fetchLogs = async (): Promise<void> => {
//     const now = Date.now();
    
//     // API 호출 간격 체크
//     if (now - lastApiCall < API_CALL_INTERVAL) {
//       console.log('⏱️ API 호출 간격 제한 (2초 대기)');
//       return;
//     }

//     if (isLoading) {
//       console.log('🔄 이미 로딩 중...');
//       return;
//     }

//     try {
//       setIsLoading(true);
//       setLastApiCall(now);
      
//       const data = await ControlService.fetchControlHistory(10);
//       if (data.success) {
//         setLogs(data.logs.map(ControlService.formatLogForDisplay));
//         setConnectionStatus('연결됨');
//       }
//     } catch (error) {
//       console.error('로그 조회 실패:', error);
//       setConnectionStatus('연결 실패');
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   // 설정값 변경
//   const handleSettingChange = (
//     type: SensorKey, 
//     field: SettingField, 
//     value: string
//   ): void => {
//     const numericValue = Number(value);
//     if (isNaN(numericValue)) return;

//     setSettings(prev => ({
//       ...prev,
//       [type]: {
//         ...prev[type],
//         [field]: numericValue
//       }
//     }));
//   };

//   // 트리거 토글
//   const handleTriggerToggle = (type: SensorKey): void => {
//     setSettings(prev => ({
//       ...prev,
//       [type]: {
//         ...prev[type],
//         triggerEnabled: !prev[type].triggerEnabled
//       }
//     }));
//   };

//   // 적용하기 버튼
//   const handleApplySettings = async (type: SensorKey): Promise<void> => {
//     setIsLoading(true);
//     const setting = settings[type];
    
//     try {
//       // 상태 결정
//       const status = ControlService.determineStatus(setting.current, setting.target, setting.threshold);

//       // 개별 센서 제어 로그 전송
//       const logData: ControlLogDto = {
//         sensor_type: ControlService.mapSensorType(type as SensorType),
//         before_value: setting.current,
//         status: status,
//         after_value: setting.target
//       };

//       const result = await ControlService.createControlLog(logData);
      
//       if (result.success) {
//         // 현재값을 목표값으로 업데이트
//         setSettings(prev => ({
//           ...prev,
//           [type]: {
//             ...prev[type],
//             current: setting.target
//           }
//         }));
        
//         // 로그 새로고침
//         await fetchLogs();
        
//         alert(`✅ ${getSensorInfo(type).name} 설정이 적용되었습니다!`);
//       } else {
//         alert('❌ 설정 적용에 실패했습니다.');
//       }
//     } catch (error) {
//       console.error('설정 적용 실패:', error);
//       alert('❌ 설정 적용 중 오류가 발생했습니다.');
//     }
    
//     setIsLoading(false);
//   };

//   // 전체 적용하기
//   const handleApplyAll = async (): Promise<void> => {
//     setIsLoading(true);
    
//     try {
//       // 모든 센서의 상태 결정
//       const tempStatus = ControlService.determineStatus(
//         settings.temp.current, 
//         settings.temp.target, 
//         settings.temp.threshold
//       );
//       const humidityStatus = ControlService.determineStatus(
//         settings.humidity.current, 
//         settings.humidity.target, 
//         settings.humidity.threshold
//       );
//       const co2Status = ControlService.determineStatus(
//         settings.co2.current, 
//         settings.co2.target, 
//         settings.co2.threshold
//       );

//       // 배치 제어 로그 전송 (temp, humidity, gas 총 3번)
//       const batchResult = await ControlService.createBatchControlLogs({
//         temp: {
//           current: settings.temp.current,
//           target: settings.temp.target,
//           threshold: settings.temp.threshold,
//           status: tempStatus
//         },
//         humidity: {
//           current: settings.humidity.current,
//           target: settings.humidity.target,
//           threshold: settings.humidity.threshold,
//           status: humidityStatus
//         },
//         co2: {
//           current: settings.co2.current,
//           target: settings.co2.target,
//           threshold: settings.co2.threshold,
//           status: co2Status
//         }
//       });

//       if (batchResult.success) {
//         // 모든 현재값을 목표값으로 업데이트
//         setSettings(prev => ({
//           temp: { ...prev.temp, current: prev.temp.target },
//           humidity: { ...prev.humidity, current: prev.humidity.target },
//           co2: { ...prev.co2, current: prev.co2.target }
//         }));
        
//         // 로그 새로고침
//         await fetchLogs();
        
//         alert(`🎉 모든 센서 설정이 적용되었습니다!\n성공: ${batchResult.successCount}/3개`);
//       } else {
//         alert(`⚠️ 일부 설정 적용에 실패했습니다.\n성공: ${batchResult.successCount}/3개\n실패: ${batchResult.failCount}/3개`);
//       }
//     } catch (error) {
//       console.error('전체 설정 적용 실패:', error);
//       alert('❌ 전체 설정 적용 중 오류가 발생했습니다.');
//     }
    
//     setIsLoading(false);
//   };

//   // LLM 추천
//   const handleLLMRecommendation = (): void => {
//     const currentTemp = settings.temp.current;
//     const currentHumidity = settings.humidity.current;
//     const currentCO2 = settings.co2.current;

//     const optimalTemp = currentTemp > 26 ? 24 : currentTemp < 20 ? 22 : 24;
//     const optimalHumidity = currentHumidity > 60 ? 50 : currentHumidity < 40 ? 45 : 50;
//     const optimalCO2 = currentCO2 > 800 ? 400 : 450;

//     setSettings(prev => ({
//       temp: { ...prev.temp, target: optimalTemp, threshold: 27 },
//       humidity: { ...prev.humidity, target: optimalHumidity, threshold: 65 },
//       co2: { ...prev.co2, target: optimalCO2, threshold: 800 }
//     }));
    
//     alert(`🤖 LLM 추천 완료!\n온도: ${optimalTemp}℃\n습도: ${optimalHumidity}%\nCO₂: ${optimalCO2}ppm`);
//   };

//   // 상태 아이콘
//   const getStatusIcon = (current: number, target: number, threshold: number): string => {
//     if (current >= threshold) return '🔴';
//     if (current > target + 2) return '⚠️';
//     return '✅';
//   };

//   // 센서별 정보 반환
//   const getSensorInfo = (type: SensorKey): { 
//     icon: string; 
//     name: string; 
//     unit: string; 
//   } => {
//     const mappedType = ControlService.mapSensorType(type as SensorType);
//     return {
//       icon: ControlService.getSensorIcon(mappedType),
//       name: type === 'temp' ? '온도' : 
//             type === 'humidity' ? '습도' : 'CO₂',
//       unit: ControlService.getSensorUnit(mappedType)
//     };
//   };

//   // 컴포넌트 마운트 시 초기화 (API 호출 최소화)
//   useEffect(() => {
//     const initializeData = async () => {
//       try {
//         // 단순 연결 상태 체크 (API 호출 없음)
//         const isConfigured = await ControlService.testConnection();
        
//         if (isConfigured) {
//           setConnectionStatus('설정됨');
//           console.log('✅ API 설정 확인 완료');
          
//           // 2초 후 로그 조회 (초기 로딩 시에만)
//           setTimeout(() => {
//             fetchLogs();
//           }, 2000);
//         } else {
//           setConnectionStatus('설정 필요');
//           console.warn('⚠️ API 설정이 필요합니다');
//         }
//       } catch (error) {
//         console.error('❌ 초기화 중 오류:', error);
//         setConnectionStatus('오류');
//       }
//     };

//     initializeData();
//   }, []); // 빈 의존성 배열로 한 번만 실행

//   return (
//     <div style={{
//       minHeight: '100vh',
//       backgroundColor: '#0f172a',
//       color: '#e2e8f0',
//       fontFamily: 'system-ui, -apple-system, sans-serif'
//     }}>
//       {/* 헤더 */}
//       <div style={{
//         backgroundColor: '#1e293b',
//         padding: '1rem 2rem',
//         borderBottom: '1px solid #334155'
//       }}>
//         <h1 style={{
//           margin: 0,
//           fontSize: '1.5rem',
//           fontWeight: '600'
//         }}>Setting</h1>
//         <p style={{
//           margin: '0.5rem 0 0 0',
//           color: '#94a3b8',
//           fontSize: '0.875rem'
//         }}>🔧 Refrigerator 모드 | API: {process.env.REACT_APP_API_BASE_URL || 'localhost:3001'} | 상태: {connectionStatus}</p>
//       </div>

//       <div style={{ padding: '2rem' }}>
//         {/* 메인 설정 영역 */}
//         <div style={{
//           backgroundColor: '#1e293b',
//           padding: '1.5rem',
//           borderRadius: '0.75rem',
//           border: '1px solid #334155',
//           marginBottom: '2rem'
//         }}>
//           {/* 좌우 분할 레이아웃 */}
//           <div style={{
//             display: 'grid',
//             gridTemplateColumns: '1fr 1fr',
//             gap: '2rem',
//             marginBottom: '1.5rem'
//           }}>
//             {/* 왼쪽: 현재 값들 */}
//             <div>
//               <h3 style={{ 
//                 margin: '0 0 1rem 0', 
//                 color: '#f1f5f9',
//                 borderBottom: '2px solid #3b82f6',
//                 paddingBottom: '0.5rem'
//               }}>
//                 📊 현재 Values
//               </h3>
              
//               {(Object.keys(settings) as SensorKey[]).map((type) => {
//                 const setting = settings[type];
//                 const sensorInfo = getSensorInfo(type);
                
//                 return (
//                   <div key={type} style={{
//                     display: 'flex',
//                     alignItems: 'center',
//                     justifyContent: 'space-between',
//                     padding: '0.75rem',
//                     margin: '0.5rem 0',
//                     backgroundColor: '#334155',
//                     borderRadius: '0.5rem',
//                     border: '1px solid #475569'
//                   }}>
//                     <div style={{ display: 'flex', alignItems: 'center' }}>
//                       <span style={{ fontSize: '1.25rem', marginRight: '0.5rem' }}>
//                         {sensorInfo.icon}
//                       </span>
//                       <span style={{ fontWeight: '500' }}>{sensorInfo.name}</span>
//                     </div>
//                     <div style={{ display: 'flex', alignItems: 'center' }}>
//                       <span style={{ fontSize: '1.5rem', marginRight: '0.5rem' }}>
//                         {getStatusIcon(setting.current, setting.target, setting.threshold)}
//                       </span>
//                       <span style={{ 
//                         fontSize: '1.25rem', 
//                         fontWeight: '600',
//                         color: '#3b82f6'
//                       }}>
//                         {setting.current}{sensorInfo.unit}
//                       </span>
//                     </div>
//                   </div>
//                 );
//               })}
//             </div>

//             {/* 오른쪽: 설정값들 */}
//             <div>
//               <h3 style={{ 
//                 margin: '0 0 1rem 0', 
//                 color: '#f1f5f9',
//                 borderBottom: '2px solid #10b981',
//                 paddingBottom: '0.5rem'
//               }}>
//                 ⚙️ 설정 Controls
//               </h3>

//               {(Object.keys(settings) as SensorKey[]).map((type) => {
//                 const setting = settings[type];
//                 const sensorInfo = getSensorInfo(type);
                
//                 return (
//                   <div key={type} style={{
//                     padding: '1rem',
//                     margin: '0.5rem 0',
//                     backgroundColor: '#334155',
//                     borderRadius: '0.5rem',
//                     border: '1px solid #475569'
//                   }}>
//                     <div style={{ 
//                       display: 'flex', 
//                       justifyContent: 'space-between', 
//                       alignItems: 'center',
//                       marginBottom: '0.75rem'
//                     }}>
//                       <span style={{ fontWeight: '500', color: '#cbd5e1' }}>
//                         {sensorInfo.icon} {sensorInfo.name}
//                       </span>
//                       <button
//                         onClick={() => handleTriggerToggle(type)}
//                         style={{
//                           backgroundColor: setting.triggerEnabled ? '#10b981' : '#6b7280',
//                           color: 'white',
//                           border: 'none',
//                           padding: '0.25rem 0.75rem',
//                           borderRadius: '1rem',
//                           cursor: 'pointer',
//                           fontSize: '0.75rem'
//                         }}
//                       >
//                         {setting.triggerEnabled ? 'AUTO' : 'MANUAL'}
//                       </button>
//                     </div>

//                     <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
//                       <div style={{ flex: 1 }}>
//                         <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.25rem' }}>
//                           목표값
//                         </label>
//                         <input
//                           type="number"
//                           value={setting.target}
//                           onChange={(e) => handleSettingChange(type, 'target', e.target.value)}
//                           style={{
//                             width: '100%',
//                             padding: '0.375rem',
//                             backgroundColor: '#475569',
//                             border: '1px solid #64748b',
//                             borderRadius: '0.25rem',
//                             color: '#e2e8f0',
//                             fontSize: '0.875rem'
//                           }}
//                         />
//                       </div>
//                       <div style={{ flex: 1 }}>
//                         <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.25rem' }}>
//                           임계값
//                         </label>
//                         <input
//                           type="number"
//                           value={setting.threshold}
//                           onChange={(e) => handleSettingChange(type, 'threshold', e.target.value)}
//                           style={{
//                             width: '100%',
//                             padding: '0.375rem',
//                             backgroundColor: '#475569',
//                             border: '1px solid #64748b',
//                             borderRadius: '0.25rem',
//                             color: '#e2e8f0',
//                             fontSize: '0.875rem'
//                           }}
//                         />
//                       </div>
//                     </div>

//                     <button
//                       onClick={() => handleApplySettings(type)}
//                       disabled={isLoading}
//                       style={{
//                         width: '100%',
//                         backgroundColor: isLoading ? '#6b7280' : '#3b82f6',
//                         color: 'white',
//                         border: 'none',
//                         padding: '0.5rem',
//                         borderRadius: '0.375rem',
//                         cursor: isLoading ? 'not-allowed' : 'pointer',
//                         fontSize: '0.875rem',
//                         fontWeight: '500',
//                         opacity: isLoading ? 0.6 : 1
//                       }}
//                     >
//                       {isLoading ? '⏳ 적용중...' : '적용'}
//                     </button>
//                   </div>
//                 );
//               })}
//             </div>
//           </div>

//           {/* 자동 Feedback 및 전체 제어 */}
//           <div style={{
//             borderTop: '1px solid #475569',
//             paddingTop: '1rem',
//             display: 'flex',
//             justifyContent: 'space-between',
//             alignItems: 'center',
//             flexWrap: 'wrap',
//             gap: '1rem'
//           }}>
//             <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
//               <input
//                 type="checkbox"
//                 id="autoFeedback"
//                 checked={autoFeedback}
//                 onChange={(e) => setAutoFeedback(e.target.checked)}
//                 style={{
//                   width: '1rem',
//                   height: '1rem',
//                   accentColor: '#10b981'
//                 }}
//               />
//               <label htmlFor="autoFeedback" style={{ color: '#cbd5e1', fontSize: '0.875rem' }}>
//                 자동 Feedback
//               </label>
//             </div>

//             <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
//               <button
//                 onClick={handleConnectionTest}
//                 disabled={isLoading}
//                 style={{
//                   backgroundColor: isLoading ? '#6b7280' : '#64748b',
//                   color: 'white',
//                   border: 'none',
//                   padding: '0.75rem 1rem',
//                   borderRadius: '0.5rem',
//                   cursor: isLoading ? 'not-allowed' : 'pointer',
//                   fontSize: '0.875rem',
//                   fontWeight: '500',
//                   opacity: isLoading ? 0.6 : 1
//                 }}
//               >
//                 {isLoading ? '⏳ 테스트중...' : '🔗 연결 테스트'}
//               </button>

//               <button
//                 onClick={handleLLMRecommendation}
//                 style={{
//                   backgroundColor: '#8b5cf6',
//                   color: 'white',
//                   border: 'none',
//                   padding: '0.75rem 1rem',
//                   borderRadius: '0.5rem',
//                   cursor: 'pointer',
//                   fontSize: '0.875rem',
//                   fontWeight: '500'
//                 }}
//               >
//                 🤖 AI 추천
//               </button>
              
//               <button
//                 onClick={handleApplyAll}
//                 disabled={isLoading}
//                 style={{
//                   backgroundColor: '#10b981',
//                   color: 'white',
//                   border: 'none',
//                   padding: '0.75rem 1.5rem',
//                   borderRadius: '0.5rem',
//                   cursor: 'pointer',
//                   fontSize: '0.875rem',
//                   fontWeight: '500',
//                   opacity: isLoading ? 0.6 : 1
//                 }}
//               >
//                 {isLoading ? '적용 중...' : '🚀 전체 적용'}
//               </button>
//             </div>
//           </div>
//         </div>

//         {/* 로그 영역 */}
//         <div style={{
//           backgroundColor: '#1e293b',
//           padding: '1.5rem',
//           borderRadius: '0.75rem',
//           border: '1px solid #334155'
//         }}>
//           <div style={{
//             display: 'flex',
//             justifyContent: 'space-between',
//             alignItems: 'center',
//             marginBottom: '1rem'
//           }}>
//             <h3 style={{ margin: 0, color: '#f1f5f9' }}>📋 Control Log</h3>
//             <button
//               onClick={() => {
//                 if (isLoading) {
//                   alert('⏱️ 다른 작업이 진행 중입니다. 잠시 후 다시 시도해주세요.');
//                   return;
//                 }
//                 fetchLogs();
//               }}
//               disabled={isLoading}
//               style={{
//                 backgroundColor: isLoading ? '#6b7280' : '#64748b',
//                 color: 'white',
//                 border: 'none',
//                 padding: '0.5rem 1rem',
//                 borderRadius: '0.375rem',
//                 cursor: isLoading ? 'not-allowed' : 'pointer',
//                 opacity: isLoading ? 0.6 : 1
//               }}
//             >
//               {isLoading ? '⏳ 로딩중...' : '새로고침'}
//             </button>
//           </div>

//           <div style={{ overflowX: 'auto' }}>
//             <table style={{
//               width: '100%',
//               borderCollapse: 'collapse',
//               fontSize: '0.875rem'
//             }}>
//               <thead>
//                 <tr style={{ borderBottom: '2px solid #475569' }}>
//                   <th style={{ padding: '0.75rem', textAlign: 'left', color: '#cbd5e1', fontWeight: '600' }}>Time</th>
//                   <th style={{ padding: '0.75rem', textAlign: 'left', color: '#cbd5e1', fontWeight: '600' }}>Values</th>
//                   <th style={{ padding: '0.75rem', textAlign: 'left', color: '#cbd5e1', fontWeight: '600' }}>Status</th>
//                   <th style={{ padding: '0.75rem', textAlign: 'left', color: '#cbd5e1', fontWeight: '600' }}>Action</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {logs.slice(0, 6).map((log, index) => (
//                   <tr key={log.id} style={{ 
//                     borderBottom: index < logs.length - 1 ? '1px solid #374151' : 'none' 
//                   }}>
//                     <td style={{ padding: '0.75rem', fontWeight: '500' }}>
//                       {log.displayTime}
//                     </td>
//                     <td style={{ padding: '0.75rem' }}>
//                       <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
//                         <span>{log.displaySensorType}:</span>
//                         <span style={{ fontWeight: '600', color: '#3b82f6' }}>
//                           {log.before_value}{log.displayUnit}
//                         </span>
//                       </div>
//                     </td>
//                     <td style={{ padding: '0.75rem' }}>
//                       <span style={{
//                         padding: '0.25rem 0.5rem',
//                         borderRadius: '0.25rem',
//                         fontSize: '0.75rem',
//                         fontWeight: '500',
//                         backgroundColor: ControlService.getStatusColor(log.status),
//                         color: 'white'
//                       }}>
//                         {log.status === 'critical' ? '🔴 Critical' :
//                         log.status === 'warning' ? '⚠️ Warning' : '✅ Normal'}
//                       </span>
//                     </td>
//                     <td style={{ padding: '0.75rem' }}>
//                       <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
//                         <span>{log.displaySensorType}:</span>
//                         <span style={{ fontWeight: '600', color: '#10b981' }}>
//                           {log.after_value}{log.displayUnit}
//                         </span>
//                       </div>
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
            
//             {logs.length === 0 && (
//               <div style={{
//                 textAlign: 'center',
//                 padding: '2rem',
//                 color: '#94a3b8'
//               }}>
//                 로그가 없습니다.
//               </div>
//             )}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Settings;
import React, { useEffect, useState, useCallback } from 'react';
import styles from './SettingScreen.module.css';

import {
  SensorType,
  Status,
  ControlLogDto,
  // 화면에 쓰는 타입과 유틸들
  type FormattedLogData,
  mapSensorType,
  getSensorIcon,
  getSensorUnit,
  formatLogForDisplay,
  determineStatus,
  getStatusColor,
} from '../../services/ControlApiTypes';

import { ControlHistoryService } from './hooks/ControlApiHistory';
import { ControlLogService } from './hooks/ControlApiLog';


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
const API_CALL_INTERVAL = 2000; // 2초 간격으로 조회 제한
const INITIAL_SETTINGS: SettingsState = {
  temp: { current: 24, target: 24, threshold: 28, triggerEnabled: true },
  humidity: { current: 30, target: 50, threshold: 70, triggerEnabled: true },
  co2: { current: 500, target: 400, threshold: 1000, triggerEnabled: true }
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

  // =========================
  // 유틸 / 헬퍼
  // =========================
  const getStatusIcon = (current: number, target: number, threshold: number): string => {
    if (current >= threshold) return '🔴';
    if (current > target + 2) return '⚠️';
    return '✅';
  };

  const getSensorInfo = (type: SensorKey): { icon: string; name: string; unit: string } => {
  const mappedType = mapSensorType(type as SensorType);
  return {
    icon: getSensorIcon(mappedType),
    name: type === 'temp' ? '온도' : type === 'humidity' ? '습도' : 'CO₂',
    unit: getSensorUnit(mappedType),
  };
};

  // =========================
  // 로그 조회 (throttle)
  // =========================
  const fetchLogs = useCallback(async (): Promise<void> => {
  const now = Date.now();

  if (now - lastApiCall < API_CALL_INTERVAL) {
    const waitMs = API_CALL_INTERVAL - (now - lastApiCall);
    const msg = `⏱️ API 호출 간격 제한 (${Math.ceil(waitMs / 100) / 10}s 후 가능)`;
    console.log(msg);
    setDebugInfo(msg);
    return;
  }
  if (isLoading) {
    console.log('🔄 이미 로딩 중.');
    setDebugInfo('🔄 이미 로딩 중.');
    return;
  }

  try {
    setIsLoading(true);
    setLastApiCall(now);
    setDebugInfo('📡 API 호출 중.');

    const data = await ControlHistoryService.fetchControlHistory(10);
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
}, [isLoading, lastApiCall, setLogs, setDebugInfo]);


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
    const status: Status = determineStatus(setting.current, setting.target, setting.threshold);

    const logData: ControlLogDto = {
      timestamp: new Date().toISOString(),
      sensor_type: mapSensorType(type as SensorType),
      before_value: setting.current,
      status,
      after_value: setting.target,
    };

    // 기존 logData 만들던 코드 그대로 두고…
const result = await ControlLogService.createControlLog(logData);

    if (result.success) {
      setSettings(prev => ({
        ...prev,
        [type]: { ...prev[type], status },
      }));
      setDebugInfo('✅ 적용 완료');
      await fetchLogs();
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
    const tempStatus = determineStatus(settings.temp.current, settings.temp.target, settings.temp.threshold);
    const humidityStatus = determineStatus(settings.humidity.current, settings.humidity.target, settings.humidity.threshold);
    const co2Status = determineStatus(settings.co2.current, settings.co2.target, settings.co2.threshold);

    const batchResult = await ControlLogService.createBatchControlLogs({
      temp: { current: settings.temp.current, target: settings.temp.target, threshold: settings.temp.threshold, status: tempStatus },
      humidity: { current: settings.humidity.current, target: settings.humidity.target, threshold: settings.humidity.threshold, status: humidityStatus },
      co2: { current: settings.co2.current, target: settings.co2.target, threshold: settings.co2.threshold, status: co2Status },
    });

    setDebugInfo(batchResult.success ? '✅ 전체 적용 완료' : `⚠️ 일부 실패 (${batchResult.failCount}건)`);
    await fetchLogs();
  } catch (err) {
    console.error(err);
    setDebugInfo('❌ 전체 적용 중 오류');
  }
};


  // =========================
  // 연결 테스트
  // =========================
  const handleConnectionTest = async (): Promise<void> => {
  setIsLoading(true);
  setDebugInfo('🔗 연결 테스트 중...');
  try {
    const data = await ControlHistoryService.fetchControlHistory(1);
    const ok = !!data && data.success !== undefined;
    setConnectionStatus(ok ? '설정됨' : '설정 필요');
    setDebugInfo(ok ? '✅ 연결 테스트 성공' : '⚠️ 연결 테스트 실패');
    alert(ok ? '✅ API 연결 정상입니다.' : '⚠️ API 설정/연결이 필요합니다.');
  } catch {
    setConnectionStatus('설정 필요');
    setDebugInfo('❌ 연결 테스트 오류');
  } finally {
    setIsLoading(false);
  }
};


  // =========================
  // AI 추천(LLM 모사)
  // =========================
  const handleLLMRecommendation = (): void => {
    const currentTemp = settings.temp.current;
    const currentHumidity = settings.humidity.current;
    const currentCO2 = settings.co2.current;

    const optimalTemp = currentTemp > 26 ? 24 : currentTemp < 20 ? 22 : 24;
    const optimalHumidity = currentHumidity > 60 ? 50 : currentHumidity < 40 ? 45 : 50;
    const optimalCO2 = currentCO2 > 800 ? 400 : 450;

    setSettings(prev => ({
      temp: { ...prev.temp, target: optimalTemp, threshold: 27 },
      humidity: { ...prev.humidity, target: optimalHumidity, threshold: 65 },
      co2: { ...prev.co2, target: optimalCO2, threshold: 800 }
    }));

    alert(`🤖 LLM 추천 완료!\n온도: ${optimalTemp}℃\n습도: ${optimalHumidity}%\nCO₂: ${optimalCO2}ppm`);
  };

  // =========================
  // 테스트 데이터 전송
  // =========================
  const handleSendTestData = async (): Promise<void> => {
    if (isLoading) return;

    const testData: ControlLogDto = {
      timestamp: new Date().toISOString(),
      sensor_type: 'temp' as SensorType,
      before_value: 25,
      status: 'warning' as Status,
      after_value: 23
    };

    try {
      setDebugInfo(`🧪 테스트 데이터 전송: ${JSON.stringify(testData)}`);
      setIsLoading(true);
      const result = await ControlLogService.createControlLog(testData);
      console.log('🧪 테스트 결과:', result);
      setDebugInfo(`🧪 테스트 성공: ${JSON.stringify(result)}`);

      if (result.success) {
        alert(`🧪 테스트 성공!\nID: ${result.controlLogs?.[0]?.id ?? '-'}\nIoT: ${result.iotMessagesSent}개`);
        setTimeout(() => fetchLogs(), 600);
      } else {
        alert('🧪 테스트 실패: success=false');
      }
    } catch (err: unknown) {
      const error = err as Error;
      console.error('🧪 테스트 실패:', error);
      setDebugInfo(`🧪 테스트 실패: ${error?.message ?? ''}`);
      alert(`🧪 테스트 실패: ${error?.message ?? ''}`);
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
          console.log('✅ API 설정 확인 완료');
          setTimeout(() => fetchLogs(), 1200);
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

  // =========================
  // 렌더
  // =========================
  return (
    <div className={styles.container}>
      {/* 헤더 */}
      <div className={styles.header}>
        <h1 className={styles.title}>Setting</h1>
        <p className={styles.subtitle}>
          🔧 Refrigerator 모드 | API: {process.env.REACT_APP_API_BASE_URL || 'localhost:3001'} | 상태: {connectionStatus}
        </p>

        <div className={styles.headerRow}>
          <p className={styles.debug}>🐛 디버그: {debugInfo}</p>

          <div className={styles.actions}>
            <button
              onClick={handleSendTestData}
              disabled={isLoading}
              className={`${styles.btn} ${styles.btnTest} ${isLoading ? styles.btnDisabled : ''}`}
            >
              🧪 테스트 데이터
            </button>

            <button
              onClick={handleConnectionTest}
              disabled={isLoading}
              className={`${styles.btn} ${styles.btnConnect} ${isLoading ? styles.btnDisabled : ''}`}
            >
              {isLoading ? '⏳ 테스트중...' : '🔗 연결 테스트'}
            </button>
          </div>
        </div>
      </div>

      {/* 본문 */}
      <div className={styles.main}>
        {/* 메인 설정 영역 */}
        <div className={styles.card}>
          <div className={styles.grid}>
            {/* 왼쪽: 현재값 */}
            <div>
              <h3 className={`${styles.sectionTitle} ${styles.borderBlue}`}>📊 현재 Values</h3>

              {(Object.keys(settings) as SensorKey[]).map(type => {
                const setting = settings[type];
                const sensorInfo = getSensorInfo(type);

                return (
                  <div key={type} className={styles.currentItem}>
                    <div className={styles.currentLeft}>
                      <span className={styles.icon}>{sensorInfo.icon}</span>
                      <span className={styles.currentName}>{sensorInfo.name}</span>
                    </div>
                    <div className={styles.currentRight}>
                      <span className={styles.statusIcon}>
                        {getStatusIcon(setting.current, setting.target, setting.threshold)}
                      </span>
                      <span className={styles.currentValue}>
                        {setting.current}{sensorInfo.unit}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 오른쪽: 설정값 */}
            <div>
              <h3 className={`${styles.sectionTitle} ${styles.borderGreen}`}>⚙️ 설정 Controls</h3>

              {(Object.keys(settings) as SensorKey[]).map(type => {
                const setting = settings[type];
                const sensorInfo = getSensorInfo(type);

                return (
                  <div key={type} className={styles.controlBox}>
                    <div className={styles.controlHeader}>
                      <span className={styles.controlTitle}>
                        {sensorInfo.icon} {sensorInfo.name}
                      </span>
                      <button
                        onClick={() => handleTriggerToggle(type)}
                        className={`${styles.chip} ${setting.triggerEnabled ? styles.chipOn : styles.chipOff}`}
                      >
                        {setting.triggerEnabled ? 'AUTO' : 'MANUAL'}
                      </button>
                    </div>

                    <div className={styles.fieldRow}>
                      <div className={styles.field}>
                        <label className={styles.label}>목표값</label>
                        <input
                          type="number"
                          value={setting.target}
                          onChange={e => handleSettingChange(type, 'target', e.target.value)}
                          className={styles.input}
                        />
                      </div>
                      <div className={styles.field}>
                        <label className={styles.label}>임계값</label>
                        <input
                          type="number"
                          value={setting.threshold}
                          onChange={e => handleSettingChange(type, 'threshold', e.target.value)}
                          className={styles.input}
                        />
                      </div>
                    </div>

                    <button
                      onClick={() => handleApplySettings(type)}
                      disabled={isLoading}
                      className={`${styles.btn} ${styles.btnPrimary} ${styles.btnBlock} ${isLoading ? styles.btnDisabled : ''}`}
                    >
                      {isLoading ? '⏳ 적용중...' : '적용'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 자동 Feedback 및 전체 제어 */}
          <div className={styles.footerRow}>
            <div className={styles.checkboxRow}>
              <input
                type="checkbox"
                id="autoFeedback"
                checked={autoFeedback}
                onChange={e => setAutoFeedback(e.target.checked)}
                className={styles.checkbox}
              />
              <label htmlFor="autoFeedback" className={styles.checkboxLabel}>
                자동 Feedback
              </label>
            </div>

            <div className={styles.footerActions}>
              <button
                onClick={handleLLMRecommendation}
                className={`${styles.btn} ${styles.btnViolet}`}
              >
                🤖 AI 추천
              </button>

              <button
                onClick={handleApplyAll}
                disabled={isLoading}
                className={`${styles.btn} ${styles.btnSuccess} ${isLoading ? styles.btnDisabled : ''}`}
              >
                {isLoading ? '적용 중...' : '🚀 전체 적용'}
              </button>
            </div>
          </div>
        </div>

        {/* 로그 영역 */}
        <div className={styles.cardLogs}>
          <div className={styles.logsHeader}>
            <h3 className={styles.logsTitle}>📋 Control Log</h3>
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
              {isLoading ? '⏳ 로딩중...' : '새로고침'}
            </button>
          </div>

          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Values</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {logs.slice(0, 6).map((log, index) => (
                  <tr key={log.id} className={index < logs.length - 1 ? styles.rowBorder : ''}>
                    <td>{log.displayTime}</td>
                    <td>
                      <div className={styles.inlineRow}>
                        <span>{log.displaySensorType}:</span>
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
                        {log.status === 'critical' ? '🔴 Critical' :
                        log.status === 'warning' ? '⚠️ Warning' : '✅ Normal'}
                      </span>
                    </td>
                    <td>
                      <div className={styles.inlineRow}>
                        <span>{log.displaySensorType}:</span>
                        <span className={styles.valueGreen}>
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
  );
};

export default SettingScreen;
