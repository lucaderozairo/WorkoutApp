import { describe, it, expect } from 'vitest';
import { formatPace, parsePace, buildMarkers } from './markers';

describe('formatPace', () => {
  it('formats whole minutes', () => {
    expect(formatPace(300)).toBe('5:00');
  });
  it('formats seconds with leading zero', () => {
    expect(formatPace(330)).toBe('5:30');
  });
  it('formats single-digit seconds', () => {
    expect(formatPace(305)).toBe('5:05');
  });
  it('rounds float input to nearest second', () => {
    expect(formatPace(305.7)).toBe('5:06');
  });
});

describe('parsePace', () => {
  it('parses MM:SS string to total seconds', () => {
    expect(parsePace('5:00')).toBe(300);
  });
  it('parses MM:SS with non-zero seconds', () => {
    expect(parsePace('5:30')).toBe(330);
  });
  it('clamps seconds to 59', () => {
    expect(parsePace('5:99')).toBe(359);
  });
  it('returns 0 for empty string', () => {
    expect(parsePace('')).toBe(0);
  });
});

describe('buildMarkers', () => {
  it('produces one marker for exactly one interval', () => {
    const m = buildMarkers(1, 300, 1);
    expect(m).toHaveLength(1);
    expect(m[0].distanceKm).toBe(1);
    expect(m[0].cumulativeTime).toBe('5:00');
  });

  it('produces markers at each interval and final distance', () => {
    const m = buildMarkers(3, 300, 1);
    expect(m.map(x => x.distanceKm)).toEqual([1, 2, 3]);
    expect(m.map(x => x.cumulativeTime)).toEqual(['5:00', '10:00', '15:00']);
  });

  it('includes a partial final marker when total is not a round number', () => {
    const m = buildMarkers(1.5, 300, 1);
    expect(m).toHaveLength(2);
    expect(m[1].distanceKm).toBe(1.5);
    expect(m[1].cumulativeTime).toBe('7:30');
  });

  it('uses 5 km intervals for cycles (caller responsibility to pass correct interval)', () => {
    const m = buildMarkers(10, 120, 5);
    expect(m.map(x => x.distanceKm)).toEqual([5, 10]);
  });

  it('avoids float drift with sub-km intervals', () => {
    const m = buildMarkers(1, 300, 0.5);
    expect(m).toHaveLength(2);
    expect(m[0].distanceKm).toBe(0.5);
    expect(m[1].distanceKm).toBe(1);
  });
});
