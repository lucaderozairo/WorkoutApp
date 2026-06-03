import { useState } from 'react';
import { Grid, Row, Column } from '@ui/layout';
import { Surface, Text, Divider } from '@ui/atoms';
import { Badge, Button } from '@ui/molecules';
import {
  ResponsiveContainer,
  ComposedChart, Bar, Line,
  BarChart,
  XAxis, YAxis, Tooltip,
  ReferenceLine,
} from 'recharts';
import { SparklineArea } from '@ui/patterns/charts/domain-charts';

const HOURLY_TEMP = [
  { x: '9am', y: 14 },
  { x: '11', y: 16 },
  { x: '1pm', y: 18 },
  { x: '3', y: 19 },
  { x: '5', y: 20 },
  { x: '7pm', y: 20 },
  { x: '9', y: 18 },
  { x: '11', y: 16 },
];

const DAILY_FORECAST = [
  { day: 'Mon', high: 18, low: 10, rain: 20 },
  { day: 'Tue', high: 15, low: 8, rain: 60 },
  { day: 'Wed', high: 12, low: 7, rain: 80 },
  { day: 'Thu', high: 14, low: 9, rain: 40 },
  { day: 'Fri', high: 17, low: 11, rain: 15 },
  { day: 'Sat', high: 19, low: 12, rain: 5 },
  { day: 'Sun', high: 16, low: 9, rain: 30 },
];

const HOURLY_PRECIP = [
  { hour: '9am', chance: 5 },
  { hour: '10', chance: 10 },
  { hour: '11', chance: 15 },
  { hour: '12', chance: 30 },
  { hour: '1pm', chance: 55 },
  { hour: '2', chance: 70 },
  { hour: '3', chance: 65 },
  { hour: '4', chance: 40 },
  { hour: '5pm', chance: 20 },
  { hour: '6', chance: 10 },
  { hour: '7', chance: 5 },
  { hour: '8pm', chance: 5 },
];

const AQI_DATA = { value: 42, label: 'Good', pm25: 12, pm10: 18, no2: 8, o3: 35 };

const NEXT_5_HOURS = [
  { hour: '4pm', icon: '⛅', temp: 19, rain: 10 },
  { hour: '5pm', icon: '🌤', temp: 18, rain: 15 },
  { hour: '6pm', icon: '☁️', temp: 17, rain: 35 },
  { hour: '7pm', icon: '🌦', temp: 16, rain: 60 },
  { hour: '8pm', icon: '🌧', temp: 15, rain: 75 },
];

export function HourlyForecastRow() {
  return (
    <Row justify="between">
      {NEXT_5_HOURS.map(({ hour, icon, temp, rain }) => (
        <Column key={hour} align="center" gap={1}>
          <Text size="caption" mono>{hour}</Text>
          <span>{icon}</span>
          <Text mono>{temp}°</Text>
          <Text size="caption" mono>{rain}%</Text>
        </Column>
      ))}
    </Row>
  );
}

export function DailyForecastChart() {
  return (
    <Column>
      <Text size="caption">Temperature (°C) &amp; Rain chance (%)</Text>
      <ResponsiveContainer width="100%" height={180}>
        <ComposedChart data={DAILY_FORECAST} margin={{ top: 8, right: 16, bottom: 0, left: -16 }}>
          <XAxis dataKey="day" tick={{ fontSize: 11 }} />
          <YAxis yAxisId="temp" domain={[0, 25]} tick={{ fontSize: 11 }} />
          <YAxis yAxisId="rain" orientation="right" domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
          <Tooltip formatter={(val, name) => name === 'rain' ? `${val}%` : `${val}°C`} />
          <Bar yAxisId="temp" dataKey="high" fill="var(--color-warning)" radius={[3, 3, 0, 0]} name="high" />
          <Bar yAxisId="temp" dataKey="low" fill="var(--color-info)" radius={[3, 3, 0, 0]} name="low" />
          <Line yAxisId="rain" type="monotone" dataKey="rain" stroke="var(--color-swim)" strokeWidth={2} dot={false} name="rain" />
        </ComposedChart>
      </ResponsiveContainer>
      <Row gap={1}>
        <Badge className="run caption">High</Badge>
        <Badge className="swim caption">Low</Badge>
        <Text size="caption">— Rain</Text>
      </Row>
    </Column>
  );
}

