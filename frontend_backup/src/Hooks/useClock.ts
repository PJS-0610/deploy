import { useEffect, useState } from 'react';
import { DashboardUtils } from '../Services/DashboardTypes';

export function useClock() {
  const [now, setNow] = useState(DashboardUtils.getCurrentDateTime());

  useEffect(() => {
    const id = setInterval(() => {
      setNow(DashboardUtils.getCurrentDateTime());
    }, 60000); // 1분마다
    return () => clearInterval(id);
  }, []);

  return now;
}
