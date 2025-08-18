// 환경 제어 서비스

import { Injectable, BadRequestException, Logger, OnModuleInit } from '@nestjs/common';
import { EnvironmentControlDto, ControlResponseDto, ControlLogSummaryDto } from './dto/control.dto';
import { DynamoDBControlDatabase } from './entities/dynamodb-control.entity';
import { IoTService } from './services/iot.service';

@Injectable()
export class ControlService implements OnModuleInit {
  private readonly logger = new Logger(ControlService.name);
  private readonly controlDb: DynamoDBControlDatabase;
  private readonly iotService: IoTService;

  constructor() {
    this.controlDb = new DynamoDBControlDatabase();
    this.iotService = new IoTService();
  }

  async onModuleInit() {
    // 서비스 초기화 시 IoT 설정 검증
    const isIoTConfigValid = this.iotService.validateConfiguration();
    if (!isIoTConfigValid) {
      this.logger.warn('IoT 설정이 올바르지 않습니다. 환경변수를 확인하세요.');
    }
  }

  /**
   * 환경 제어 명령 처리
   */
  async processEnvironmentControl(controlDto: EnvironmentControlDto): Promise<ControlResponseDto> {
    const { temperature, humidity, gas } = controlDto;
    const controlLogs: ControlLogSummaryDto[] = [];
    let iotMessagesSent = 0;

    try {
      // 각 센서별로 제어 처리
      const sensors = [
        { type: 'temp', value: temperature, unit: '°C' },
        { type: 'humidity', value: humidity, unit: '%' },
        { type: 'gas', value: gas, unit: 'ppm' }
      ];

      for (const sensor of sensors) {
        try {
          // 제어 로그 생성
          const controlLog = await this.createControlLog(
            sensor.type,
            sensor.value,
            sensor.unit
          );

          // DynamoDB에 저장
          const savedLog = await this.controlDb.create(controlLog);
          
          // IoT Core로 전송
          await this.iotService.publishControlMessage(savedLog);
          
          controlLogs.push({
            id: savedLog.id,
            sensor_type: savedLog.sensor_type,
            result: savedLog.result
          });
          
          iotMessagesSent++;
          
          this.logger.log(
            `제어 명령 처리 완료: ${sensor.type} = ${sensor.value}${sensor.unit}`
          );
          
        } catch (error) {
          this.logger.error(`센서 ${sensor.type} 제어 실패:`, error);
          // 개별 센서 실패는 전체 실패로 이어지지 않음
          controlLogs.push({
            id: '',
            sensor_type: sensor.type,
            result: 'FAILED'
          });
        }
      }

      return {
        success: true,
        controlLogs,
        iotMessagesSent
      };

    } catch (error) {
      this.logger.error('환경 제어 처리 실패:', error);
      throw new BadRequestException('환경 제어 처리에 실패했습니다.');
    }
  }

  /**
   * 제어 로그 데이터 생성
   */
  private async createControlLog(sensorType: string, value: number, unit: string) {
    const timestamp = new Date().toISOString().slice(0, 19); // 2025-08-18T14:59:00
    const id = await this.controlDb.getNextControlId(); // 순차 ID 생성
    
    // 현재값 대비 액션 및 상태 판단 (시뮬레이션)
    const currentValue = await this.getCurrentSensorValue(sensorType);
    const action = this.calculateAction(currentValue, value);
    const status = this.determineStatus(value, sensorType);

    return {
      id,
      timestamp,
      sensor_type: sensorType,
      value: parseFloat(value.toFixed(1)),
      status,
      action,
      result: 'OK'
    };
  }

  /**
   * 현재 센서 값 조회 (시뮬레이션)
   */
  private async getCurrentSensorValue(sensorType: string): Promise<number> {
    // 실제로는 최신 센서 데이터를 S3나 다른 소스에서 조회
    const mockCurrentValues = {
      'temp': 27.0,
      'humidity': 45.0,
      'gas': 350.0
    };
    
    return mockCurrentValues[sensorType] || 0;
  }

  /**
   * 액션 계산 (현재값 vs 목표값)
   */
  private calculateAction(currentValue: number, targetValue: number): string {
    const diff = currentValue - targetValue;
    
    if (Math.abs(diff) < 0.5) {
      return 'maintain';
    }
    
    if (diff > 0) {
      return `↓ ${Math.abs(diff).toFixed(1)}`;
    } else {
      return `↑ ${Math.abs(diff).toFixed(1)}`;
    }
  }

  /**
   * 상태 판단
   */
  private determineStatus(value: number, sensorType: string): string {
    const ranges = {
      'temp': { good: [20, 28], warning: [15, 35] },
      'humidity': { good: [40, 70], warning: [20, 90] },
      'gas': { good: [0, 400], warning: [400, 800] }
    };

    const range = ranges[sensorType];
    if (!range) return 'unknown';

    if (value >= range.good[0] && value <= range.good[1]) {
      return 'good';
    } else if (value >= range.warning[0] && value <= range.warning[1]) {
      return 'warning';
    } else {
      return 'critical';
    }
  }
}