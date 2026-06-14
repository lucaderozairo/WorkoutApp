import { describe, expect, it } from 'vitest';
import { estimateTargetDuration, validatePaceTarget } from './paceTargets';

describe('planning pace targets', () => {
  it('estimates full-route target duration', () => {
    expect(estimateTargetDuration(5, { kind: 'full', paceSecPerKm: 300 })).toBe(1500);
  });

  it('estimates segment target duration', () => {
    expect(estimateTargetDuration(5, {
      kind: 'segments',
      segments: [
        { fromKm: 0, toKm: 2, paceSecPerKm: 300 },
        { fromKm: 2, toKm: 5, paceSecPerKm: 360 },
      ],
    })).toBe(1680);
  });

  it('validates segment ranges', () => {
    expect(validatePaceTarget(5, {
      kind: 'segments',
      segments: [{ fromKm: 4, toKm: 6, paceSecPerKm: 300 }],
    })).toBe('Segment ranges must fit inside the route');
  });
});
