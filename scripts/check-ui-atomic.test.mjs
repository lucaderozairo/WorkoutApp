import { describe, expect, it } from 'vitest';
import {
  compareViolations,
  formatReport,
  scanSource,
  violationKey,
} from './check-ui-atomic.mjs';

describe('check-ui-atomic', () => {
  it('allows atomic composition in screens', () => {
    const source = `
      import { Grid } from '@ui/layout';
      import { Button } from '@ui/molecules';
      export function GoodScreen() {
        return <Grid className="route-planner-screen"><Button>Save route</Button></Grid>;
      }
    `;

    expect(scanSource(source, 'ui/screens/routes/GoodScreen.tsx')).toEqual([]);
  });

  it('flags raw controls, overlays, ad hoc layering, inline styles, and screen visual classes', () => {
    const source = `
      export function BadScreen() {
        return <section className="custom-card">
          <button className="absolute">Save</button>
          <div className="modal-overlay" />
          <span style={{ color: 'red' }}>Bad</span>
        </section>;
      }
    `;

    const categories = scanSource(source, 'ui/screens/BadScreen.tsx').map((violation) => violation.category);

    expect(categories).toContain('raw-control');
    expect(categories).toContain('raw-overlay');
    expect(categories).toContain('ad-hoc-layering');
    expect(categories).toContain('inline-style');
    expect(categories).toContain('screen-visual-class');
  });

  it('allows documented runtime CSS custom-property inline exceptions', () => {
    const source = `
      export function Segment() {
        return (
          <>
            {/* eslint-disable-next-line no-restricted-syntax -- Runtime CSS custom property. */}
            <span style={{ '--mix-pct': '20%' }} />
          </>
        );
      }
    `;

    expect(scanSource(source, 'ui/components/routes/Segment.tsx')).toEqual([]);
  });

  it('separates new violations from baseline violations', () => {
    const current = scanSource('<button>Save</button>', 'ui/components/Legacy.tsx');
    const baseline = {
      violations: current.map(({ category, file, snippet }) => ({ category, file, snippet })),
    };

    const cleanComparison = compareViolations(current, baseline);
    expect(cleanComparison.newViolations).toHaveLength(0);
    expect(cleanComparison.baselineViolations).toHaveLength(1);

    const next = [
      ...current,
      ...scanSource('<input />', 'ui/components/NewDebt.tsx'),
    ];
    const comparison = compareViolations(next, baseline);
    expect(comparison.newViolations).toHaveLength(1);
    expect(violationKey(comparison.newViolations[0])).toContain('NewDebt.tsx');
    expect(formatReport(comparison)).toContain('ERROR');
  });
});
