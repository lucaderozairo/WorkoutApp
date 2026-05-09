# Data Logging Overhaul — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend activity data models to capture all metrics from FIT/GPX/TCX/CSV files, add mock data generators for prototyping, and surface time-series and summary visualisations in activity detail views and dashboard widgets.

**Architecture:** Four layers — (1) data model extensions to `GpsPoint`/`GpsTrack` capturing speed, power, grade, temperature, laps, calories, sport; (2) API adapter modules in `data/sources/api/` converting Strava and Garmin health JSON to canonical shapes; (3) mock generators in `data/mock/` returning the same shapes as future API responses; (4) pure transformation functions and chart components wired into `SessionDetail` and `DashboardScreen`. Nutrition extended with MFP CSV import. Analytics page and all-day HR monitoring are out of scope.

**Tech Stack:** TypeScript, React, Recharts (already installed), Vitest, @garmin/fitsdk

---

## File Map

**Modified:**
- `data/sources/files/gps.ts` — extend `GpsPoint` (add `speed`, `power`, `grade`, `temperature`), `GpsTrack` (add `maxHeartRate`, `avgPower`, `calories`, `sport`, `avgTemperature`, `laps`); add `LapSummary` interface; update `computeTrackStats`, `parseTcx`, `parseFit`
- `features/nutrition/domain/types.ts` — extend macros with `fiberG`, `sugarG`, `sodiumMg`, `cholesterolMg` across `NutritionEntry`, `NutritionLoggedPayload`, `LogNutrition`
- `data/mock/sleep.ts` — add `generateMockSleepHistory`
- `ui/components/Charts.tsx` — add `gpsPointsToHRSeries`, `gpsPointsToPaceSeries`, `gpsPointsToElevationSeries`, `HROverTimeChart`, `PaceOverTimeChart`, `ElevationProfileChart`
- `ui/components/SessionDetail.tsx` — replace `CardioDetail` to use typed `gpsTrack` and render charts
- `ui/components/SleepWidgets.tsx` — add `scoreHistory` prop to `SleepLarge` for score sparkline
- `ui/layouts/DashboardScreen.tsx` — add resting HR + HRV widgets, pass `scoreHistory` to `SleepLarge`

**Created:**
- `data/sources/files/gps.test.ts` — unit tests for new fields parsed from TCX/FIT
- `data/sources/api/strava.ts` — `parseStravaActivity` adapter (Strava DetailedActivity + streams → `GpsTrack`)
- `data/sources/api/strava.test.ts` — unit tests for Strava adapter
- `data/sources/api/garmin.ts` — Garmin wellness types: `GarminDailySummary`, `GarminHeartRateSummary`, `GarminStressSummary`, `GarminBodyBatterySummary`, `GarminHRVSummary`
- `data/sources/files/nutrition.ts` — `parseMfpCsv`: parses MFP diary CSV rows into `NutritionEntry[]`
- `data/sources/files/nutrition.test.ts` — unit tests for MFP CSV parser
- `data/mock/runs.ts` — `generateMockRun` producing a realistic `GpsTrack`
- `data/mock/runs.test.ts` — tests for mock run generator
- `data/mock/health.ts` — `generateMockRestingHRHistory`, `generateMockHRVHistory`
- `data/mock/health.test.ts` — tests for health mock generators, plus sleep history tests
- `data/mock/wellness.ts` — `generateMockAllDayHR`, `generateMockStress`, `generateMockBodyBattery`, `generateMockDailySummaries`
- `data/mock/wellness.test.ts` — unit tests for wellness mock generators
- `ui/components/charts.helpers.test.ts` — unit tests for GPS transformation functions
- `ui/components/HealthTrendWidgets.tsx` — `RestingHRWidget` and `HRVWidget` dashboard cards

---

## Task 1: Extend GpsPoint and GpsTrack + update parsers

**Files:**
- Modify: `data/sources/files/gps.ts`
- Create: `data/sources/files/gps.test.ts`

Real activity files provide speed, power, grade and temperature per trackpoint (TCX `ns3:Speed`, `ns3:Watts`; FIT `r.speed`, `r.power`, `r.grade`, `r.temperature`), lap summaries, and session-level calories, max HR, and sport. All must flow through the model before charts can use them.

- [ ] **Step 1: Write failing tests**

Create `data/sources/files/gps.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { parseTcx } from './gps';

const TCX_SAMPLE = `<?xml version="1.0" encoding="UTF-8"?>
<TrainingCenterDatabase
  xmlns:ns3="http://www.garmin.com/xmlschemas/ActivityExtension/v2"
  xmlns="http://www.garmin.com/xmlschemas/TrainingCenterDatabase/v2"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <Activities>
    <Activity Sport="Running">
      <Id>2025-09-08T10:20:03.000Z</Id>
      <Lap StartTime="2025-09-08T10:20:03.000Z">
        <TotalTimeSeconds>120.0</TotalTimeSeconds>
        <DistanceMeters>400.0</DistanceMeters>
        <Calories>32</Calories>
        <MaximumHeartRateBpm><Value>186</Value></MaximumHeartRateBpm>
        <Track>
          <Trackpoint>
            <Time>2025-09-08T10:20:03.000Z</Time>
            <Position>
              <LatitudeDegrees>51.429</LatitudeDegrees>
              <LongitudeDegrees>-0.315</LongitudeDegrees>
            </Position>
            <AltitudeMeters>5.6</AltitudeMeters>
            <HeartRateBpm><Value>163</Value></HeartRateBpm>
            <Extensions>
              <ns3:TPX>
                <ns3:Speed>3.2</ns3:Speed>
                <ns3:RunCadence>85</ns3:RunCadence>
                <ns3:Watts>245</ns3:Watts>
              </ns3:TPX>
            </Extensions>
          </Trackpoint>
        </Track>
      </Lap>
    </Activity>
  </Activities>
</TrainingCenterDatabase>`;

describe('parseTcx — extended fields', () => {
  it('parses sport from Activity attribute', () => {
    expect(parseTcx(TCX_SAMPLE).sport).toBe('running');
  });

  it('parses calories from Lap', () => {
    expect(parseTcx(TCX_SAMPLE).calories).toBe(32);
  });

  it('parses maxHeartRate from Lap', () => {
    expect(parseTcx(TCX_SAMPLE).maxHeartRate).toBe(186);
  });

  it('parses speed per trackpoint', () => {
    expect(parseTcx(TCX_SAMPLE).points[0].speed).toBe(3.2);
  });

  it('parses power per trackpoint', () => {
    expect(parseTcx(TCX_SAMPLE).points[0].power).toBe(245);
  });

  it('computes avgPower from points', () => {
    expect(parseTcx(TCX_SAMPLE).avgPower).toBe(245);
  });

  it('parses laps with distance and duration', () => {
    const laps = parseTcx(TCX_SAMPLE).laps ?? [];
    expect(laps.length).toBe(1);
    expect(laps[0].distanceMeters).toBe(400);
    expect(laps[0].durationSeconds).toBe(120);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run data/sources/files/gps.test.ts
```
Expected: 7 failures — properties don't exist yet.

- [ ] **Step 3: Extend GpsPoint and GpsTrack interfaces**

In `data/sources/files/gps.ts`, replace both interface definitions:

```typescript
export interface LapSummary {
  startTimestamp: string;
  durationSeconds: number;
  distanceMeters: number;
  avgHeartRate?: number;
  maxHeartRate?: number;
  calories?: number;
}

export interface GpsPoint {
  lat: number;
  lng: number;
  elevation: number;
  heartRate?: number;
  cadence?: number;
  speed?: number;       // m/s
  power?: number;       // watts
  grade?: number;       // percent
  temperature?: number; // °C
  timestamp: string;
}

export interface GpsTrack {
  points: GpsPoint[];
  totalDistance: number;
  elevationGain: number;
  avgHeartRate?: number;
  maxHeartRate?: number;
  avgPace?: number;
  avgSpeed?: number;
  avgPower?: number;
  avgTemperature?: number;
  duration: number;
  calories?: number;
  sport?: string;
  startTimestamp?: string;
  laps?: LapSummary[];
}
```

- [ ] **Step 4: Update computeTrackStats to derive maxHeartRate and avgPower**

In `data/sources/files/gps.ts`, replace the derived-stats block inside `computeTrackStats` (from `const hrPoints` to the `return`):

```typescript
  const hrPoints = points.filter((p) => p.heartRate != null);
  const avgHeartRate =
    hrPoints.length > 0
      ? Math.round(hrPoints.reduce((s, p) => s + p.heartRate!, 0) / hrPoints.length)
      : undefined;
  const maxHeartRate =
    hrPoints.length > 0
      ? Math.max(...hrPoints.map((p) => p.heartRate!))
      : undefined;

  const powerPoints = points.filter((p) => p.power != null);
  const avgPower =
    powerPoints.length > 0
      ? Math.round(powerPoints.reduce((s, p) => s + p.power!, 0) / powerPoints.length)
      : undefined;

  const tempPoints = points.filter((p) => p.temperature != null);
  const avgTemperature =
    tempPoints.length > 0
      ? Math.round(tempPoints.reduce((s, p) => s + p.temperature!, 0) / tempPoints.length * 10) / 10
      : undefined;

  const avgSpeed =
    duration > 0 ? totalDistance / 1000 / (duration / 3600) : undefined;
  const avgPace =
    totalDistance > 0 ? duration / (totalDistance / 1000) : undefined;

  return {
    totalDistance,
    elevationGain,
    avgHeartRate,
    maxHeartRate,
    avgPower,
    avgTemperature,
    avgPace,
    avgSpeed,
    duration,
    startTimestamp: points[0].timestamp,
  };
```

