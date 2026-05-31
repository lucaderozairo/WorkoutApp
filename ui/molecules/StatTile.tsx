import type { ReactNode } from 'react';

interface StatTileProps {
  value: ReactNode;
  unit?: string;
  label: string;
  className?: string;
}

export function StatTile({ value, unit, label, className }: StatTileProps) {
  const classes = ['surface', 'tight', 'flat', 'compact', 'column', 'grow', 'align-center', 'q-tile', className]
    .filter(Boolean).join(' ');
  return (
    <div className={classes}>
      <span className="mono detail">{value}{unit && <span className="caption muted"> {unit}</span>}</span>
      <span className="eyebrow">{label}</span>
    </div>
  );
}
