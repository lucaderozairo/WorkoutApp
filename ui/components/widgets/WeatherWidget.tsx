import { useState } from 'react';
import { Grid, Row, Column } from '@ui/layout';
import { Surface } from '@ui/atoms';
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
                    <span className="mono caption">{hour}</span>
                    <span>{icon}</span>
                    <span className="mono">{temp}°</span>
                    <span className="mono caption">{rain}%</span>
                </Column>
            ))}
        </Row>
    );
}

export function DailyForecastChart() {
    return (
        <Column>
            <p className="caption">Temperature (°C) &amp; Rain chance (%)</p>
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
                <span className="pill run caption">High</span>
                <span className="pill swim caption">Low</span>
                <span className="caption">— Rain</span>
            </Row>
        </Column>
    );
}

export function PrecipitationChart() {
    return (
        <Column>
            <p className="caption">Hourly rain chance (%)</p>
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
    const badgeClass = value < 50 ? 'badge green' : value < 100 ? 'badge amber' : 'badge coral';
    return (
        <Column>
            <Row align="center">
                <h2>{value}</h2>
                <Column gap={1}>
                    <span className={badgeClass}>{label}</span>
                    <span className="caption">AQI</span>
                </Column>
            </Row>
            <Grid cols={4}>
                <Surface className="centered"><Column>
                    <span className="caption">PM2.5</span>
                    <p>{pm25}</p>
                </Column></Surface>
                <Surface className="centered"><Column>
                    <span className="caption">PM10</span>
                    <p>{pm10}</p>
                </Column></Surface>
                <Surface className="centered"><Column>
                    <span className="caption">NO₂</span>
                    <p>{no2}</p>
                </Column></Surface>
                <Surface className="centered"><Column>
                    <span className="caption">O₃</span>
                    <p>{o3}</p>
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
                    <span className="caption">Kingston, UK</span>
                    <span className='caption'>15m ago</span>
                    {/* <div className="row compact align-center">
                        <button className="ghost icon" onClick={() => setDetailOpen(true)}>›</button>
                    </div> */}
                </Row>

                <Row justify="between">
                    <Column justify="between" align="start">
                        <h1>⛅</h1>
                        <span className="detail">Partly Cloudy</span>
                    </Column>
                    <Column justify="between" align="end">
                        <p>18°</p>
                        <span className="caption">Feels like 16° · Humidity 62%</span>
                    </Column>
                </Row>

                {/* <SparklineArea
                    data={HOURLY_TEMP}
                    color="var(--color-rowing)"
                    height={60}
                    id="weather-temp"
                    showXAxis
                    showTooltip
                    tooltipFormatter={(v) => `${v}°C`}
                /> */}
                <hr></hr>
                <HourlyForecastRow />
                <hr></hr>
                <div className=" grid">
                    <Column gap={1}>
                        <span className="caption">UV Index</span>
                        <p>4</p>
                        <span className="badge green">Moderate</span>
                    </Column>
                    <Column gap={1}>
                        <span className="caption">Wind</span>
                        <p>14 km/h</p>
                        <span className="badge blue">SW</span>
                    </Column>
                    <Column gap={1}>
                        <span className="caption">Rain chance</span>
                        <p>20%</p>
                        <span className="badge amber">Low</span>
                    </Column>
                    <Column gap={1}>
                        <span className="caption">Visibility</span>
                        <p>12 km</p>
                        <span className="badge green">Clear</span>
                    </Column>
                </div>
                <hr />
                <Row justify="between" align="center" gap={1}>
                    <Column>
                        <span className="caption">Run conditions</span>
                        <span className="detail">Good — mild temp, low wind</span>
                    </Column>
                    <span className="badge green">Go</span>
                </Row>
            </Column></Surface>

            {detailOpen && (
                <div className="modal-overlay" onClick={() => setDetailOpen(false)}>
                    <div onClick={(e: React.MouseEvent) => e.stopPropagation()}><Surface as="section"><Column>
                        <Row as="header" justify="between" align="center">
                            <h3>Weather Detail</h3>
                            <button className="ghost icon" onClick={() => setDetailOpen(false)}>✕</button>
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
                    </Column></Surface></div>
                </div>
            )}
        </>
    );
}