- [ ] **Step 5: Update parseTcx to extract sport, calories, maxHR, speed, power, laps**

Replace the entire `parseTcx` function:

```typescript
export function parseTcx(xml: string): GpsTrack {
  const doc = new DOMParser().parseFromString(xml, "application/xml");
  const lapEls = Array.from(doc.querySelectorAll("Lap"));

  const sport =
    doc.querySelector("Activity")?.getAttribute("Sport")?.toLowerCase() ?? undefined;

  const calories =
    lapEls.reduce((sum, lap) => {
      return sum + (parseFloat(lap.querySelector("Calories")?.textContent ?? "0") || 0);
    }, 0) || undefined;

  const maxHeartRate =
    Array.from(doc.querySelectorAll("MaximumHeartRateBpm Value")).reduce(
      (max, el) => Math.max(max, parseInt(el.textContent ?? "0", 10) || 0),
      0,
    ) || undefined;

  const laps: LapSummary[] = lapEls.map((lap) => ({
    startTimestamp: lap.getAttribute("StartTime") ?? new Date(0).toISOString(),
    durationSeconds: parseFloat(lap.querySelector("TotalTimeSeconds")?.textContent ?? "0"),
    distanceMeters: parseFloat(lap.querySelector("DistanceMeters")?.textContent ?? "0"),
    calories: parseInt(lap.querySelector("Calories")?.textContent ?? "0", 10) || undefined,
    maxHeartRate:
      parseInt(lap.querySelector("MaximumHeartRateBpm Value")?.textContent ?? "0", 10) || undefined,
    avgHeartRate:
      parseInt(lap.querySelector("AverageHeartRateBpm Value")?.textContent ?? "0", 10) || undefined,
  }));

  const points: GpsPoint[] = Array.from(doc.querySelectorAll("Trackpoint")).flatMap((tp) => {
    const pos = tp.querySelector("Position");
    if (!pos) return [];

    const lat = parseFloat(pos.querySelector("LatitudeDegrees")?.textContent ?? "0");
    const lng = parseFloat(pos.querySelector("LongitudeDegrees")?.textContent ?? "0");
    const ele = parseFloat(tp.querySelector("AltitudeMeters")?.textContent ?? "0");
    const time = tp.querySelector("Time")?.textContent ?? new Date(0).toISOString();
    const hrEl    = tp.querySelector("HeartRateBpm Value");
    const cadEl   = tp.querySelector("Cadence") ?? tp.querySelector("RunCadence");
    const speedEl = tp.querySelector("Speed");
    const powerEl = tp.querySelector("Watts");

    return [{
      lat,
      lng,
      elevation: isNaN(ele) ? 0 : ele,
      timestamp: time,
      ...(hrEl    ? { heartRate: parseInt(hrEl.textContent    ?? "0", 10)  } : {}),
      ...(cadEl   ? { cadence:   parseInt(cadEl.textContent   ?? "0", 10)  } : {}),
      ...(speedEl ? { speed:     parseFloat(speedEl.textContent ?? "0")    } : {}),
      ...(powerEl ? { power:     parseInt(powerEl.textContent  ?? "0", 10) } : {}),
    }];
  });

  const stats = computeTrackStats(points);
  return {
    ...stats,
    points,
    sport,
    calories:     calories     ?? stats.calories,
    maxHeartRate: maxHeartRate ?? stats.maxHeartRate,
    laps: laps.length > 0 ? laps : undefined,
  };
}
```

- [ ] **Step 6: Update parseFit to extract speed, power, temperature, grade, laps, and session-level data**

Replace the entire `parseFit` function:

```typescript
export async function parseFit(buffer: ArrayBuffer): Promise<GpsTrack> {
  if (buffer.byteLength === 0) {
    return { points: [], totalDistance: 0, elevationGain: 0, duration: 0 };
  }

  const fitsdk = await import("@garmin/fitsdk");
  const stream = fitsdk.Stream.fromArrayBuffer(buffer);
  const decoder = new fitsdk.Decoder(stream);
  const { messages } = decoder.read();
  const records  = messages.recordMesgs ?? [];
  const lapMesgs = (messages as any).lapMesgs ?? [];

  const points: GpsPoint[] = records.flatMap(
    (r: import("@garmin/fitsdk").FitMessage) => {
      if (r.positionLat == null || r.positionLong == null) return [];
      const lat = r.positionLat * SEMICIRCLES_TO_DEGREES;
      const lng = r.positionLong * SEMICIRCLES_TO_DEGREES;
      const elevation = r.altitude ?? 0;
      const timestamp =
        r.timestamp instanceof Date
          ? r.timestamp.toISOString()
          : new Date((r.timestamp ?? 0) * 1000).toISOString();
      return [{
        lat,
        lng,
        elevation,
        timestamp,
        ...(r.heartRate   != null ? { heartRate:   r.heartRate             } : {}),
        ...(r.cadence     != null ? { cadence:     r.cadence               } : {}),
        ...(r.speed       != null ? { speed:       r.speed                 } : {}),
        ...(r.power       != null ? { power:       r.power                 } : {}),
        ...(r.grade       != null ? { grade:       r.grade                 } : {}),
        ...(r.temperature != null ? { temperature: r.temperature           } : {}),
      }];
    },
  );

  const laps: LapSummary[] = lapMesgs.map((l: any) => ({
    startTimestamp:
      l.startTime instanceof Date
        ? l.startTime.toISOString()
        : new Date((l.startTime ?? 0) * 1000).toISOString(),
    durationSeconds: l.totalElapsedTime ?? 0,
    distanceMeters:  l.totalDistance    ?? 0,
    ...(l.totalCalories    != null ? { calories:     l.totalCalories    } : {}),
    ...(l.avgHeartRate     != null ? { avgHeartRate: l.avgHeartRate     } : {}),
    ...(l.maxHeartRate     != null ? { maxHeartRate: l.maxHeartRate     } : {}),
  }));

  const stats   = computeTrackStats(points);
  const session = (messages as any).sessionMesgs?.[0];
  const calories = session?.totalCalories ?? undefined;
  const sport    = session?.sport?.toLowerCase?.() ?? undefined;

  return {
    ...stats,
    points,
    ...(calories          != null ? { calories                      } : {}),
    ...(sport             != null ? { sport                         } : {}),
    ...(laps.length > 0          ? { laps                          } : {}),
  };
}
```

- [ ] **Step 7: Run tests**

```bash
npx vitest run data/sources/files/gps.test.ts
```
Expected: 7 PASS

- [ ] **Step 8: Full type-check**

```bash
npx tsc --noEmit
```
Expected: no errors

- [ ] **Step 9: Commit**

```bash
git add data/sources/files/gps.ts data/sources/files/gps.test.ts
git commit -m "feat: extend GpsPoint/GpsTrack with speed, power, grade, temperature, laps"
```

---

## Task 2: Mock run generator

**Files:**
- Create: `data/mock/runs.ts`
- Create: `data/mock/runs.test.ts`

Generates realistic GPS tracks for prototyping. Uses deterministic math (sine waves) not `Math.random()` so output is reproducible per call.

- [ ] **Step 1: Write failing tests**

Create `data/mock/runs.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { generateMockRun } from './runs';

const DATE = new Date('2026-04-20T07:00:00Z');

describe('generateMockRun', () => {
  it('produces the correct point count (1 point per 5 seconds)', () => {
    const track = generateMockRun({ date: DATE, durationMin: 10, distanceKm: 2 });
    expect(track.points.length).toBe(120); // 10 * 60 / 5
  });

  it('every point has lat, lng, elevation, timestamp', () => {
    const track = generateMockRun({ date: DATE, durationMin: 5, distanceKm: 1 });
    for (const p of track.points) {
      expect(typeof p.lat).toBe('number');
      expect(typeof p.lng).toBe('number');
      expect(typeof p.elevation).toBe('number');
      expect(p.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    }
  });

  it('heart rate is in plausible range (100–200 bpm)', () => {
    const track = generateMockRun({ date: DATE, durationMin: 30, distanceKm: 5 });
    for (const p of track.points) {
      expect(p.heartRate).toBeGreaterThanOrEqual(100);
      expect(p.heartRate).toBeLessThanOrEqual(200);
    }
  });

  it('total distance is within 5% of requested', () => {
    const track = generateMockRun({ date: DATE, durationMin: 30, distanceKm: 5 });
    expect(track.totalDistance).toBeGreaterThan(4750);
    expect(track.totalDistance).toBeLessThan(5250);
  });

  it('duration matches requested within 1 second', () => {
    const track = generateMockRun({ date: DATE, durationMin: 20, distanceKm: 4 });
    expect(Math.abs(track.duration - 20 * 60)).toBeLessThanOrEqual(1);
  });

  it('sport defaults to run', () => {
    expect(generateMockRun({ date: DATE, durationMin: 10, distanceKm: 2 }).sport).toBe('run');
  });

  it('calories is set and > 0', () => {
    const track = generateMockRun({ date: DATE, durationMin: 30, distanceKm: 5 });
    expect(track.calories).toBeGreaterThan(0);
  });

  it('maxHeartRate >= avgHeartRate', () => {
    const track = generateMockRun({ date: DATE, durationMin: 30, distanceKm: 5 });
    expect(track.maxHeartRate!).toBeGreaterThanOrEqual(track.avgHeartRate!);
  });
});
```

