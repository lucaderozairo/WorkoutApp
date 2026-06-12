import { distanceMeters } from "@shared/geo";

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

export function computeTrackStats(
  points: GpsPoint[],
): Omit<GpsTrack, "points"> {
  // Aggregate fields computable from any number of points
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

  if (points.length < 2) {
    return {
      totalDistance: 0,
      elevationGain: 0,
      duration: 0,
      startTimestamp: points[0]?.timestamp,
      avgHeartRate,
      maxHeartRate,
      avgPower,
      avgTemperature,
    };
  }

  let totalDistance = 0;
  let elevationGain = 0;

  for (let i = 1; i < points.length; i++) {
    totalDistance += distanceMeters(
      [points[i - 1].lat, points[i - 1].lng],
      [points[i].lat, points[i].lng],
    );
    const elevDiff = points[i].elevation - points[i - 1].elevation;
    if (elevDiff > 0) elevationGain += elevDiff;
  }

  const startMs = new Date(points[0].timestamp).getTime();
  const endMs = new Date(points[points.length - 1].timestamp).getTime();
  const duration = (endMs - startMs) / 1000;

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
}

export function parseGpx(xml: string): GpsTrack {
  const doc = new DOMParser().parseFromString(xml, "application/xml");
  const trkpts = Array.from(doc.querySelectorAll("trkpt"));

  const points: GpsPoint[] = trkpts.map((pt) => {
    const lat = parseFloat(pt.getAttribute("lat") ?? "0");
    const lng = parseFloat(pt.getAttribute("lon") ?? "0");
    const ele = parseFloat(pt.querySelector("ele")?.textContent ?? "0");
    const time =
      pt.querySelector("time")?.textContent ?? new Date(0).toISOString();

    const hrEl = pt.querySelector("hr");
    const cadEl = pt.querySelector("cad");

    return {
      lat,
      lng,
      elevation: isNaN(ele) ? 0 : ele,
      timestamp: time,
      ...(hrEl ? { heartRate: parseInt(hrEl.textContent ?? "0", 10) } : {}),
      ...(cadEl ? { cadence: parseInt(cadEl.textContent ?? "0", 10) } : {}),
    };
  });

  return { points, ...computeTrackStats(points) };
}

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

const SEMICIRCLES_TO_DEGREES = 180 / 2 ** 31;

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
        ...(r.heartRate   != null ? { heartRate:   r.heartRate   as number } : {}),
        ...(r.cadence     != null ? { cadence:     r.cadence     as number } : {}),
        ...(r.speed       != null ? { speed:       r.speed       as number } : {}),
        ...(r.power       != null ? { power:       r.power       as number } : {}),
        ...(r.grade       != null ? { grade:       r.grade       as number } : {}),
        ...(r.temperature != null ? { temperature: r.temperature as number } : {}),
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

export async function parseGpsFile(file: File): Promise<GpsTrack> {
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (ext === "gpx") return parseGpx(await file.text());
  if (ext === "tcx") return parseTcx(await file.text());
  if (ext === "fit") return await parseFit(await file.arrayBuffer());
  throw new Error(`Unsupported format: ${ext}`);
}
