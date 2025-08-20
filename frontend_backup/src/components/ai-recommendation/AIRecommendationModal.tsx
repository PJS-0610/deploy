/**
 * AI 추천 모달 컴포넌트
 * 외부 환경 조건을 입력받아 최적 환경을 추천받는 모달
 */

import React, { useState } from 'react';
import { X, Thermometer, Droplets, Wind } from 'lucide-react';
import { recommendApi, type OptimalRecommendRequest } from '../../services/RecommendAPI';
import styles from './AIRecommendationModal.module.css';

// Window 타입 확장
declare global {
  interface Window {
    lastParsedRecommendations?: {
      optimal_temperature?: number;
      optimal_humidity?: number;
      optimal_co2?: number;
      current_temperature?: number;
      current_humidity?: number;
      current_co2?: number;
    };
  }
}

interface AIRecommendationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyRecommendation: (recommendation: {
    temperature: number;
    humidity: number;
    co2: number;
    answer: string;
  }) => void;
}

interface FormData {
  external_temperature: string;
  external_humidity: string;
  external_air_quality: string;
}

interface ValidationState {
  external_temperature: string | null;
  external_humidity: string | null;
  external_air_quality: string | null;
}

const AIRecommendationModal: React.FC<AIRecommendationModalProps> = ({
  isOpen,
  onClose,
  onApplyRecommendation,
}) => {
  const [formData, setFormData] = useState<FormData>({
    external_temperature: '',
    external_humidity: '',
    external_air_quality: '',
  });

  const [validation, setValidation] = useState<ValidationState>({
    external_temperature: null,
    external_humidity: null,
    external_air_quality: null,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [recommendation, setRecommendation] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const validateField = (field: keyof FormData, value: string): string | null => {
    if (!value.trim()) return null;

    const num = parseFloat(value);
    if (isNaN(num)) return '유효한 숫자를 입력해주세요.';

    switch (field) {
      case 'external_temperature':
        if (num < -50 || num > 60) return '온도는 -50°C ~ 60°C 범위 내에서 입력해주세요.';
        break;
      case 'external_humidity':
        if (num < 0 || num > 100) return '습도는 0% ~ 100% 범위 내에서 입력해주세요.';
        break;
      case 'external_air_quality':
        if (num < 0 || num > 10000) return '공기질은 0ppm ~ 10000ppm 범위 내에서 입력해주세요.';
        break;
    }
    return null;
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    // 빈 문자열이거나 숫자(소수점 포함) 형태만 허용
    if (value === '' || /^-?\d*\.?\d*$/.test(value)) {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));

      // 실시간 유효성 검증
      const validationError = validateField(field, value);
      setValidation(prev => ({
        ...prev,
        [field]: validationError
      }));

      // 전체 에러 메시지 초기화
      if (error) setError(null);
    }
  };

  const handleGetRecommendation = async () => {
    setIsLoading(true);
    setError(null);
    setRecommendation(null);

    try {
      // 입력값 검증 및 변환
      const requestData: OptimalRecommendRequest = {};
      let hasValidInput = false;

      // 온도 검증
      if (formData.external_temperature.trim()) {
        const temp = parseFloat(formData.external_temperature);
        if (isNaN(temp)) {
          setError('온도는 유효한 숫자를 입력해주세요.');
          return;
        }
        if (temp < -50 || temp > 60) {
          setError('온도는 -50°C ~ 60°C 범위 내에서 입력해주세요.');
          return;
        }
        requestData.external_temperature = temp;
        hasValidInput = true;
      }

      // 습도 검증
      if (formData.external_humidity.trim()) {
        const humidity = parseFloat(formData.external_humidity);
        if (isNaN(humidity)) {
          setError('습도는 유효한 숫자를 입력해주세요.');
          return;
        }
        if (humidity < 0 || humidity > 100) {
          setError('습도는 0% ~ 100% 범위 내에서 입력해주세요.');
          return;
        }
        requestData.external_humidity = humidity;
        hasValidInput = true;
      }

      // 공기질 검증
      if (formData.external_air_quality.trim()) {
        const airQuality = parseFloat(formData.external_air_quality);
        if (isNaN(airQuality)) {
          setError('공기질은 유효한 숫자를 입력해주세요.');
          return;
        }
        if (airQuality < 0 || airQuality > 10000) {
          setError('공기질은 0ppm ~ 10000ppm 범위 내에서 입력해주세요.');
          return;
        }
        requestData.external_air_quality = airQuality;
        hasValidInput = true;
      }

      if (!hasValidInput) {
        setError('외부 환경 조건 중 최소 하나 이상을 입력해주세요.');
        return;
      }

      // API 호출 (개선된 에러 처리)
      console.log('🔥 API 호출 시작:', requestData);
      const response = await recommendApi.getOptimal(requestData);
      console.log('🔥 API 응답 전체:', response);

      if (response.success && response.data) {
        console.log('🔥 API 응답 데이터:', response.data);
        console.log('🔥 답변:', response.data.answer);
        console.log('🔥 파싱된 추천값:', response.data.parsed_recommendations);

        setRecommendation(response.data.answer);
        // 파싱된 추천값도 저장
        if (response.data.parsed_recommendations) {
          window.lastParsedRecommendations = response.data.parsed_recommendations;
          console.log('🔥 window에 저장된 파싱값:', window.lastParsedRecommendations);
        }
      } else {
        console.error('🔥 API 호출 실패:', response);

        // 개선된 에러 메시지 처리
        let errorMessage = response.error || '추천을 받아오는데 실패했습니다.';

        // 특정 에러에 대한 사용자 친화적 메시지
        if (errorMessage.includes('API 키')) {
          errorMessage = '인증에 실패했습니다. 관리자에게 문의하세요.';
        } else if (errorMessage.includes('요청 한도')) {
          errorMessage = 'API 요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.';
        } else if (errorMessage.includes('서버')) {
          errorMessage = '서버에 문제가 발생했습니다. 잠시 후 다시 시도해주세요.';
        }

        setError(errorMessage);
      }
    } catch (err) {
      console.error('🔥 예상치 못한 에러:', err);
      setError('네트워크 연결을 확인하고 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  const parseRecommendationValues = (answer: string) => {
  console.log('🔥 파싱 시작 - 답변:', answer);

  // 1) 답변 문자열에서 정규식 매칭
  const tempMatch = answer.match(/최적온도는?\s*([\d.]+)도/);
  const humidityMatch = answer.match(/최적습도는?\s*([\d.]+)%/);
  const co2Match = answer.match(/최적CO2는?\s*([\d.]+)ppm/);

  // 2) RecommendAPI가 window에 넣어둔 파싱 결과 사용
  const parsedRecs = window.lastParsedRecommendations;

  // 3) null 병합(??)로 "있으면 그 값, 없으면 대체" 로직
  const temperature = Math.round(
    (parsedRecs?.optimal_temperature) ??
    (tempMatch ? parseFloat(tempMatch[1]) :
      (parsedRecs?.current_temperature ?? 24))
  );

  const humidity = Math.round(
    (parsedRecs?.optimal_humidity) ??
    (humidityMatch ? parseFloat(humidityMatch[1]) :
      (parsedRecs?.current_humidity ?? 50))
  );

  const co2 = Math.round(
    (parsedRecs?.optimal_co2) ??
    (co2Match ? parseFloat(co2Match[1]) :
      (parsedRecs?.current_co2 ?? 400))
  );

  const result = { temperature, humidity, co2, answer };
  console.log('🔥 최종 파싱 결과:', result);
  return result;
};

  const handleApply = () => {
    if (recommendation) {
      const values = parseRecommendationValues(recommendation);
      onApplyRecommendation(values);
      onClose();
    }
  };

  const handleReset = () => {
    setFormData({
      external_temperature: '',
      external_humidity: '',
      external_air_quality: '',
    });
    setValidation({
      external_temperature: null,
      external_humidity: null,
      external_air_quality: null,
    });
    setRecommendation(null);
    setError(null);
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>AI 환경 추천</h2>
          <button
            className={styles.closeButton}
            onClick={onClose}
            aria-label="닫기"
          >
            <X size={20} />
          </button>
        </div>

        <div className={styles.modalBody}>
          <div className={styles.inputSection}>
            <h3 className={styles.sectionTitle}>외부 환경 조건 입력</h3>
            <p className={styles.sectionDescription}>
              현재 외부 환경 조건을 입력하면 AI가 최적의 실내 환경을 추천해드립니다.
              (최소 1개 이상 입력 필요)
            </p>

            <div className={styles.inputGrid}>
              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>
                  <Thermometer size={16} />
                  외부 온도 (°C)
                </label>
                <input
                  type="number"
                  value={formData.external_temperature}
                  onChange={(e) => handleInputChange('external_temperature', e.target.value)}
                  placeholder="예: 30"
                  className={`${styles.input} ${validation.external_temperature ? styles.inputError : ''}`}
                  min="-50"
                  max="60"
                />
                {validation.external_temperature && (
                  <div className={styles.fieldError}>{validation.external_temperature}</div>
                )}
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>
                  <Droplets size={16} />
                  외부 습도 (%)
                </label>
                <input
                  type="number"
                  value={formData.external_humidity}
                  onChange={(e) => handleInputChange('external_humidity', e.target.value)}
                  placeholder="예: 70"
                  className={`${styles.input} ${validation.external_humidity ? styles.inputError : ''}`}
                  min="0"
                  max="100"
                />
                {validation.external_humidity && (
                  <div className={styles.fieldError}>{validation.external_humidity}</div>
                )}
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>
                  <Wind size={16} />
                  외부 공기질 (CO2 ppm)
                </label>
                <input
                  type="number"
                  value={formData.external_air_quality}
                  onChange={(e) => handleInputChange('external_air_quality', e.target.value)}
                  placeholder="예: 1400"
                  className={`${styles.input} ${validation.external_air_quality ? styles.inputError : ''}`}
                  min="0"
                  max="10000"
                />
                {validation.external_air_quality && (
                  <div className={styles.fieldError}>{validation.external_air_quality}</div>
                )}
              </div>
            </div>
          </div>

          {error && (
            <div className={styles.errorMessage}>
              {error}
            </div>
          )}

          {recommendation && (
            <div className={styles.recommendationSection}>
              <h3 className={styles.sectionTitle}>AI 추천 결과</h3>
              <div className={styles.recommendationBox}>
                {recommendation}
              </div>
            </div>
          )}
        </div>

        <div className={styles.modalFooter}>
          <button
            onClick={handleReset}
            className={`${styles.button} ${styles.buttonSecondary}`}
            disabled={isLoading}
          >
            초기화
          </button>

          <button
            onClick={handleGetRecommendation}
            className={`${styles.button} ${styles.buttonPrimary}`}
            disabled={isLoading}
          >
            {isLoading ? '추천 받는 중...' : 'AI 추천 받기'}
          </button>

          {recommendation && (
            <button
              onClick={handleApply}
              className={`${styles.button} ${styles.buttonSuccess}`}
            >
              추천값 적용
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIRecommendationModal;