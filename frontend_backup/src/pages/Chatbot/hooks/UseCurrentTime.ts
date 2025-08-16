// hooks/useCurrentTime.ts
import { useState, useEffect } from 'react';

// 현재 시간 포맷팅
const getCurrentDateTime = (): string => {
  const now = new Date();
  return `${now.getFullYear()}년 ${String(now.getMonth() + 1).padStart(2, '0')}월 ${String(now.getDate()).padStart(2, '0')}일 ${String(now.getHours()).padStart(2, '0')}시 ${String(now.getMinutes()).padStart(2, '0')}분`;
};

export const useCurrentTime = () => {
  const [currentTime, setCurrentTime] = useState(getCurrentDateTime());

  useEffect(() => {
    const timeInterval = setInterval(() => {
      setCurrentTime(getCurrentDateTime());
    }, 60000); // 1분마다 업데이트

    return () => clearInterval(timeInterval);
  }, []);

  return currentTime;
};