- [ ] **Step 2: Run to confirm they fail**

```bash
npx vitest run data/mock/runs.test.ts
```
Expected: FAIL — module not found

- [ ] **Step 3: Implement generateMockRun**

Create `data/mock/runs.ts`:

```typescript
import { computeTrackStats } from '@data/sources/files/gps';
import type { GpsTrack, GpsPoint } from '@data/sources/files/gps';

export type CardioSport = 'run' | 'cycle' | 'swim' | 'row' | 'hike' | 'ski';

export interface MockRunOptions {
  date: Date;
  sport?: CardioSport;
  durationMin: number;
  distanceKm: number;
  avgHr?: number;
}

const POINT_INTERVAL_SEC = 5;

export function generateMockRun({
  date,
  sport = 'run',
  durationMin,
  distanceKm,
  avgHr = 155,
}: MockRunOptions): GpsTrack {
  const totalSeconds = durationMin * 60;
  const pointCount = Math.floor(totalSeconds / POINT_INTERVAL_SEC);
  const targetSpeedMs = (distanceKm * 1000) / totalSeconds;

  // Circular route centred near Richmond upon Thames
  const baseLat = 51.429;
  const baseLng = -0.315;
  const radiusM = (distanceKm * 1000) / (2 * Math.PI);
  const metersPerDegreeLat = 111_320;
  const metersPerDegreeLng = metersPerDegreeLat * Math.cos((baseLat * Math.PI) / 180);

  const points: GpsPoint[] = [];

  for (let i = 0; i < pointCount; i++) {
    const t = i / pointCount;
    const elapsed = i * POINT_INTERVAL_SEC;
    const ts = new Date(date.getTime() + elapsed * 1000);

    // HR curve: warmup 0–15%, steady 15–85%, cooldown 85–100%
    let hr: number;
    if (t < 0.15) {
      hr = (avgHr - 30) + 30 * (t / 0.15);
    } else if (t < 0.85) {
      hr = avgHr + Math.sin(t * 37) * 5; // deterministic variation
    } else {
      hr = avgHr - 25 * ((t - 0.85) / 0.15);
    }

    const angle = t * 2 * Math.PI;
    const lat = baseLat + (radiusM * Math.cos(angle)) / metersPerDegreeLat;
    const lng = baseLng + (radiusM * Math.sin(angle)) / metersPerDegreeLng;
    const elevation = 8 + 4 * Math.sin(t * 6 * Math.PI);
    const speed = targetSpeedMs * (0.95 + Math.abs(Math.sin(t * 53)) * 0.1);
    const cadence =
      sport === 'run'
        ? 168 + Math.floor(Math.abs(Math.sin(t * 71)) * 10)
        : 80  + Math.floor(Math.abs(Math.sin(t * 71)) * 20);
    const power =
      sport === 'run'
        ? Math.round(210 + Math.abs(Math.sin(t * 41)) * 50)
        : undefined;

    points.push({
      lat,
      lng,
      elevation,
      heartRate: Math.round(Math.max(100, Math.min(200, hr))),
      cadence,
      speed,
      ...(power != null ? { power } : {}),
      timestamp: ts.toISOString(),
    });
  }

  const stats = computeTrackStats(points);
  return {
    ...stats,
    points,
    sport,
    calories: Math.round(durationMin * (sport === 'run' ? 11 : 8)),
  };
}
```

- [ ] **Step 4: Run tests**

```bash
npx vitest run data/mock/runs.test.ts
```
Expected: 8 PASS

- [ ] **Step 5: Type-check**

```bash
npx tsc --noEmit
```

- [ ] **Step 6: Commit**

```bash
git add data/mock/runs.ts data/mock/runs.test.ts
git commit -m "feat: add generateMockRun for GPS track prototyping"
```

---

## Task 3: Mock health and sleep history generators

**Files:**
- Create: `data/mock/health.ts`
- Create: `data/mock/health.test.ts`
- Modify: `data/mock/sleep.ts`

- [ ] **Step 1: Write failing tests**

Create `data/mock/health.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { generateMockRestingHRHistory, generateMockHRVHistory } from './health';
import { generateMockSleepHistory } from './sleep';

describe('generateMockRestingHRHistory', () => {
  it('returns exactly the requested number of days', () => {
    expect(generateMockRestingHRHistory(30).length).toBe(30);
  });

  it('entries are sorted oldest to newest', () => {
    const entries = generateMockRestingHRHistory(7);
    for (let i = 1; i < entries.length; i++) {
      expect(entries[i].date > entries[i - 1].date).toBe(true);
    }
  });

  it('BPM values are in realistic range (35–65)', () => {
    const entries = generateMockRestingHRHistory(90);
    for (const e of entries) {
      expect(e.bpm).toBeGreaterThanOrEqual(35);
      expect(e.bpm).toBeLessThanOrEqual(65);
    }
  });

  it('dates are YYYY-MM-DD strings', () => {
    for (const e of generateMockRestingHRHistory(3)) {
      expect(e.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });
});

describe('generateMockHRVHistory', () => {
  it('returns exactly the requested number of days', () => {
    expect(generateMockHRVHistory(30).length).toBe(30);
  });

  it('HRV values are in realistic range (30–140 ms)', () => {
    for (const e of generateMockHRVHistory(90)) {
      expect(e.hrv).toBeGreaterThanOrEqual(30);
      expect(e.hrv).toBeLessThanOrEqual(140);
    }
  });
});

describe('generateMockSleepHistory', () => {
  it('returns exactly the requested number of days', () => {
    expect(generateMockSleepHistory(7).length).toBe(7);
  });

  it('each entry has score between 0 and 100', () => {
    for (const e of generateMockSleepHistory(30)) {
      expect(e.score).toBeGreaterThanOrEqual(0);
      expect(e.score).toBeLessThanOrEqual(100);
    }
  });

  it('entries are sorted oldest to newest', () => {
    const entries = generateMockSleepHistory(7);
    for (let i = 1; i < entries.length; i++) {
      expect(entries[i].start >= entries[i - 1].start).toBe(true);
    }
  });
});
```

- [ ] **Step 2: Run to confirm they fail**

```bash
npx vitest run data/mock/health.test.ts
```
Expected: FAIL — health module not found, generateMockSleepHistory not exported

- [ ] **Step 3: Create health generators**

Create `data/mock/health.ts`:

```typescript
export interface RestingHREntry {
  date: string; // YYYY-MM-DD
  bpm: number;
}

export interface HRVEntry {
  date: string; // YYYY-MM-DD
  hrv: number;  // ms
}

export function generateMockRestingHRHistory(
  days: number,
  endDate: Date = new Date(),
): RestingHREntry[] {
  const entries: RestingHREntry[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(endDate);
    d.setDate(d.getDate() - i);
    // Gentle downward trend (improving fitness) + sine wave noise — deterministic
    const trend = -0.04 * (days - i);
    const noise = Math.sin(i * 1.7) * 2.5;
    const bpm = Math.round(Math.max(35, Math.min(65, 50 + trend + noise)));
    entries.push({ date: d.toISOString().slice(0, 10), bpm });
  }
  return entries;
}

export function generateMockHRVHistory(
  days: number,
  endDate: Date = new Date(),
): HRVEntry[] {
  const entries: HRVEntry[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(endDate);
    d.setDate(d.getDate() - i);
    // Variable HRV with slight upward trend — deterministic
    const trend = 0.1 * (days - i);
    const noise = Math.sin(i * 2.3) * 12 + Math.sin(i * 0.7) * 8;
    const hrv = Math.round(Math.max(30, Math.min(140, 72 + trend + noise)));
    entries.push({ date: d.toISOString().slice(0, 10), hrv });
  }
  return entries;
}
```

- [ ] **Step 4: Add generateMockSleepHistory to data/mock/sleep.ts**

Append to the end of `data/mock/sleep.ts`:

```typescript
export function generateMockSleepHistory(
  days: number,
  endDate: Date = new Date(),
): SleepSession[] {
  const sessions: SleepSession[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const end = new Date(endDate);
    end.setDate(end.getDate() - i);
    end.setHours(6, 30, 0, 0);
    const durationMin = Math.round(420 + Math.sin(i * 1.9) * 70 + Math.sin(i * 0.5) * 30);
    const score = Math.round(Math.max(55, Math.min(95, 75 + Math.sin(i * 1.3) * 15 + Math.sin(i * 0.4) * 8)));
    const deep  = Math.round(durationMin * 0.18);
    const rem   = Math.round(durationMin * 0.20);
    const awake = Math.round(durationMin * 0.08);
    const light = durationMin - deep - rem - awake;
    sessions.push({
      start: new Date(end.getTime() - durationMin * 60_000),
      end,
      score,
      stages: { deep, light, rem, awake },
    });
  }
  return sessions;
}
```

