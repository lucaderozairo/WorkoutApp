import {
  WeatherWidget,
  DailyForecastChart,
  PrecipitationChart,
  AirQualityPanel,
} from '@ui/components/widgets/WeatherWidget';
import { Tabs } from '@ui/molecules';
import { Grid } from '@ui/layout';
import { Surface, Text } from '@ui/atoms';
import { useWeatherScreen } from './useWeatherScreen';

const WEATHER_TABS = [
  { id: 'forecast', label: '7-Day Forecast' },
  { id: 'precip', label: 'Rain' },
  { id: 'aqi', label: 'Air Quality' },
] as const;

export function WeatherScreen() {
  const { activeTab, setActiveTab } = useWeatherScreen();

  return (
    <Grid>
      <Text as="h2">Weather</Text>

      <WeatherWidget />

      <Surface className="column">
        <Tabs items={[...WEATHER_TABS]} value={activeTab} onChange={setActiveTab} />

        {activeTab === 'forecast' && <DailyForecastChart />}
        {activeTab === 'precip' && <PrecipitationChart />}
        {activeTab === 'aqi' && <AirQualityPanel />}
      </Surface>
    </Grid>
  );
}
