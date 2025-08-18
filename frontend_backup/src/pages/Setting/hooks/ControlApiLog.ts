// ControlApiLog.ts
import {
  ControlLogDto,
  ControlResponseDto,
  BatchControlResult,
  Status,
} from "../../../services/ControlApiTypes";


export class ControlLogService {
  private static readonly API_BASE_URL =
    process.env.REACT_APP_API_BASE_URL || '';
  private static readonly CONTROL_ENDPOINT = "/control";
  private static readonly API_KEY =
    process.env.REACT_APP_ADMIN_API_KEY || '';

  private static getHeaders(): HeadersInit {
    return {
      "X-API-Key": this.API_KEY,
      "Content-Type": "application/json",
    };
  }

  private static validateApiKey(): void {
    if (!this.API_KEY) {
      throw new Error("REACT_APP_ADMIN_API_KEY가 설정되지 않았습니다 (.env 확인).");
    }
  }

  /** 제어 로그 생성 */
  static async createControlLog(logData: ControlLogDto): Promise<ControlResponseDto> {
    this.validateApiKey();

    const payload = {
      timestamp: logData.timestamp || new Date().toISOString().slice(0, 19),
      sensor_type: logData.sensor_type,
      before_value: logData.before_value,
      status: logData.status,
      after_value: logData.after_value,
    };

    const response = await fetch(`${this.API_BASE_URL}${this.CONTROL_ENDPOINT}/log`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return (await response.json()) as ControlResponseDto;
  }

  /** 배치 제어 로그 전송 */
  static async createBatchControlLogs(settingsData: {
    temp: { current: number; target: number; threshold: number; status: Status };
    humidity: { current: number; target: number; threshold: number; status: Status };
    co2: { current: number; target: number; threshold: number; status: Status };
  }): Promise<BatchControlResult> {
    const results: ControlResponseDto[] = [];
    let successCount = 0;
    let failCount = 0;

    const sensors = [
      { type: "temp", data: settingsData.temp },
      { type: "humidity", data: settingsData.humidity },
      { type: "gas", data: settingsData.co2 },
    ];

    for (const sensor of sensors) {
      try {
        const log: ControlLogDto = {
          sensor_type: sensor.type,
          before_value: sensor.data.current,
          status: sensor.data.status,
          after_value: sensor.data.target,
        };
        const res = await this.createControlLog(log);
        results.push(res);
        successCount++;
      } catch {
        failCount++;
      }
    }

    return {
      success: failCount === 0,
      successCount,
      failCount,
      results,
    };
  }
}
