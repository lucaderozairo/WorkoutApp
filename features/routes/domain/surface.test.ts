import { describe, expect, it } from 'vitest';
import { summarizeSurfaceMix } from './surface';

describe('route surface domain', () => {
  it('summarizes segment distance as percentages', () => {
    expect(summarizeSurfaceMix([
      { fromKm: 0, toKm: 3, surface: 'paved' },
      { fromKm: 3, toKm: 5, surface: 'trail' },
    ], 5)).toEqual({
      paved: 60,
      gravel: 0,
      trail: 40,
      unpaved: 0,
      unknown: 0,
    });
  });
});