export function PrecipitationChart() {
  return (
    <Column>
      <Text size="caption">Hourly rain chance (%)</Text>
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={HOURLY_PRECIP} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
          <XAxis dataKey="hour" tick={{ fontSize: 11 }} />
          <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
          <Tooltip formatter={(v) => `${v}%`} />
          <ReferenceLine y={50} stroke="var(--color-text-secondary)" strokeDasharray="4 2" />
          <Bar dataKey="chance" fill="var(--color-swim)" fillOpacity={0.7} radius={[3, 3, 0, 0]} name="Rain chance" />
        </BarChart>
      </ResponsiveContainer>
    </Column>
  );
}

export function AirQualityPanel() {
  const { value, label, pm25, pm10, no2, o3 } = AQI_DATA;
  const badgeClass = value < 50 ? 'green' : value < 100 ? 'amber' : 'coral';
  return (
    <Column>
      <Row align="center">
        <Text as="h2">{value}</Text>
        <Column gap={1}>
          <Badge className={badgeClass}>{label}</Badge>
          <Text size="caption">AQI</Text>
        </Column>
      </Row>
      <Grid cols={4}>
        <Surface className="centered"><Column>
          <Text size="caption">PM2.5</Text>
          <Text>{pm25}</Text>
        </Column></Surface>
        <Surface className="centered"><Column>
          <Text size="caption">PM10</Text>
          <Text>{pm10}</Text>
        </Column></Surface>
        <Surface className="centered"><Column>
          <Text size="caption">NO₂</Text>
          <Text>{no2}</Text>
        </Column></Surface>
        <Surface className="centered"><Column>
          <Text size="caption">O₃</Text>
          <Text>{o3}</Text>
        </Column></Surface>
      </Grid>
    </Column>
  );
}

type DetailTab = 'forecast' | 'precip' | 'aqi';

export function WeatherWidget() {
  const [detailOpen, setDetailOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<DetailTab>('forecast');

  return (
    <>
      <Surface><Column>
        <Row justify="between" align="center">
          <Text size="caption">Kingston, UK</Text>
          <Text size="caption">15m ago</Text>
        </Row>

        <Row justify="between">
          <Column justify="between" align="start">
            <Text as="h1">⛅</Text>
            <Text size="detail">Partly Cloudy</Text>
          </Column>
          <Column justify="between" align="end">
            <Text>18°</Text>
            <Text size="caption">Feels like 16° · Humidity 62%</Text>
          </Column>
        </Row>

        <Divider />
        <HourlyForecastRow />
        <Divider />

        <div className="grid">
          <Column gap={1}>
            <Text size="caption">UV Index</Text>
            <Text>4</Text>
            <Badge className="green">Moderate</Badge>
          </Column>
          <Column gap={1}>
            <Text size="caption">Wind</Text>
            <Text>14 km/h</Text>
            <Badge className="blue">SW</Badge>
          </Column>
          <Column gap={1}>
            <Text size="caption">Rain chance</Text>
            <Text>20%</Text>
            <Badge className="amber">Low</Badge>
          </Column>
          <Column gap={1}>
            <Text size="caption">Visibility</Text>
            <Text>12 km</Text>
            <Badge className="green">Clear</Badge>
          </Column>
        </div>

        <Divider />
        <Row justify="between" align="center" gap={1}>
          <Column>
            <Text size="caption">Run conditions</Text>
            <Text size="detail">Good — mild temp, low wind</Text>
          </Column>
          <Badge className="green">Go</Badge>
        </Row>
      </Column></Surface>

      {detailOpen && (
        <div className="modal-overlay" onClick={() => setDetailOpen(false)}>
          <div onClick={(e: React.MouseEvent) => e.stopPropagation()}>
            <Surface as="section"><Column>
              <Row as="header" justify="between" align="center">
                <Text as="h3">Weather Detail</Text>
                <Button variant="ghost" size="icon" onClick={() => setDetailOpen(false)}>✕</Button>
              </Row>

              <Row className="tabs">
                <button
                  className={`tab${activeTab === 'forecast' ? ' active' : ''}`}
                  onClick={() => setActiveTab('forecast')}
                >7-Day</button>
                <button
                  className={`tab${activeTab === 'precip' ? ' active' : ''}`}
                  onClick={() => setActiveTab('precip')}
                >Rain</button>
                <button
                  className={`tab${activeTab === 'aqi' ? ' active' : ''}`}
                  onClick={() => setActiveTab('aqi')}
                >Air</button>
              </Row>

              {activeTab === 'forecast' && <DailyForecastChart />}
              {activeTab === 'precip' && <PrecipitationChart />}
              {activeTab === 'aqi' && <AirQualityPanel />}
            </Column></Surface>
          </div>
        </div>
      )}
    </>
  );
}
