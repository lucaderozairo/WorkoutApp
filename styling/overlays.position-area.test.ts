import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// position-area rejects a value that mixes physical (top/bottom/left/right/
// span-top/span-bottom/span-left/span-right) and logical (block-*/inline-*/
// span-block-*/span-inline-*) keywords — the whole declaration is dropped
// silently, leaving position-area at its initial value 'none'. This caused
// the session-list action menu to render pinned to the top-left of the
// viewport instead of anchored under its trigger. Guard against reintroducing
// a mixed pair.
const PHYSICAL = new Set(['top', 'bottom', 'left', 'right', 'span-top', 'span-bottom', 'span-left', 'span-right']);
const LOGICAL = new Set([
  'block-start', 'block-end', 'inline-start', 'inline-end',
  'span-block-start', 'span-block-end', 'span-inline-start', 'span-inline-end',
]);

describe('overlays.css position-area keywords', () => {
  it('never mixes physical and logical keywords in the same declaration', () => {
    const css = readFileSync(resolve(process.cwd(), 'styling/overlays.css'), 'utf8');
    const values = [...css.matchAll(/position-area:\s*([^;{}()]+);/g)].map(m => m[1].trim());

    expect(values.length).toBeGreaterThan(0);
    for (const value of values) {
      const tokens = value.split(/\s+/);
      const hasPhysical = tokens.some(t => PHYSICAL.has(t));
      const hasLogical = tokens.some(t => LOGICAL.has(t));
      expect(hasPhysical && hasLogical, `mixed physical/logical keywords in "position-area: ${value}"`).toBe(false);
    }
  });
});
