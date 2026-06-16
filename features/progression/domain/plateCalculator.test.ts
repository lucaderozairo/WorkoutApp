import { describe, it, expect } from 'vitest';
import { calculatePlates } from './plateCalculator';

describe('calculatePlates', () => {
  it('returns empty perSide and zero remainder for bar-only weight', () => {
    const result = calculatePlates(20, 20);
    expect(result.perSide).toEqual([]);
    expect(result.remainderKg).toBe(0);
    expect(result.targetWeightKg).toBe(20);
    expect(result.barWeightKg).toBe(20);
  });

  it('returns empty for sub-bar weight', () => {
    const result = calculatePlates(15, 20);
    expect(result.perSide).toEqual([]);
    expect(result.remainderKg).toBe(0);
  });

  it('calculates plates for 60kg with standard plates', () => {
    const result = calculatePlates(60, 20);
    // 60 - 20 = 40 total → 20 per side
    // 20 → one 20kg plate per side
    expect(result.perSide).toEqual([20]);
    expect(result.remainderKg).toBe(0);
  });

  it('calculates plates for 100kg', () => {
    const result = calculatePlates(100, 20);
    // 100 - 20 = 80 total → 40 per side
    // 40 = 25 + 15
    expect(result.perSide).toEqual([25, 15]);
    expect(result.remainderKg).toBe(0);
  });

  it('calculates plates for 80kg', () => {
    const result = calculatePlates(80, 20);
    // 80 - 20 = 60 total → 30 per side
    // 30 = 25 + 5
    expect(result.perSide).toEqual([25, 5]);
    expect(result.remainderKg).toBe(0);
  });

  it('handles remainder when exact plates unavailable', () => {
    const result = calculatePlates(63, 20);
    // 63 - 20 = 43 total → 21.5 per side
    // 21.5 = 20 + 1.25 = 21.25, remainder 0.25
    expect(result.perSide).toEqual([20, 1.25]);
    expect(result.remainderKg).toBe(0.25);
  });

  it('uses custom bar weight', () => {
    const result = calculatePlates(70, 15);
    // 70 - 15 = 55 total → 27.5 per side
    // 27.5 = 25 + 2.5
    expect(result.perSide).toEqual([25, 2.5]);
    expect(result.remainderKg).toBe(0);
  });

  it('uses custom available plates', () => {
    const result = calculatePlates(50, 20, [10, 5, 2.5]);
    // 50 - 20 = 30 total → 15 per side
    // 15 = 10 + 5
    expect(result.perSide).toEqual([10, 5]);
    expect(result.remainderKg).toBe(0);
  });

  it('handles heavy weights with multiple plates', () => {
    const result = calculatePlates(200, 20);
    // 200 - 20 = 180 total → 90 per side
    // 90 = 25 + 25 + 25 + 15
    expect(result.perSide).toEqual([25, 25, 25, 15]);
    expect(result.remainderKg).toBe(0);
  });
});
