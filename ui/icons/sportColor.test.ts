import { describe, it, expect } from 'vitest';
import { sportColorClass, sportColorToken, sportColorVar } from './sportColor';

describe('sportColorClass', () => {
  it('maps core sports to their semantic class', () => {
    expect(sportColorClass('run')).toBe('run');
    expect(sportColorClass('cycle')).toBe('cycle');
    expect(sportColorClass('swim')).toBe('swim');
    expect(sportColorClass('row')).toBe('rowing');
  });

  it('falls back to the strength class for everything else', () => {
    expect(sportColorClass('strength')).toBe('lift');
    expect(sportColorClass('hike')).toBe('lift');
    expect(sportColorClass('unknown-sport')).toBe('lift');
  });
});

describe('sportColorToken', () => {
  it('derives the design token from the class', () => {
    expect(sportColorToken('run')).toBe('c-cardio');
    expect(sportColorToken('row')).toBe('c-recovery');
    expect(sportColorToken('strength')).toBe('c-strength');
  });
});

describe('sportColorVar', () => {
  it('wraps the token in a CSS var reference', () => {
    expect(sportColorVar('run')).toBe('var(--c-cardio)');
    expect(sportColorVar('hike')).toBe('var(--c-strength)');
  });
});
