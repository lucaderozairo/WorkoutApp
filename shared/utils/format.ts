/**
 * Presentation formatters for durations, paces, and dates.
 *
 * These were previously hand-rolled (and subtly divergent) in a dozen UI files.
 * The canonical unit is the SI-ish base — seconds for time, seconds-per-km for
 * pace — with thin wrappers for the other units call sites happen to hold.
 */

export interface DurationOptions {
  /** Show second-level granularity ("1h 5m 9s") instead of minute precision. */
  seconds?: boolean;
}

/**
 * Format a duration given in **seconds**.
 *
 * Minute precision (default): `"1h 5m"`, `"2h"` (a zero minute is dropped),
 * `"45 min"` under the hour.
 * Second precision (`{ seconds: true }`): `"1h 5m 9s"`, `"5m 9s"`, `"9s"`.
 */
export function formatDuration(totalSeconds: number, opts?: DurationOptions): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const secs = s % 60;

  if (opts?.seconds) {
    if (hours > 0) return `${hours}h ${minutes}m ${secs}s`;
    if (minutes > 0) return `${minutes}m ${secs}s`;
    return `${secs}s`;
  }

  if (hours > 0) return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  return `${minutes} min`;
}

/** Milliseconds convenience wrapper around {@link formatDuration}. */
export function formatDurationMs(ms: number, opts?: DurationOptions): string {
  return formatDuration(ms / 1000, opts);
}

/** Pace in seconds-per-km for a duration (s) covering a distance (m). 0 if either is missing. */
export function paceSecPerKm(durationSeconds: number, distanceMeters: number): number {
  if (durationSeconds <= 0 || distanceMeters <= 0) return 0;
  return durationSeconds / (distanceMeters / 1000);
}

export interface PaceOptions {
  /** Append "/km" to the formatted value. */
  suffix?: boolean;
  /** Returned for a non-positive pace. Defaults to "--:--". */
  empty?: string;
}

/** Format a seconds-per-km pace as `"5:30"` (or `"5:30/km"` with `suffix`). */
export function formatPace(secPerKm: number, opts?: PaceOptions): string {
  if (secPerKm <= 0) return opts?.empty ?? '--:--';
  const total = Math.round(secPerKm);
  const m = Math.floor(total / 60);
  const s = total % 60;
  const base = `${m}:${String(s).padStart(2, '0')}`;
  return opts?.suffix ? `${base}/km` : base;
}

/** ISO date (`YYYY-MM-DD`). Accepts a Date, epoch ms, ISO string, or null/undefined (→ today). */
export function toIsoDate(value?: number | string | Date | null): string {
  const d = value == null ? new Date() : value instanceof Date ? value : new Date(value);
  return d.toISOString().split('T')[0];
}
