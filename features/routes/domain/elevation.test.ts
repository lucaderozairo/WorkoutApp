import { describe, expect, it } from 'vitest';
import { applyGrades, summarizeElevation } from './elevation';

describe('route elevation domain', () => {
  it('summarizes gain and loss', () => {
    expect(summarizeElevation([
      { distanceKm: 0, elevationM: 10, grade: 0 },
      { distanceKm: 1, elevationM: 25, grade: 1.5 },
      { distanceKm: 2, elevationM: 20, grade: -0.5 },
    ])).toEqual({ gainM: 15, lossM: 5 });
  });

  it('applies distance and grade samples', () => {
    const samples = applyGrades([[51.5, -0.1], [51.501, -0.1]], [10, 20]);
    expect(samples[0]).toEqual({ distanceKm: 0, elevationM: 10, grade: 0 });
    expect(samples[1].distanceKm).toBeGreaterThan(0);
    expect(samples[1].grade).toBeGreaterThan(0);
  });
});
