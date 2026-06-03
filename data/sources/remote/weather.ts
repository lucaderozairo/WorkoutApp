// eslint-disable-next-line boundaries/element-types -- TODO(arch): cross-layer import baselined; see docs/superpowers/plans/2026-06-03-architecture-rule-enforcement.md
import type { WeatherCondition, SuitabilityEntry } from '@features/conditions';

const CACHE_DURATION_MS = 30 * 60 * 1000; // 30 minutes

interface WeatherApiCache {
  data: WeatherCondition | null;
  timestamp: number;
}

let cache: WeatherApiCache | null = null;
let keyWarningLogged = false;

function getApiKey(): string | undefined {
  try {
    return (import.meta as any).env?.VITE_WEATHER_API_KEY;
  } catch {
    return undefined;
  }
}

export async function fetchWeather(): Promise<WeatherCondition | null> {
  const apiKey = getApiKey();

  if (!apiKey) {
    return getStubWeather();
  }

  // VITE_ env vars are inlined into the client bundle and visible in DevTools.
  // Before shipping with a real key, proxy this call through a serverless function
  // (e.g. Cloudflare Worker) so the key stays server-side.
  if (!(import.meta as any).env?.DEV && !keyWarningLogged) {
    console.warn('[security] VITE_WEATHER_API_KEY is exposed in the client bundle. Proxy via a serverless function before production use.');
    keyWarningLogged = true;
  }

  if (cache && Date.now() - cache.timestamp < CACHE_DURATION_MS) {
    return cache.data;
  }

  try {
    const lat = 51.5074;
    const lon = -0.1278;
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Weather API error: ${response.status}`);
    const data = await response.json();
    const condition = parseOpenWeatherData(data);
    cache = { data: condition, timestamp: Date.now() };
    return condition;
  } catch (error) {
    console.warn('Weather fetch failed, using stub data:', error);
    return getStubWeather();
  }
}

function parseOpenWeatherData(data: Record<string, unknown>): WeatherCondition {
  const main = data.main as Record<string, number> | undefined;
  const weather = (data.weather as Array<Record<string, string>>)?.[0];
  const tempCelsius = Math.round(main?.temp ?? 0);
  const humidity = Math.round(main?.humidity ?? 0);
  const windKph = Math.round(((data.wind as Record<string, number>)?.speed ?? 0) * 3.6);
  const description = weather?.main ?? 'Unknown';
  const iconCode = weather?.icon ?? '01d';
  const icon = weatherIcon(iconCode);
  return { tempCelsius, humidity, windKph, description, icon, fetchedAt: Date.now() };
}

function weatherIcon(code: string): string {
  if (code.startsWith('01')) return '☀️';
  if (code.startsWith('02')) return '⛅';
  if (code.startsWith('03') || code.startsWith('04')) return '☁️';
  if (code.startsWith('09') || code.startsWith('10')) return '🌧️';
  if (code.startsWith('11')) return '⛈️';
  if (code.startsWith('13')) return '❄️';
  if (code.startsWith('50')) return '🌫️';
  return '🌤️';
}

function getStubWeather(): WeatherCondition {
  return { tempCelsius: 18, humidity: 60, windKph: 12, description: 'Partly cloudy', icon: '⛅', fetchedAt: Date.now() };
}

export function computeSuitability(conditions: WeatherCondition): SuitabilityEntry[] {
  const entries: SuitabilityEntry[] = [];
  const sports = ['run', 'cycle', 'swim', 'row', 'hike', 'ski'];
  for (const sport of sports) {
    if (conditions.windKph >= 50) entries.push({ sport, suitability: 'poor', reason: 'Strong wind' });
    else if (conditions.tempCelsius < -5) entries.push({ sport, suitability: 'poor', reason: 'Freezing' });
    else if (conditions.windKph >= 30 || conditions.tempCelsius < 0) entries.push({ sport, suitability: 'fair', reason: conditions.windKph >= 30 ? 'High wind' : 'Cold' });
    else if (conditions.tempCelsius > 35) entries.push({ sport, suitability: 'fair', reason: 'Very hot' });
    else if (conditions.tempCelsius >= 10 && conditions.tempCelsius <= 25 && conditions.windKph < 20) entries.push({ sport, suitability: 'excellent', reason: 'Ideal' });
    else entries.push({ sport, suitability: 'good', reason: 'OK' });
  }
  entries.push({ sport: 'lift', suitability: 'excellent', reason: 'Indoor' });
  return entries;
}
