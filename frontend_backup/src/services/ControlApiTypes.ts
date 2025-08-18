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
  WARNING = 'warning',
  CRITICAL = 'critical',
}

// ===== 공통 유틸 =====
export function formatDateForApi(date: Date = new Date()): string {
  return date.toISOString().slice(0, 19);
}

export function mapSensorType(frontendType: SensorType | string): string {
  const mapping: Record<string, string> = {
    [SensorType.TEMP]: 'temp',
    [SensorType.HUMIDITY]: 'humidity',
    [SensorType.CO2]: 'gas', // CO2는 백엔드에서 'gas'로 처리
  };
  return mapping[frontendType] || 'temp';
}

export function determineStatus(
  current: number,
  target: number,
  threshold: number
): Status {
  if (current >= threshold) return Status.CRITICAL;
  if (Math.abs(current - target) > 2) return Status.WARNING;
  return Status.GOOD;
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
    case 'critical':
      return 'Critical';
    case 'warning':
      return 'Warning';
    case 'good':
    case 'normal':
      return 'Normal';
    default:
      return 'Unknown';
  }
}

export function getSensorIcon(sensorType: string): string {
  switch (sensorType) {
    case 'temp':
      return '🌡️';
    case 'humidity':
      return '💧';
    case 'gas':
    case 'co2':
      return '🌬️';
    default:
      return '📊';
  }
}

export function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case 'critical':
      return '#dc2626';
    case 'warning':
      return '#d97706';
    case 'good':
    case 'normal':
      return '#059669';
    default:
      return '#6b7280';
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

// 화면 출력용 포맷터
export function formatLogForDisplay(log: ControlLogEntity): FormattedLogData {
  return {
    ...log,
    displayTime: new Date(log.timestamp).toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
    }),
    displaySensorType: getSensorDisplayName(log.sensor_type),
    displayUnit: getSensorUnit(log.sensor_type),
    displayStatus: getStatusDisplayName(log.status),
  };
}
