import type { CSSProperties } from 'react';
import { Row, Cluster } from '@ui/layout';
import { Text } from '@ui/atoms';

export interface SurfaceEntry {
  key: string;
  label: string;
  pct: number;
}

interface SurfaceMixBarProps {
  surfaces: SurfaceEntry[];
  showLegend?: boolean;
}

export function SurfaceMixBar({ surfaces, showLegend = true }: SurfaceMixBarProps) {
  const visible = surfaces.filter(s => s.pct > 0);
  return (
    <>
      <Row gap={0} className="surface-mix-bar">
        {visible.map(s => (
          <span
            key={s.key}
            className="surface-mix-segment"
            data-surface={s.key}
            // eslint-disable-next-line no-restricted-syntax -- CSS custom property drives segment widths
            style={{ '--mix-pct': `${s.pct}%` } as CSSProperties}
            title={`${s.label}: ${s.pct}%`}
          />
        ))}
      </Row>
      {showLegend && visible.length > 0 && (
        <Cluster className="gap-1">
          {visible.map(s => (
            <Row key={s.key} align="center" gap={1}>
              <span className="surface-mix-swatch" data-surface={s.key} />
              <Text size="caption">{s.label}</Text>
              <Text size="caption" color="muted" mono>{s.pct}%</Text>
            </Row>
          ))}
        </Cluster>
      )}
    </>
  );
}
