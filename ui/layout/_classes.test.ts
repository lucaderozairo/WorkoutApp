import { describe, expect, it } from 'vitest';
import { layoutClasses } from './_classes';

describe('layoutClasses', () => {
  it('omits the grow class by default', () => {
    expect(layoutClasses({ base: 'row', defaultGap: 3 })).toBe('row');
  });

  it('appends the grow class when grow is true', () => {
    expect(layoutClasses({ base: 'row', defaultGap: 3, grow: true })).toBe('row grow');
  });

  it('omits the grow class when grow is explicitly false', () => {
    expect(layoutClasses({ base: 'row', defaultGap: 3, grow: false })).toBe('row');
  });

  it('combines grow with other modifiers in a stable order', () => {
    expect(
      layoutClasses({ base: 'column', defaultGap: 4, align: 'center', wrap: true, grow: true, className: 'custom' }),
    ).toBe('column align-center wrap grow custom');
  });
});
