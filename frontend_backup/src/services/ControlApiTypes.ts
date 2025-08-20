// src/services/ControlApiTypes.ts

// ===== 타입 =====
export interface ControlLogEntity {
  id: string;
  timestamp: string;
  sensor_type: string;
  before_value: number;
  status: string;
  after_value: number;
}

export interface ControlLogDto {
  timestamp?: string;
  sensor_type: string;
  before_value: number;
  status: string;
  after_value: number;
}

export interface ControlLogSummaryDto {
  id: string;
  sensor_type: string;
  before_value: number;
  status: string;
  after_value: number;
}

export interface ControlResponseDto {
  success: boolean;
  controlLogs: ControlLogSummaryDto[];
  iotMessagesSent: number;
}

export interface HistoryResponseDto {
  success: boolean;
  totalCount: number;
  logs: ControlLogEntity[];
}

export interface FormattedLogData extends ControlLogEntity {
  displayTime: string;
  displaySensorType: string;
  displayUnit: string;
  displayStatus: string;
}

export interface BatchControlResult {
  success: boolean;
  successCount: number;
  failCount: number;
  results: ControlResponseDto[];
}

// ===== enum =====
export enum SensorType {
  TEMP = 'temp',
  HUMIDITY = 'humidity',
  CO2 = 'co2',
}

export enum Status {
  GOOD = 'good',
  NORMAL = 'normal', 
  WARNING = 'warning'
}

// ===== 공통 유틸 =====
// ControlApiTypes.ts

// 1) Z 보존 (slice 제거)
export function formatDateForApi(date: Date = new Date()): string {
  return date.toISOString();        // ✅ "....Z" 유지
}

// 2) 무Z 문자열 방지용 보정 유틸
function normalizeIso(ts: string): string {
  if (!ts) return ts;
  // 이미 Z 또는 ±HH:MM 있으면 그대로
  if (/Z$/.test(ts) || /[+-]\d\d:\d\d$/.test(ts)) return ts;
  // 'YYYY-MM-DDTHH:mm:ss' 같이 끝나면 Z 붙여 UTC 로 해석
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(ts)) return ts + 'Z';
  return ts;
}


export function mapSensorType(frontendType: SensorType | string): string {
  const mapping: Record<string, string> = {
    [SensorType.TEMP]: 'temp',
    [SensorType.HUMIDITY]: 'humidity',
    [SensorType.CO2]: 'gas', // CO2는 백엔드에서 'gas'로 처리
  };
  return mapping[frontendType] || 'temp';
}

export function determineStatusBySensor(
  sensor: string,
  current: number
): Status {
  switch (sensor.toLowerCase()) {
    case 'temp':
      if (current >= 24 && current <= 27) return Status.GOOD;
      if ((current >= 23 && current < 24) || (current > 27 && current <= 28)) return Status.NORMAL;
      return Status.WARNING;

    case 'humidity':
      if (current >= 50 && current <= 70) return Status.GOOD;
      if ((current >= 40 && current < 50) || (current > 70 && current <= 80)) return Status.NORMAL;
      return Status.WARNING;

    case 'gas':
    case 'co2': // 백엔드에서 gas 로 올 수도 있음
      if (current <= 2000) return Status.GOOD;
      if (current > 2000 && current <= 2500) return Status.NORMAL;
      return Status.WARNING;

    default:
      return Status.GOOD; // 기본값
  }
}

export function getSensorDisplayName(sensorType: string): string {
  switch (sensorType) {
    case 'temp':
      return '🌡️ 온도';
    case 'humidity':
      return '💧 습도';
    case 'gas':
    case 'co2':
      return '🌬️ CO₂';
    default:
      return '📊 센서';
  }
}

export function getSensorUnit(sensorType: string): string {
  switch (sensorType) {
    case 'temp':
      return '℃';
    case 'humidity':
      return '%';
    case 'gas':
    case 'co2':
      return 'ppm';
    default:
      return '';
  }
}

export function getStatusDisplayName(status: string): string {
  switch (status.toLowerCase()) {
    case 'good':    return 'Good';
    case 'normal':  return 'Normal';
    case 'warning': return 'Warning';
    case 'critical':return 'Critical';
    default:        return 'Unknown';
  }
}

export function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case 'good':
      return '#34D399'; // 초록
    case 'normal':
      return '#D1D5DB'; // 회색
    case 'warning':
      return '#F87171'; // 빨강
    default:
      return '#D1D5DB';
  }
}


// 상태(라벨) 계산 보조
export function getTemperatureStatus(temperature: number): string {
  if (temperature < 15) return 'COLD';
  if (temperature < 20) return 'COOL';
  if (temperature < 28) return 'GOOD';
  if (temperature < 35) return 'WARM';
  return 'HOT';
}

export function getHumidityStatus(humidity: number): string {
  if (humidity < 30) return 'DRY';
  if (humidity < 40) return 'LOW';
  if (humidity < 70) return 'GOOD';
  if (humidity < 80) return 'HIGH';
  return 'WET';
}

export function getGasStatus(gas: number): string {
  if (gas < 400) return 'EXCELLENT';
  if (gas < 800) return 'GOOD';
  if (gas < 1500) return 'MODERATE';
  if (gas < 3000) return 'POOR';
  return 'DANGEROUS';
}

// 화면 출력 포맷터에서 사용
export function formatLogForDisplay(log: ControlLogEntity): FormattedLogData {
  const ts = normalizeIso(log.timestamp);  // ✅ 보정
  return {
    ...log,
    displayTime: new Date(ts).toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }),
    displaySensorType: getSensorDisplayName(log.sensor_type),
    displayUnit: getSensorUnit(log.sensor_type),
    displayStatus: getStatusDisplayName(log.status),
  };
}
