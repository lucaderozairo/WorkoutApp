import type { ReactNode } from 'react';
import { Metric } from '@ui/atoms/Metric';
import { Row } from '@ui/layout/Row';
import { Column } from '@ui/layout/Column';

interface StatDisplayProps {
  label: string;
  value: string | number;
  unit?: string;
  size?: 'sm' | 'md' | 'lg';
  badge?: ReactNode;
  trend?: 'up' | 'down' | 'flat';
}

const TREND_ICON: Record<'up' | 'down' | 'flat', string> = { up: '↑', down: '↓', flat: '→' };
const TREND_COLOR: Record<'up' | 'down' | 'flat', string> = { up: 'positive', down: 'negative', flat: 'muted' };

export function StatDisplay({ label, value, unit, size = 'md', badge, trend }: StatDisplayProps) {
  return (
    <Column gap={1}>
      <span className="caption muted">{label}</span>
      <Row align="center">
        <Metric value={value} unit={unit} size={size} />
        {trend && <span className={`caption ${TREND_COLOR[trend]}`}>{TREND_ICON[trend]}</span>}
      </Row>
      {badge}
    </Column>
  );
}
