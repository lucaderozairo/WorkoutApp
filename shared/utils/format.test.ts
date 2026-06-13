import { describe, it, expect } from 'vitest';
import { formatDuration, formatDurationMs, paceSecPerKm, formatPace, toIsoDate } from './format';

describe('formatDuration', () => {
  it('formats sub-hour durations as minutes', () => {
    expect(formatDuration(45 * 60)).toBe('45 min');
    expect(formatDuration(0)).toBe('0 min');
  });

  it('drops a zero minute over the hour', () => {
    expect(formatDuration(2 * 3600)).toBe('2h');
    expect(formatDuration(3661)).toBe('1h 1m');
  });

  it('clamps negatives and floors fractional seconds', () => {
    expect(formatDuration(-50)).toBe('0 min');
    expect(formatDuration(119)).toBe('1 min');
  });

  it('shows second precision when requested', () => {
    expect(formatDuration(3661, { seconds: true })).toBe('1h 1m 1s');
    expect(formatDuration(75, { seconds: true })).toBe('1m 15s');
    expect(formatDuration(9, { seconds: true })).toBe('9s');
  });
});

describe('formatDurationMs', () => {
  it('converts milliseconds before formatting', () => {
    expect(formatDurationMs(90_000)).toBe('1 min'); // 90s → 1m (floored)
    expect(formatDurationMs(3_661_000, { seconds: true })).toBe('1h 1m 1s');
  });
});

describe('paceSecPerKm', () => {
  it('computes seconds per km', () => {
    expect(paceSecPerKm(1800, 6000)).toBe(300); // 30 min / 6 km = 5:00/km
  });

  it('returns 0 when duration or distance is missing', () => {
    expect(paceSecPerKm(0, 6000)).toBe(0);
    expect(paceSecPerKm(1800, 0)).toBe(0);
  });
});

describe('formatPace', () => {
  it('formats seconds-per-km as m:ss', () => {
    expect(formatPace(300)).toBe('5:00');
    expect(formatPace(330)).toBe('5:30');
    expect(formatPace(305.7)).toBe('5:06'); // rounds to the nearest second
  });

  it('appends a suffix when asked', () => {
    expect(formatPace(330, { suffix: true })).toBe('5:30/km');
  });

  it('returns the placeholder for a non-positive pace', () => {
    expect(formatPace(0)).toBe('--:--');
    expect(formatPace(0, { empty: '' })).toBe('');
  });
});

describe('toIsoDate', () => {
  it('formats every accepted input as YYYY-MM-DD', () => {
    expect(toIsoDate(new Date('2026-06-13T10:00:00Z'))).toBe('2026-06-13');
    expect(toIsoDate(Date.UTC(2026, 5, 13))).toBe('2026-06-13');
    expect(toIsoDate('2026-06-13T23:59:00Z')).toBe('2026-06-13');
  });

  it('defaults to today for null/undefined', () => {
    expect(toIsoDate(null)).toBe(new Date().toISOString().split('T')[0]);
    expect(toIsoDate()).toBe(new Date().toISOString().split('T')[0]);
  });
});
