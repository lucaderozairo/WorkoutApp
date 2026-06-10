import type { ReactNode } from 'react';
import { Surface } from '@ui/atoms/Surface';
import { Column } from '@ui/layout/Column';

interface StatTileProps {
  value: ReactNode;
  unit?: string;
  label: string;
  className?: string;
}

export function StatTile({ value, unit, label, className }: StatTileProps) {
  return (
    <Surface variant="flat" pad="sm" className={['min-w-0', 'q-tile', className].filter(Boolean).join(' ')}>
      <Column gap={1} align="center">
        <span className="mono detail">
          {value}
          {unit && <span className="caption muted"> {unit}</span>}
        </span>
        <span className="eyebrow">{label}</span>
      </Column>
    </Surface>
  );
}
