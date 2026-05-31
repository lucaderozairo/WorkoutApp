import type { ReactNode } from 'react';
import { Metric } from '@ui/atoms/Metric';

interface StatDisplayProps {
  label: string;
  value: string | number;
  unit?: string;
  size?: 'sm' | 'md' | 'lg';
  badge?: ReactNode;
  trend?: 'up' | 'down' | 'flat';
}

const TREND_ICON: Record<'up' | 'down' | 'flat', string> = { up: '↑', down: '↓', flat: '→' };

export function StatDisplay({ label, value, unit, size = 'md', badge, trend }: StatDisplayProps) {
  return (
    <div className="column compact">
      <span className="caption muted">{label}</span>
      <div className="row align-center">
        <Metric value={value} unit={unit} size={size} />
        {trend && <span className={`caption ${trend === 'up' ? 'positive' : trend === 'down' ? 'negative' : 'muted'}`}>{TREND_ICON[trend]}</span>}
      </div>
      {badge}
    </div>
  );
}
