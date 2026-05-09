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
  rowing: 'row', rowingergometer: 'row',
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