- [ ] **Step 5: Run all tests**

```bash
npx vitest run data/mock/health.test.ts
```
Expected: 8 PASS

- [ ] **Step 6: Type-check**

```bash
npx tsc --noEmit
```

- [ ] **Step 7: Commit**

```bash
git add data/mock/health.ts data/mock/health.test.ts data/mock/sleep.ts
git commit -m "feat: add mock generators for health metrics and sleep history"
```

---

## Task 4: Time-series chart components

**Files:**
- Modify: `ui/components/Charts.tsx`
- Create: `ui/components/charts.helpers.test.ts`

Transformation functions (`gpsPointsTo*Series`) are pure and tested independently. Chart components wrap them — no separate tests needed for the JSX.

- [ ] **Step 1: Write failing tests for transformation functions**

Create `ui/components/charts.helpers.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import {
  gpsPointsToHRSeries,
  gpsPointsToPaceSeries,
  gpsPointsToElevationSeries,
} from './Charts';
import type { GpsPoint } from '@data/sources/files/gps';

const pt = (overrides: Partial<GpsPoint> & { timestamp: string }): GpsPoint => ({
  lat: 51.4, lng: -0.3, elevation: 10, ...overrides,
});

describe('gpsPointsToHRSeries', () => {
  it('maps elapsed minutes and HR', () => {
    const points = [
      pt({ timestamp: '2025-09-08T10:00:00.000Z', heartRate: 120 }),
      pt({ timestamp: '2025-09-08T10:01:00.000Z', heartRate: 140 }),
      pt({ timestamp: '2025-09-08T10:02:00.000Z', heartRate: 160 }),
    ];
    expect(gpsPointsToHRSeries(points)).toEqual([
      { x: 0, y: 120 },
      { x: 1, y: 140 },
      { x: 2, y: 160 },
    ]);
  });

  it('filters out points with no heart rate', () => {
    const points = [
      pt({ timestamp: '2025-09-08T10:00:00.000Z', heartRate: 120 }),
      pt({ timestamp: '2025-09-08T10:01:00.000Z' }),
    ];
    expect(gpsPointsToHRSeries(points).length).toBe(1);
  });

  it('returns empty array for empty input', () => {
    expect(gpsPointsToHRSeries([])).toEqual([]);
  });
});

describe('gpsPointsToPaceSeries', () => {
  it('converts speed (m/s) to pace (min/km) rounded to 1dp', () => {
    const points = [pt({ timestamp: '2025-09-08T10:00:00.000Z', speed: 3.0 })];
    // 3.0 m/s → 1000 / 3.0 / 60 = 5.555... → rounded to 5.6
    expect(gpsPointsToPaceSeries(points)[0].y).toBeCloseTo(5.6, 1);
  });

  it('filters out points with no speed or zero speed', () => {
    const points = [
      pt({ timestamp: '2025-09-08T10:00:00.000Z', speed: 0 }),
      pt({ timestamp: '2025-09-08T10:01:00.000Z' }),
    ];
    expect(gpsPointsToPaceSeries(points).length).toBe(0);
  });
});

describe('gpsPointsToElevationSeries', () => {
  it('first point has x=0', () => {
    const points = [pt({ timestamp: '2025-09-08T10:00:00.000Z', elevation: 5 })];
    expect(gpsPointsToElevationSeries(points)[0].x).toBe(0);
  });

  it('elevation y matches input', () => {
    const points = [pt({ timestamp: '2025-09-08T10:00:00.000Z', elevation: 12.5 })];
    expect(gpsPointsToElevationSeries(points)[0].y).toBe(12.5);
  });

  it('returns empty array for empty input', () => {
    expect(gpsPointsToElevationSeries([])).toEqual([]);
  });
});
```

- [ ] **Step 2: Run to confirm they fail**

```bash
npx vitest run ui/components/charts.helpers.test.ts
```
Expected: FAIL — functions not exported

- [ ] **Step 3: Add transformation functions and chart components to Charts.tsx**

Append the following to the end of `ui/components/Charts.tsx` (after the existing imports add the new import at the top, then append components at the bottom):

**New import line** — add to the existing import block at the top of `Charts.tsx`:

```typescript
import type { GpsPoint } from '@data/sources/files/gps';
import { haversineDistanceMeters } from '@data/sources/files/gps';
```

**New exports** — append at end of file:

