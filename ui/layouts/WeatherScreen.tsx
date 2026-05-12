import { useState } from 'react';
import {
  WeatherWidget,
  DailyForecastChart,
  PrecipitationChart,
  AirQualityPanel,
} from '@ui/components/widgets/WeatherWidget';

type DetailTab = 'forecast' | 'precip' | 'aqi';

export function WeatherScreen() {
  const [activeTab, setActiveTab] = useState<DetailTab>('forecast');

  return (
    <div className="column">
      <h2>Weather</h2>

      <WeatherWidget />

      <div className="surface column">
        <div className="tabs row">
          <button
            className={`tab${activeTab === 'forecast' ? ' active' : ''}`}
            onClick={() => setActiveTab('forecast')}
          >7-Day Forecast</button>
          <button
            className={`tab${activeTab === 'precip' ? ' active' : ''}`}
            onClick={() => setActiveTab('precip')}
          >Rain</button>
          <button
            className={`tab${activeTab === 'aqi' ? ' active' : ''}`}
            onClick={() => setActiveTab('aqi')}
          >Air Quality</button>
        </div>

        {activeTab === 'forecast' && <DailyForecastChart />}
        {activeTab === 'precip' && <PrecipitationChart />}
        {activeTab === 'aqi' && <AirQualityPanel />}
      </div>
    </div>
  );
}
