import { useState } from 'react';

export type DetailTab = 'forecast' | 'precip' | 'aqi';

export function useWeatherScreen() {
  const [activeTab, setActiveTab] = useState<DetailTab>('forecast');
  return { activeTab, setActiveTab };
}