```typescript
// ─── GPS data transformers ─────────────────────────────────────────────────────

export function gpsPointsToHRSeries(
  points: GpsPoint[],
): Array<{ x: number; y: number }> {
  if (points.length === 0) return [];
  const t0 = new Date(points[0].timestamp).getTime();
  return points
    .filter((p) => p.heartRate != null)
    .map((p) => ({
      x: Math.round((new Date(p.timestamp).getTime() - t0) / 60_000),
      y: p.heartRate!,
    }));
}

export function gpsPointsToPaceSeries(
  points: GpsPoint[],
): Array<{ x: number; y: number }> {
  if (points.length === 0) return [];
  const t0 = new Date(points[0].timestamp).getTime();
  return points
    .filter((p) => p.speed != null && p.speed > 0.1)
    .map((p) => ({
      x: Math.round((new Date(p.timestamp).getTime() - t0) / 60_000),
      y: Math.round((1000 / p.speed! / 60) * 10) / 10,
    }));
}

export function gpsPointsToElevationSeries(
  points: GpsPoint[],
): Array<{ x: number; y: number }> {
  if (points.length === 0) return [];
  let cumulativeKm = 0;
  return points.map((p, i) => {
    if (i > 0) {
      cumulativeKm +=
        haversineDistanceMeters(points[i - 1].lat, points[i - 1].lng, p.lat, p.lng) / 1000;
    }
    return { x: Math.round(cumulativeKm * 100) / 100, y: p.elevation };
  });
}

// ─── HROverTimeChart ──────────────────────────────────────────────────────────

export function HROverTimeChart({ points }: { points: GpsPoint[] }) {
  const data = gpsPointsToHRSeries(points);
  if (data.length === 0) return null;
  return (
    <ResponsiveContainer width="100%" height={140}>
      <LineChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
        <XAxis dataKey="x" tick={{ fontSize: 10 }} tickFormatter={(v: number) => `${v}m`} axisLine={false} tickLine={false} />
        <YAxis domain={['auto', 'auto']} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={32} />
        <Tooltip formatter={(v: any) => [`${v} bpm`, 'HR']} labelFormatter={(v: any) => `${v} min`} />
        <Line type="monotone" dataKey="y" stroke="var(--color-danger)" strokeWidth={1.5} dot={false} isAnimationActive={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

// ─── PaceOverTimeChart ────────────────────────────────────────────────────────

export function PaceOverTimeChart({ points }: { points: GpsPoint[] }) {
  const data = gpsPointsToPaceSeries(points);
  if (data.length === 0) return null;
  return (
    <ResponsiveContainer width="100%" height={100}>
      <LineChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
        <XAxis dataKey="x" tick={{ fontSize: 10 }} tickFormatter={(v: number) => `${v}m`} axisLine={false} tickLine={false} />
        <YAxis
          reversed
          domain={['auto', 'auto']}
          tick={{ fontSize: 10 }}
          tickFormatter={(v: number) => {
            const m = Math.floor(v);
            const s = Math.round((v - m) * 60);
            return `${m}:${String(s).padStart(2, '0')}`;
          }}
          axisLine={false} tickLine={false} width={40}
        />
        <Tooltip
          formatter={(v: any) => {
            const m = Math.floor(v);
            const s = Math.round((v - m) * 60);
            return [`${m}:${String(s).padStart(2, '0')}/km`, 'Pace'];
          }}
          labelFormatter={(v: any) => `${v} min`}
        />
        <Line type="monotone" dataKey="y" stroke="var(--color-primary)" strokeWidth={1.5} dot={false} isAnimationActive={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

// ─── ElevationProfileChart ────────────────────────────────────────────────────

export function ElevationProfileChart({ points }: { points: GpsPoint[] }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const gradId = `elev-${uid}`;
  const data = gpsPointsToElevationSeries(points);
  if (data.length === 0) return null;
  return (
    <ResponsiveContainer width="100%" height={80}>
      <AreaChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="var(--color-success)" stopOpacity={0.4} />
            <stop offset="100%" stopColor="var(--color-success)" stopOpacity={0.05} />
          </linearGradient>
        </defs>
        <XAxis dataKey="x" tick={{ fontSize: 9 }} tickFormatter={(v: number) => `${v}km`} axisLine={false} tickLine={false} />
        <YAxis hide domain={['auto', 'auto']} />
        <Tooltip formatter={(v: any) => [`${v} m`, 'Elevation']} labelFormatter={(v: any) => `${v} km`} />
        <Area type="monotone" dataKey="y" stroke="var(--color-success)" strokeWidth={1.5} fill={`url(#${gradId})`} dot={false} isAnimationActive={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
```

- [ ] **Step 4: Run tests**

```bash
npx vitest run ui/components/charts.helpers.test.ts
```
Expected: 8 PASS

- [ ] **Step 5: Type-check**

```bash
npx tsc --noEmit
```

- [ ] **Step 6: Commit**

```bash
git add ui/components/Charts.tsx ui/components/charts.helpers.test.ts
git commit -m "feat: add HROverTimeChart, PaceOverTimeChart, ElevationProfileChart"
```

---

## Task 5: Wire charts into CardioDetail

**Files:**
- Modify: `ui/components/SessionDetail.tsx`

`CardioDetail` currently accesses `gpsTrack` via `as any`. This task makes it type-safe and renders charts when track data is present.

- [ ] **Step 1: Add chart imports**

In `ui/components/SessionDetail.tsx`, add to the import block:

```typescript
import { HROverTimeChart, PaceOverTimeChart, ElevationProfileChart } from './Charts';
```

- [ ] **Step 2: Replace the CardioDetail function**

Replace the entire `CardioDetail` function (lines 151–241):

```typescript
function CardioDetail({ session }: { session: CardioSession }) {
  const [showImport, setShowImport] = useState(false);
  const distKm = session.distanceMeters / 1000;
  const pace =
    session.durationSeconds > 0 && session.distanceMeters > 0
      ? session.durationSeconds / (session.distanceMeters / 1000)
      : 0;
  const color = sportColor(session.sport);
  const track = session.gpsTrack;

  async function handleAttach(importedTrack: GpsTrack) {
    await handleImportGpsTrack({
      type: 'ImportGpsTrack',
      sessionId: session.id,
      track: importedTrack,
    });
    setShowImport(false);
  }

  return (
    <div className="column gap-2">
      <section className="surface compact">
        <div className="row space-between align-center">
          <div className="stat">
            <span className="label">DISTANCE</span>
            <p className={`value ${color}`}>{distKm.toFixed(2)} km</p>
          </div>
          <div className="stat">
            <span className="label">DURATION</span>
            <p className="value">{formatDuration(session.durationSeconds)}</p>
          </div>
          <div className="stat">
            <span className="label">PACE</span>
            <p className="value">{formatPace(pace)}</p>
          </div>
        </div>

        {track && (track.avgHeartRate != null || track.maxHeartRate != null || track.calories != null || track.avgPower != null) && (
          <div className="row space-between align-center">
            {track.avgHeartRate != null && (
              <div className="stat">
                <span className="label">AVG HR</span>
                <p className="value">{track.avgHeartRate} bpm</p>
              </div>
            )}
            {track.maxHeartRate != null && (
              <div className="stat">
                <span className="label">MAX HR</span>
                <p className="value">{track.maxHeartRate} bpm</p>
              </div>
            )}
            {track.calories != null && (
              <div className="stat">
                <span className="label">CALORIES</span>
                <p className="value">{track.calories} kcal</p>
              </div>
            )}
            {track.avgPower != null && (
              <div className="stat">
                <span className="label">AVG POWER</span>
                <p className="value">{track.avgPower} W</p>
              </div>
            )}
          </div>
        )}
      </section>

      {track && track.points.length > 0 && (
        <>
          <section className="surface compact column gap-0">
            <span className="caption">Heart rate</span>
            <HROverTimeChart points={track.points} />
          </section>
          <section className="surface compact column gap-0">
            <span className="caption">Pace</span>
            <PaceOverTimeChart points={track.points} />
          </section>
          <section className="surface compact column gap-0">
            <span className="caption">Elevation</span>
            <ElevationProfileChart points={track.points} />
          </section>
        </>
      )}

      {session.notes && (
        <section className="surface compact">
          <p>{session.notes}</p>
        </section>
      )}

      {track ? (
        <SessionGpsPreview track={track} sessionId={session.id} />
      ) : (
        <button type="button" className="ghost icon" onClick={() => setShowImport(true)}>
          Attach GPS file
        </button>
      )}

      {showImport && (
        <ImportModal
          context="enrich-session"
          existingSession={{
            id: session.id,
            durationSeconds: session.durationSeconds,
            distanceMeters: session.distanceMeters,
            sport: session.sport,
            notes: session.notes,
          }}
          onComplete={handleAttach}
          onClose={() => setShowImport(false)}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 3: Type-check**

```bash
npx tsc --noEmit
```
Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add ui/components/SessionDetail.tsx
git commit -m "feat: render HR, pace, elevation charts in cardio session detail"
```

---

## Task 6: Dashboard — resting HR and HRV trend widgets

**Files:**
- Create: `ui/components/HealthTrendWidgets.tsx`
- Modify: `ui/layouts/DashboardScreen.tsx`

Uses `health_metrics` projection when populated (via ProfileScreen manual entry), falls back to mock generator.

- [ ] **Step 1: Create HealthTrendWidgets.tsx**

Create `ui/components/HealthTrendWidgets.tsx`:

```typescript
import { SparklineArea } from './Charts';
import type { RestingHREntry, HRVEntry } from '@data/mock/health';

export function RestingHRWidget({ history }: { history: RestingHREntry[] }) {
  if (history.length === 0) return null;
  const latest = history[history.length - 1];
  const data = history.map((e) => ({ x: e.date.slice(5), y: e.bpm }));
  return (
    <div className="surface column compact">
      <div className="row space-between align-center">
        <span className="caption">Resting HR</span>
        <span className="value">{latest.bpm} bpm</span>
      </div>
      <SparklineArea
        data={data}
        color="var(--color-danger)"
        height={50}
        id="resting-hr"
        yDomain={[35, 70]}
        showTooltip
        tooltipFormatter={(v) => `${v} bpm`}
      />
    </div>
  );
}

export function HRVWidget({ history }: { history: HRVEntry[] }) {
  if (history.length === 0) return null;
  const latest = history[history.length - 1];
  const data = history.map((e) => ({ x: e.date.slice(5), y: e.hrv }));
  return (
    <div className="surface column compact">
      <div className="row space-between align-center">
        <span className="caption">HRV</span>
        <span className="value">{latest.hrv} ms</span>
      </div>
      <SparklineArea
        data={data}
        color="var(--color-primary)"
        height={50}
        id="hrv"
        yDomain={[30, 140]}
        showTooltip
        tooltipFormatter={(v) => `${v} ms`}
      />
    </div>
  );
}
```

- [ ] **Step 2: Add imports in DashboardScreen.tsx**

In `ui/layouts/DashboardScreen.tsx`, add to the import block:

```typescript
import { RestingHRWidget, HRVWidget } from '@ui/components/HealthTrendWidgets';
import { generateMockRestingHRHistory, generateMockHRVHistory } from '@data/mock/health';
import type { HealthMetricsView } from '@features/readiness';
```

- [ ] **Step 3: Derive health data in the DashboardScreen component**

In the `DashboardScreen` function body, after the existing `sleepWeek` lines, add:

```typescript
  const healthMetrics = (useQuery<HealthMetricsView[]>('health_metrics') ?? []) as HealthMetricsView[];
  const restingHRHistory =
    healthMetrics.filter((m) => m.restingHr != null).length > 0
      ? healthMetrics
          .filter((m) => m.restingHr != null)
          .map((m) => ({ date: new Date(m.loggedAt).toISOString().slice(0, 10), bpm: m.restingHr! }))
          .reverse()
      : generateMockRestingHRHistory(30);
  const hrvHistory =
    healthMetrics.filter((m) => m.hrv != null).length > 0
      ? healthMetrics
          .filter((m) => m.hrv != null)
          .map((m) => ({ date: new Date(m.loggedAt).toISOString().slice(0, 10), hrv: m.hrv! }))
          .reverse()
      : generateMockHRVHistory(30);
```

- [ ] **Step 4: Add widgets to the JSX grid**

Inside `<div className="auto-grid">` in DashboardScreen, after the `<SleepLarge .../>` line, add:

```tsx
      <RestingHRWidget history={restingHRHistory} />
      <HRVWidget history={hrvHistory} />
```

- [ ] **Step 5: Type-check**

```bash
npx tsc --noEmit
```

- [ ] **Step 6: Commit**

```bash
git add ui/components/HealthTrendWidgets.tsx ui/layouts/DashboardScreen.tsx
git commit -m "feat: add resting HR and HRV trend widgets to dashboard"
```

---

## Task 7: Dashboard — sleep score trend sparkline

**Files:**
- Modify: `ui/components/SleepWidgets.tsx`
- Modify: `ui/layouts/DashboardScreen.tsx`

Adds an optional `scoreHistory` prop to `SleepLarge` so the dashboard can pass a 30-day score sparkline using the same `sleepWeek` data already derived.

- [ ] **Step 1: Add scoreHistory prop to SleepLarge**

In `ui/components/SleepWidgets.tsx`, add to the import line:

```typescript
import { ScoreRing, SleepStagesBar, fmtMin, PositiveNegativeChart, SparklineArea } from '@ui/components/Charts';
```

Replace the `SleepLarge` function signature (lines 45–53):

```typescript
export function SleepLarge({
    session,
    goalMinutes = 480,
    weeklyTrend,
    scoreHistory,
}: {
    session: SleepSession;
    goalMinutes?: number;
    weeklyTrend?: PositiveNegativeEntry[];
    scoreHistory?: Array<{ x: string; y: number }>;
})
```

Inside `SleepLarge`'s JSX, add the sparkline after the stage pills `</div>` and before the `{trendData &&` block:

```tsx
            {scoreHistory && scoreHistory.length > 1 && (
                <div className="column gap-0">
                    <span className="caption">Score trend</span>
                    <SparklineArea
                        data={scoreHistory}
                        color="var(--color-primary)"
                        height={50}
                        id="sleep-score"
                        yDomain={[0, 100]}
                        showXAxis
                        showTooltip
                        tooltipFormatter={(v) => `${v}`}
                    />
                </div>
            )}
```

- [ ] **Step 2: Pass scoreHistory from DashboardScreen**

In `ui/layouts/DashboardScreen.tsx`, after the `weeklyTrend` derivation, add:

```typescript
  const scoreHistory = sleepWeek.map((s) => ({
    x: s.end.toLocaleDateString(undefined, { weekday: 'short' }),
    y: s.score,
  }));
```

Update the existing `<SleepLarge .../>` call to:

```tsx
<SleepLarge session={lastNight} goalMinutes={GOAL_MINUTES} weeklyTrend={weeklyTrend} scoreHistory={scoreHistory} />
```

- [ ] **Step 3: Type-check**

```bash
npx tsc --noEmit
```

- [ ] **Step 4: Run full test suite**

```bash
npx vitest run
```
Expected: all tests pass

- [ ] **Step 5: Commit**

```bash
git add ui/components/SleepWidgets.tsx ui/layouts/DashboardScreen.tsx
git commit -m "feat: show sleep score trend sparkline in dashboard sleep widget"
```

---

---

## Task 8: Strava JSON adapter

**Files:**
- Create: `data/sources/api/strava.ts`
- Create: `data/sources/api/strava.test.ts`

Strava's API returns a `DetailedActivity` object plus optional per-point stream series. This adapter converts both into the canonical `GpsTrack` shape so the same chart components work regardless of data source.

- [ ] **Step 1: Write failing tests**

Create `data/sources/api/strava.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { parseStravaActivity } from './strava';
import type { StravaDetailedActivity, StravaStreams } from './strava';

const ACTIVITY: StravaDetailedActivity = {
  id: 12345,
  sport_type: 'Run',
  elapsed_time: 1800,
  moving_time: 1750,
  distance: 5000,
  total_elevation_gain: 42,
  average_heartrate: 155,
  max_heartrate: 182,
  average_watts: 210,
  kilojoules: 378,
  average_temp: 14,
  start_date: '2026-04-20T07:00:00Z',
  splits_metric: [],
  laps: [],
};

const STREAMS: StravaStreams = {
  time:     { data: [0, 5, 10] },
  latlng:   { data: [[51.429, -0.315], [51.430, -0.314], [51.431, -0.313]] },
  altitude: { data: [5, 6, 7] },
  heartrate:{ data: [150, 155, 160] },
  velocity_smooth: { data: [3.0, 3.1, 3.2] },
  cadence:  { data: [170, 172, 174] },
  watts:    { data: [200, 210, 220] },
  grade_smooth: { data: [1.0, 1.5, 2.0] },
  temp:     { data: [14, 14, 15] },
};

describe('parseStravaActivity', () => {
  it('returns a GpsTrack with correct point count when streams provided', () => {
    const track = parseStravaActivity(ACTIVITY, STREAMS);
    expect(track.points.length).toBe(3);
  });

  it('maps sport to lowercase', () => {
    expect(parseStravaActivity(ACTIVITY, STREAMS).sport).toBe('run');
  });

  it('sets avgHeartRate from activity when no streams', () => {
    const track = parseStravaActivity(ACTIVITY);
    expect(track.avgHeartRate).toBe(155);
  });

  it('sets maxHeartRate from activity', () => {
    expect(parseStravaActivity(ACTIVITY).maxHeartRate).toBe(182);
  });

  it('converts kilojoules to kcal for calories', () => {
    // kJ × 0.239 ≈ kcal; 378 × 0.239 ≈ 90 kcal
    const track = parseStravaActivity(ACTIVITY);
    expect(track.calories).toBeGreaterThan(85);
    expect(track.calories).toBeLessThan(95);
  });

  it('sets duration from elapsed_time', () => {
    expect(parseStravaActivity(ACTIVITY).duration).toBe(1800);
  });

  it('sets totalDistance from activity distance', () => {
    expect(parseStravaActivity(ACTIVITY).totalDistance).toBe(5000);
  });

  it('maps per-point heartrate, speed, grade, temperature from streams', () => {
    const track = parseStravaActivity(ACTIVITY, STREAMS);
    const p = track.points[0];
    expect(p.heartRate).toBe(150);
    expect(p.speed).toBeCloseTo(3.0);
    expect(p.grade).toBe(1.0);
    expect(p.temperature).toBe(14);
  });

  it('works without streams — returns empty points array', () => {
    const track = parseStravaActivity(ACTIVITY);
    expect(track.points).toEqual([]);
  });
});
```

- [ ] **Step 2: Run to confirm they fail**

```bash
npx vitest run data/sources/api/strava.test.ts
```
Expected: FAIL — module not found

- [ ] **Step 3: Create the Strava adapter**

Create `data/sources/api/strava.ts`:

```typescript
import { computeTrackStats } from '@data/sources/files/gps';
import type { GpsTrack, GpsPoint } from '@data/sources/files/gps';

// ─── Strava API types (subset we care about) ──────────────────────────────────

export interface StravaDetailedActivity {
  id: number;
  sport_type: string;         // 'Run', 'Ride', 'Swim', 'WeightTraining', etc.
  elapsed_time: number;       // seconds
  moving_time: number;        // seconds
  distance: number;           // metres
  total_elevation_gain: number;
  average_heartrate?: number;
  max_heartrate?: number;
  average_watts?: number;
  kilojoules?: number;
  average_temp?: number;      // °C
  start_date: string;         // ISO 8601
  splits_metric: unknown[];
  laps: unknown[];
}

export interface StravaStreamSeries<T = number[]> {
  data: T;
}

export interface StravaStreams {
  time?:            StravaStreamSeries;
  latlng?:          StravaStreamSeries<[number, number][]>;
  altitude?:        StravaStreamSeries;
  heartrate?:       StravaStreamSeries;
  cadence?:         StravaStreamSeries;
  velocity_smooth?: StravaStreamSeries;
  watts?:           StravaStreamSeries;
  grade_smooth?:    StravaStreamSeries;
  temp?:            StravaStreamSeries;
}

// ─── Sport normalisation ──────────────────────────────────────────────────────

const SPORT_MAP: Record<string, string> = {
  run: 'run', virtualrun: 'run',
  ride: 'cycle', virtualride: 'cycle', ebikeride: 'cycle',
  swim: 'swim',
  weighttraining: 'lift', workout: 'lift',
  rowing: 'row', rowing_ergometer: 'row',
  hike: 'hike', walk: 'hike',
  alpineski: 'ski', nordicski: 'ski', backcountryski: 'ski',
};

function normaliseSport(raw: string): string {
  const key = raw.toLowerCase().replace(/[^a-z]/g, '');
  return SPORT_MAP[key] ?? key;
}

// ─── Adapter ─────────────────────────────────────────────────────────────────

export function parseStravaActivity(
  activity: StravaDetailedActivity,
  streams?: StravaStreams,
): GpsTrack {
  const sport    = normaliseSport(activity.sport_type);
  const calories = activity.kilojoules != null
    ? Math.round(activity.kilojoules * 0.239)
    : undefined;

  if (!streams || !streams.latlng) {
    return {
      points: [],
      totalDistance:    activity.distance,
      elevationGain:    activity.total_elevation_gain,
      duration:         activity.elapsed_time,
      sport,
      calories,
      avgHeartRate:     activity.average_heartrate,
      maxHeartRate:     activity.max_heartrate,
      avgPower:         activity.average_watts,
      avgTemperature:   activity.average_temp,
      startTimestamp:   activity.start_date,
    };
  }

  const latlngs  = streams.latlng.data;
  const times    = streams.time?.data        ?? [];
  const alts     = streams.altitude?.data    ?? [];
  const hrs      = streams.heartrate?.data   ?? [];
  const cads     = streams.cadence?.data     ?? [];
  const speeds   = streams.velocity_smooth?.data ?? [];
  const watts    = streams.watts?.data       ?? [];
  const grades   = streams.grade_smooth?.data ?? [];
  const temps    = streams.temp?.data        ?? [];

  const t0 = new Date(activity.start_date).getTime();

  const points: GpsPoint[] = latlngs.map(([lat, lng], i) => ({
    lat,
    lng,
    elevation: alts[i] ?? 0,
    timestamp: new Date(t0 + (times[i] ?? i * 5) * 1000).toISOString(),
    ...(hrs[i]    != null ? { heartRate:   hrs[i]    } : {}),
    ...(cads[i]   != null ? { cadence:     cads[i]   } : {}),
    ...(speeds[i] != null ? { speed:       speeds[i] } : {}),
    ...(watts[i]  != null ? { power:       watts[i]  } : {}),
    ...(grades[i] != null ? { grade:       grades[i] } : {}),
    ...(temps[i]  != null ? { temperature: temps[i]  } : {}),
  }));

  const stats = computeTrackStats(points);
  return {
    ...stats,
    points,
    sport,
    calories,
    maxHeartRate: activity.max_heartrate ?? stats.maxHeartRate,
    avgPower:     activity.average_watts  ?? stats.avgPower,
  };
}
```

- [ ] **Step 4: Run tests**

```bash
npx vitest run data/sources/api/strava.test.ts
```
Expected: 9 PASS

- [ ] **Step 5: Type-check**

```bash
npx tsc --noEmit
```

- [ ] **Step 6: Commit**

```bash
git add data/sources/api/strava.ts data/sources/api/strava.test.ts
git commit -m "feat: add Strava activity and streams adapter"
```

---

## Task 9: Garmin wellness types and mock generators

**Files:**
- Create: `data/sources/api/garmin.ts`
- Create: `data/mock/wellness.ts`
- Create: `data/mock/wellness.test.ts`

Garmin Health API returns daily aggregates and time-offset maps for stress, body battery, and HRV. This task defines the canonical TypeScript shapes and adds mock generators for prototyping.

- [ ] **Step 1: Write failing tests**

Create `data/mock/wellness.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import {
  generateMockAllDayHR,
  generateMockStress,
  generateMockBodyBattery,
  generateMockDailySummaries,
} from './wellness';

describe('generateMockAllDayHR', () => {
  it('returns one reading per minute for 24 h', () => {
    expect(generateMockAllDayHR(new Date()).length).toBe(1440);
  });

  it('each entry has a numeric bpm between 40 and 200', () => {
    for (const e of generateMockAllDayHR(new Date())) {
      expect(e.bpm).toBeGreaterThanOrEqual(40);
      expect(e.bpm).toBeLessThanOrEqual(200);
    }
  });

  it('each entry has a valid ISO timestamp', () => {
    const first = generateMockAllDayHR(new Date())[0];
    expect(() => new Date(first.timestamp)).not.toThrow();
    expect(new Date(first.timestamp).getTime()).not.toBeNaN();
  });
});

describe('generateMockStress', () => {
  it('returns one reading per 3 minutes (480 for 24 h)', () => {
    expect(generateMockStress(new Date()).length).toBe(480);
  });

  it('stress values are 0–100', () => {
    for (const e of generateMockStress(new Date())) {
      expect(e.level).toBeGreaterThanOrEqual(0);
      expect(e.level).toBeLessThanOrEqual(100);
    }
  });
});

describe('generateMockBodyBattery', () => {
  it('returns one reading per hour (24 for a day)', () => {
    expect(generateMockBodyBattery(new Date()).length).toBe(24);
  });

  it('charge values are 0–100', () => {
    for (const e of generateMockBodyBattery(new Date())) {
      expect(e.charge).toBeGreaterThanOrEqual(0);
      expect(e.charge).toBeLessThanOrEqual(100);
    }
  });
});

describe('generateMockDailySummaries', () => {
  it('returns the requested number of days', () => {
    expect(generateMockDailySummaries(7).length).toBe(7);
  });

  it('each summary has positive steps and calories', () => {
    for (const s of generateMockDailySummaries(7)) {
      expect(s.steps).toBeGreaterThan(0);
      expect(s.activeKcal).toBeGreaterThanOrEqual(0);
    }
  });

  it('summaries are sorted oldest to newest', () => {
    const summaries = generateMockDailySummaries(7);
    for (let i = 1; i < summaries.length; i++) {
      expect(summaries[i].calendarDate >= summaries[i - 1].calendarDate).toBe(true);
    }
  });
});
```

- [ ] **Step 2: Run to confirm they fail**

```bash
npx vitest run data/mock/wellness.test.ts
```
Expected: FAIL — module not found

- [ ] **Step 3: Create Garmin wellness types**

Create `data/sources/api/garmin.ts`:

```typescript
// Garmin Health API canonical type shapes (subset used by this app)

export interface GarminDailySummary {
  calendarDate: string;           // YYYY-MM-DD
  steps: number;
  activeKcal: number;
  totalKcal: number;
  floorsClimbed?: number;
  intensityMinutes?: number;
  restingHeartRate?: number;
  averageStressLevel?: number;
  bodyBatteryChargedValue?: number;
  bodyBatteryDrainedValue?: number;
}

export interface GarminHeartRateSummary {
  calendarDate: string;
  restingHeartRate: number;
  maxHeartRate: number;
  minHeartRate: number;
  /** offsetSeconds → bpm; covers full 24 h, one entry per minute */
  timeOffsetHeartRateSamples: Record<string, number>;
}

export interface GarminStressSummary {
  calendarDate: string;
  averageStressLevel: number;
  maxStressLevel: number;
  /** offsetSeconds → 0–100 stress level, one entry per 3 min */
  timeOffsetStressLevelValues: Record<string, number>;
}

export interface GarminBodyBatterySummary {
  calendarDate: string;
  charged: number;
  drained: number;
  /** offsetSeconds → 0–100 body battery, one entry per hour */
  timeOffsetBodyBatteryValues: Record<string, number>;
}

export interface GarminHRVSummary {
  calendarDate: string;
  /** ms — average overnight HRV */
  weeklyAvg: number;
  lastNight: number;
  lastFive?: number;
  baseline?: { lowUpper: number; balancedLow: number; balancedUpper: number };
  status?: 'BALANCED' | 'LOW' | 'UNBALANCED';
  /** Array of 5-minute interval HRV readings for the night */
  hrvValues?: number[];
}
```

- [ ] **Step 4: Create wellness mock generators**

Create `data/mock/wellness.ts`:

```typescript
import type {
  GarminDailySummary,
  GarminHeartRateSummary,
  GarminStressSummary,
  GarminBodyBatterySummary,
} from '@data/sources/api/garmin';

export interface AllDayHRPoint { timestamp: string; bpm: number }
export interface StressPoint    { timestamp: string; level: number }
export interface BodyBatteryPoint { timestamp: string; charge: number }

export function generateMockAllDayHR(date: Date): AllDayHRPoint[] {
  const midnight = new Date(date);
  midnight.setHours(0, 0, 0, 0);
  const points: AllDayHRPoint[] = [];
  for (let m = 0; m < 1440; m++) {
    const ts = new Date(midnight.getTime() + m * 60_000);
    // Sleep 0–6h low, activity 7–8h high, workday 8–18 moderate, evening 18–22 lower
    const hour = ts.getHours();
    let base = 60;
    if (hour < 6)       base = 52 + Math.sin(m * 0.04) * 5;
    else if (hour < 8)  base = 90 + Math.sin(m * 0.3) * 20;
    else if (hour < 18) base = 70 + Math.sin(m * 0.07) * 12;
    else                base = 62 + Math.sin(m * 0.05) * 8;
    points.push({
      timestamp: ts.toISOString(),
      bpm: Math.round(Math.max(40, Math.min(200, base))),
    });
  }
  return points;
}

export function generateMockStress(date: Date): StressPoint[] {
  const midnight = new Date(date);
  midnight.setHours(0, 0, 0, 0);
  const points: StressPoint[] = [];
  for (let i = 0; i < 480; i++) {
    const ts = new Date(midnight.getTime() + i * 3 * 60_000);
    const hour = ts.getHours();
    let base = 25;
    if (hour >= 9 && hour < 12)  base = 55 + Math.sin(i * 0.5) * 15;
    else if (hour >= 14 && hour < 17) base = 50 + Math.sin(i * 0.4) * 20;
    else if (hour < 6)           base = 10 + Math.sin(i * 0.2) * 8;
    const level = Math.round(Math.max(0, Math.min(100, base + Math.sin(i * 1.7) * 10)));
    points.push({ timestamp: ts.toISOString(), level });
  }
  return points;
}

export function generateMockBodyBattery(date: Date): BodyBatteryPoint[] {
  const midnight = new Date(date);
  midnight.setHours(0, 0, 0, 0);
  const points: BodyBatteryPoint[] = [];
  // Charges overnight (0–6h), drains through day, slight recovery at lunch
  let charge = 30;
  for (let h = 0; h < 24; h++) {
    const ts = new Date(midnight.getTime() + h * 3_600_000);
    if (h < 6)       charge = Math.min(100, charge + 12 + Math.sin(h) * 3);
    else if (h < 7)  charge = Math.max(0, charge - 5);
    else if (h < 13) charge = Math.max(0, charge - 7 + Math.sin(h) * 2);
    else if (h < 14) charge = Math.min(100, charge + 8);
    else             charge = Math.max(0, charge - 6 + Math.sin(h) * 2);
    points.push({ timestamp: ts.toISOString(), charge: Math.round(charge) });
  }
  return points;
}

export function generateMockDailySummaries(
  days: number,
  endDate: Date = new Date(),
): GarminDailySummary[] {
  const summaries: GarminDailySummary[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(endDate);
    d.setDate(d.getDate() - i);
    const calendarDate = d.toISOString().slice(0, 10);
    const isWeekend = d.getDay() === 0 || d.getDay() === 6;
    const steps = Math.round(
      isWeekend ? 9000 + Math.sin(i * 1.3) * 3000 : 7000 + Math.sin(i * 2.1) * 2500,
    );
    summaries.push({
      calendarDate,
      steps,
      activeKcal: Math.round(steps * 0.04 + Math.sin(i * 0.9) * 50),
      totalKcal: Math.round(1800 + steps * 0.05 + Math.sin(i * 0.7) * 100),
      floorsClimbed: Math.round(4 + Math.abs(Math.sin(i * 1.1)) * 8),
      intensityMinutes: Math.round(Math.max(0, 20 + Math.sin(i * 1.5) * 25)),
      restingHeartRate: Math.round(50 + Math.sin(i * 1.7) * 5),
      averageStressLevel: Math.round(30 + Math.sin(i * 1.3) * 20),
    });
  }
  return summaries;
}
```

- [ ] **Step 5: Run tests**

```bash
npx vitest run data/mock/wellness.test.ts
```
Expected: 8 PASS

- [ ] **Step 6: Type-check**

```bash
npx tsc --noEmit
```

- [ ] **Step 7: Commit**

```bash
git add data/sources/api/garmin.ts data/mock/wellness.ts data/mock/wellness.test.ts
git commit -m "feat: add Garmin wellness types and mock generators"
```

---

## Task 10: Extend nutrition macros and add MFP CSV parser

**Files:**
- Modify: `features/nutrition/domain/types.ts`
- Create: `data/sources/files/nutrition.ts`
- Create: `data/sources/files/nutrition.test.ts`

MyFitnessPal diary CSV has columns: `Date,Meal,Calories,Carbohydrates,Fat,Protein,Fiber,Sugar,Sodium,Cholesterol`. Fiber, Sugar, Sodium, and Cholesterol are not in the current macros shape.

- [ ] **Step 1: Write failing tests for the parser**

Create `data/sources/files/nutrition.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { parseMfpCsv } from './nutrition';

const MFP_CSV = `Date,Meal,Calories,Carbohydrates,Fat,Protein,Fiber,Sugar,Sodium,Cholesterol
2026-04-20,Breakfast,420,52,14,22,6,12,380,55
2026-04-20,Lunch,680,70,24,38,9,8,820,90
2026-04-20,Dinner,550,60,18,32,7,10,640,75
2026-04-20,Snacks,210,28,8,10,3,18,150,0
`;

describe('parseMfpCsv', () => {
  it('returns one entry per non-header row', () => {
    expect(parseMfpCsv(MFP_CSV).length).toBe(4);
  });

  it('maps Meal to NutritionCategory correctly', () => {
    const entries = parseMfpCsv(MFP_CSV);
    expect(entries[0].category).toBe('meal');
    expect(entries[3].category).toBe('snack');
  });

  it('parses kcal from Calories column', () => {
    expect(parseMfpCsv(MFP_CSV)[0].macros!.kcal).toBe(420);
  });

  it('parses protein, carbs, fat', () => {
    const m = parseMfpCsv(MFP_CSV)[1].macros!;
    expect(m.proteinG).toBe(38);
    expect(m.carbsG).toBe(70);
    expect(m.fatG).toBe(24);
  });

  it('parses fiber, sugar, sodium, cholesterol', () => {
    const m = parseMfpCsv(MFP_CSV)[0].macros!;
    expect(m.fiberG).toBe(6);
    expect(m.sugarG).toBe(12);
    expect(m.sodiumMg).toBe(380);
    expect(m.cholesterolMg).toBe(55);
  });

  it('sets name to the Meal value', () => {
    expect(parseMfpCsv(MFP_CSV)[0].name).toBe('Breakfast');
  });

  it('uses the Date column as time (HH:MM defaults to 00:00)', () => {
    expect(parseMfpCsv(MFP_CSV)[0].time).toBe('00:00');
  });

  it('ignores rows where Calories is 0 or blank', () => {
    const csv = `Date,Meal,Calories,Carbohydrates,Fat,Protein,Fiber,Sugar,Sodium,Cholesterol
2026-04-20,Breakfast,0,0,0,0,0,0,0,0
2026-04-20,Totals,1860,210,64,102,25,48,1990,220
`;
    expect(parseMfpCsv(csv).length).toBe(0);
  });
});
```

- [ ] **Step 2: Run to confirm they fail**

```bash
npx vitest run data/sources/files/nutrition.test.ts
```
Expected: FAIL — module not found

- [ ] **Step 3: Extend NutritionMacros in types.ts**

In `features/nutrition/domain/types.ts`, replace all occurrences of the macros inline type with the extended version. There are three places: `NutritionEntry.macros`, `NutritionLoggedPayload.macros`, and `LogNutrition.entry.macros`. Replace each:

```typescript
macros: {
  kcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG?: number;
  sugarG?: number;
  sodiumMg?: number;
  cholesterolMg?: number;
} | null;
```

- [ ] **Step 4: Create the MFP CSV parser**

Create `data/sources/files/nutrition.ts`:

```typescript
import type { NutritionEntry, NutritionCategory } from '@features/nutrition/domain/types';
import type { Id } from '@shared/types';

function mealToCategory(meal: string): NutritionCategory {
  const lower = meal.toLowerCase();
  if (lower === 'snacks') return 'snack';
  return 'meal';
}

const SKIP_MEALS = new Set(['totals', 'total', 'daily totals']);

export function parseMfpCsv(csv: string): NutritionEntry[] {
  const lines = csv.trim().split('\n');
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
  const col = (row: string[], name: string) =>
    row[headers.indexOf(name)]?.trim() ?? '';

  const entries: NutritionEntry[] = [];
  const now = Date.now();

  for (let i = 1; i < lines.length; i++) {
    const row = lines[i].split(',');
    const meal = col(row, 'meal');
    if (SKIP_MEALS.has(meal.toLowerCase())) continue;

    const kcal = parseFloat(col(row, 'calories') || '0');
    if (!kcal) continue;

    entries.push({
      id:       `mfp-${i}` as Id<'NutritionEntry'>,
      userId:   'import' as Id<'User'>,
      category: mealToCategory(meal),
      name:     meal,
      notes:    '',
      time:     '00:00',
      loggedAt: now,
      macros: {
        kcal,
        carbsG:       parseFloat(col(row, 'carbohydrates') || '0'),
        fatG:         parseFloat(col(row, 'fat')           || '0'),
        proteinG:     parseFloat(col(row, 'protein')       || '0'),
        fiberG:       parseFloat(col(row, 'fiber')         || '0') || undefined,
        sugarG:       parseFloat(col(row, 'sugar')         || '0') || undefined,
        sodiumMg:     parseFloat(col(row, 'sodium')        || '0') || undefined,
        cholesterolMg:parseFloat(col(row, 'cholesterol')   || '0') || undefined,
      },
    });
  }

  return entries;
}
```

- [ ] **Step 5: Run tests**

```bash
npx vitest run data/sources/files/nutrition.test.ts
```
Expected: 8 PASS

- [ ] **Step 6: Type-check**

```bash
npx tsc --noEmit
```

- [ ] **Step 7: Commit**

```bash
git add features/nutrition/domain/types.ts data/sources/files/nutrition.ts data/sources/files/nutrition.test.ts
git commit -m "feat: extend NutritionMacros with MFP fields, add MFP CSV parser"
```

---

## Self-review

**Spec coverage:**
- All activity types — infrastructure is format-agnostic (FIT/GPX/TCX); non-GPS activities (lifts, stretching) have no time-series data and are already covered by existing set/block views ✓
- HR over a run — `HROverTimeChart` in Tasks 4/5 ✓
- Resting HR trend — `RestingHRWidget` in Task 6 ✓
- Sleep scores — `scoreHistory` sparkline in Task 7 ✓
- Strava compatibility — `parseStravaActivity` adapter in Task 8 ✓
- Garmin wellness data types — `GarminDailySummary`, `GarminHeartRateSummary`, `GarminStressSummary`, `GarminBodyBatterySummary`, `GarminHRVSummary` in Task 9 ✓
- Garmin grade/temperature/laps in GPS model — Task 1 ✓
- MyFitnessPal nutrition import — `parseMfpCsv` + extended macros in Task 10 ✓
- Mock data functions for prototyping only — all in `data/mock/`, real projections used when available ✓
- Deferred analytics page — explicitly excluded ✓

**Out of scope (future work):**
- All-day HR display widget (data types and generators in place; no UI widget yet)
- Garmin Connect wellness API auth + live data wiring
- Strava OAuth + live data wiring
- MFP file import UI (parser exists; no drag-drop component yet)
- Map rendering for GPS routes (existing `SessionGpsPreview` handles this separately)
- Analytics screen
- API integration replacing mock generators
