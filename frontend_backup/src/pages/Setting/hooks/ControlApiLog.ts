// ControlApiLog.ts
import {
  ControlLogDto,
  ControlResponseDto,
  BatchControlResult,
  Status,
} from "../../../services/ControlApiTypes";


export class ControlLogService {
  private static readonly API_BASE_URL =
    process.env.REACT_APP_CONTROL_API_BASE_URL
    || process.env.REACT_APP_API_BASE_URL
    || (window.location.hostname === 'localhost'
          ? 'http://localhost:3001'  // 로컬 개발용 - 3001로 수정
          : 'https://aws2aws2.com'); // 실제 AWS API URL

  private static readonly NORMALIZED_BASE_URL =
    ControlLogService.API_BASE_URL.replace(/\/+$/, '');

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
      timestamp: logData.timestamp || new Date().toISOString(),
      sensor_type: logData.sensor_type,
      before_value: logData.before_value,
      status: logData.status,
      after_value: logData.after_value,
    };

    // ✅ 절대경로로 보장
    const url = `${this.NORMALIZED_BASE_URL}${this.CONTROL_ENDPOINT}/log`;


    const response = await fetch(url, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
    });
    

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
    }
    
    const result = await response.json();
    return result as ControlResponseDto;
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
      { type: "gas", data: settingsData.co2 }, // 백엔드는 'gas'를 받음
    ];

    for (const sensor of sensors) {
      try {
        const log: ControlLogDto = {
          timestamp: new Date().toISOString(),  // ← 반드시 포함
          sensor_type: sensor.type,
          before_value: sensor.data.current,
          status: sensor.data.status,
          after_value: sensor.data.target || sensor.data.current, // target이 0이면 current 값 사용
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
