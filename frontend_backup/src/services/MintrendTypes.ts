/**
 * ═══════════════════════════════════════════════════════════════
 * 📈 MintrendTypes - Mintrend 관련 타입 정의 및 API 서비스
 * ═══════════════════════════════════════════════════════════════
 */

// ============================================
// 📊 Mintrend 데이터 인터페이스
// ============================================

export interface MintrendData {
  timestamp: string;
  mintemp: number;    // 최소 온도
  minhum: number;     // 최소 습도
  mingas: number;     // 최소 가스 농도
}

export interface MintrendResponse {
  filename: string;
  data: MintrendData;
  status: 'success' | 'error';
  message?: string;
}

// ============================================
// 🛠️ Mintrend 서비스 클래스
// ============================================

export class MintrendService {
  private static readonly BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001';
  private static readonly MINTREND_ENDPOINT = '/mintrend/latest';

  /**
   * 최신 Mintrend 데이터 가져오기
   */
  static async getLatestMintrendData(): Promise<MintrendResponse> {
    try {
      const response = await fetch(`${this.BASE_URL}${this.MINTREND_ENDPOINT}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // 데이터 유효성 검사
      if (!this.validateMintrendData(data)) {
        throw new Error('잘못된 Mintrend 데이터 형식');
      }
      
      return data;
    } catch (error) {
      console.error('Mintrend 데이터 가져오기 실패:', error);
      
      // 🔧 개발용 더미 데이터 반환
      return this.generateMockMintrendData();
    }
  }

  /**
   * 특정 날짜의 Mintrend 데이터 가져오기
   */
  static async getMintrendDataByDate(date: string): Promise<MintrendResponse> {
    try {
      const response = await fetch(`${this.BASE_URL}/mintrend/date/${date}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`Mintrend 데이터 가져오기 실패 (${date}):`, error);
      throw error;
    }
  }

  /**
   * Mintrend 데이터 히스토리 가져오기
   */
  static async getMintrendHistory(days: number = 7): Promise<MintrendResponse[]> {
    try {
      const response = await fetch(`${this.BASE_URL}/mintrend/history?days=${days}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Mintrend 히스토리 가져오기 실패:', error);
      throw error;
    }
  }

  /**
   * 🔧 데이터 유효성 검사
   */
  private static validateMintrendData(data: any): boolean {
    if (!data || typeof data !== 'object') return false;
    if (!data.filename || typeof data.filename !== 'string') return false;
    if (!data.data || typeof data.data !== 'object') return false;
    
    const { timestamp, mintemp, minhum, mingas } = data.data;
    
    return (
      typeof timestamp === 'string' &&
      typeof mintemp === 'number' &&
      typeof minhum === 'number' &&
      typeof mingas === 'number'
    );
  }

  /**
   * 🔧 개발용 더미 Mintrend 데이터 생성
   */
  private static generateMockMintrendData(): MintrendResponse {
    const now = new Date();
    const filename = `mintrend_${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}.json`;
    
    return {
      filename,
      data: {
        timestamp: now.toISOString(),
        mintemp: 20.5 + Math.random() * 5,     // 20.5 ~ 25.5°C
        minhum: 45 + Math.random() * 15,       // 45 ~ 60%
        mingas: 500 + Math.random() * 200,     // 500 ~ 700 ppm
      },
      status: 'success',
      message: '더미 데이터로 생성됨',
    };
  }

  /**
   * 온도 상태 문자열 반환
   */
  static getTemperatureStatus(temp: number): string {
    if (temp < 15) return '🥶 매우 낮음';
    if (temp < 20) return '❄️ 낮음';
    if (temp < 25) return '🌡️ 적정';
    if (temp < 30) return '🌡️ 높음';
    return '🔥 매우 높음';
  }

  /**
   * 습도 상태 문자열 반환
   */
  static getHumidityStatus(humidity: number): string {
    if (humidity < 30) return '🏜️ 건조';
    if (humidity < 40) return '📉 낮음';
    if (humidity < 60) return '💧 적정';
    if (humidity < 70) return '📈 높음';
    return '💦 매우 높음';
  }

  /**
   * 가스 농도 상태 문자열 반환
   */
  static getGasStatus(gas: number): string {
    if (gas < 400) return '🌿 매우 좋음';
    if (gas < 600) return '✅ 좋음';
    if (gas < 800) return '⚠️ 보통';
    if (gas < 1000) return '🔶 주의';
    return '🚨 위험';
  }

  /**
   * 상태에 따른 색상 클래스 반환
   */
  static getStatusColor(type: 'temp' | 'humidity' | 'gas', value: number): string {
    switch (type) {
      case 'temp':
        if (value < 15 || value > 30) return 'status-danger';
        if (value < 18 || value > 28) return 'status-warning';
        return 'status-good';
        
      case 'humidity':
        if (value < 30 || value > 70) return 'status-danger';
        if (value < 40 || value > 60) return 'status-warning';
        return 'status-good';
        
      case 'gas':
        if (value > 1000) return 'status-danger';
        if (value > 800) return 'status-warning';
        return 'status-good';
        
      default:
        return 'status-good';
    }
  }

  /**
   * 데이터 변화율 계산
   */
  static calculateChangeRate(current: number, previous: number): {
    rate: number;
    trend: 'up' | 'down' | 'stable';
    emoji: string;
  } {
    const rate = Math.abs(((current - previous) / previous) * 100);
    const trend = current > previous ? 'up' : current < previous ? 'down' : 'stable';
    
    let emoji = '➡️';
    if (trend === 'up') emoji = '⬆️';
    if (trend === 'down') emoji = '⬇️';
    
    return { rate, trend, emoji };
  }

  /**
   * 날짜 포맷팅 (YYYY-MM-DD)
   */
  static formatDate(date: Date | string): string {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  }

  /**
   * 시간 포맷팅 (HH:MM)
   */
  static formatTime(date: Date | string): string {
    const d = new Date(date);
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    
    return `${hours}:${minutes}`;
  }

  /**
   * 상대적 시간 계산
   */
  static getRelativeTime(timestamp: string): string {
    const now = new Date();
    const past = new Date(timestamp);
    const diffMs = now.getTime() - past.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return '방금 전';
    if (diffMins < 60) return `${diffMins}분 전`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}시간 전`;
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}일 전`;
    
    const diffWeeks = Math.floor(diffDays / 7);
    return `${diffWeeks}주 전`;
  }
}