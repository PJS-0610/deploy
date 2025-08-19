/**
 * AI 추천 모달 컴포넌트
 * 외부 환경 조건을 입력받아 최적 환경을 추천받는 모달
 */

import React, { useState } from 'react';
import { X, Thermometer, Droplets, Wind } from 'lucide-react';
import { recommendApi, type OptimalRecommendRequest } from '../../services/RecommendAPI';
import styles from './AIRecommendationModal.module.css';

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
  
  const [isLoading, setIsLoading] = useState(false);
  const [recommendation, setRecommendation] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleGetRecommendation = async () => {
    setIsLoading(true);
    setError(null);
    setRecommendation(null);

    try {
      // 입력값 검증 - 최소 하나는 입력되어야 함
      const hasInput = formData.external_temperature || 
                      formData.external_humidity || 
                      formData.external_air_quality;

      if (!hasInput) {
        setError('외부 환경 조건 중 최소 하나 이상을 입력해주세요.');
        return;
      }

      // API 요청 데이터 준비
      const requestData: OptimalRecommendRequest = {};
      
      if (formData.external_temperature) {
        requestData.external_temperature = parseFloat(formData.external_temperature);
      }
      if (formData.external_humidity) {
        requestData.external_humidity = parseFloat(formData.external_humidity);
      }
      if (formData.external_air_quality) {
        requestData.external_air_quality = parseFloat(formData.external_air_quality);
      }

      // API 호출
      const response = await recommendApi.getOptimal(requestData);

      if (response.success && response.data) {
        setRecommendation(response.data.answer);
      } else {
        setError(response.error || '추천을 받아오는데 실패했습니다.');
      }
    } catch (err) {
      setError('서버 연결에 실패했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  const parseRecommendationValues = (answer: string) => {
    // 추천 답변에서 수치 추출 - 실제 API 응답 형식에 맞게 개선
    const tempMatch = answer.match(/최적온도는?\s*(\d+(?:\.\d+)?)도/);
    const humidityMatch = answer.match(/최적습도는?\s*(\d+(?:\.\d+)?)%/);
    const co2Match = answer.match(/최적CO2?는?\s*(\d+(?:\.\d+)?)ppm/);

    return {
      temperature: tempMatch ? Math.round(parseFloat(tempMatch[1])) : 24,
      humidity: humidityMatch ? Math.round(parseFloat(humidityMatch[1])) : 50,
      co2: co2Match ? Math.round(parseFloat(co2Match[1])) : 400,
      answer
    };
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
                  className={styles.input}
                  min="-50"
                  max="60"
                />
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
                  className={styles.input}
                  min="0"
                  max="100"
                />
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
                  className={styles.input}
                  min="0"
                  max="10000"
                />
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