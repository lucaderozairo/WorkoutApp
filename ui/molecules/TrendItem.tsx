import type { ReactNode } from 'react';
import { Row } from '@ui/layout/Row';

interface TrendItemProps {
  label: ReactNode;
  value: ReactNode;
  trailing?: ReactNode;
  className?: string;
}

export function TrendItem({ label, value, trailing, className }: TrendItemProps) {
  return (
    <Row align="center" className={['trend-item', className].filter(Boolean).join(' ')}>
      <div className="grow">{label}</div>
      <span className="caption muted">{value}</span>
      {trailing}
    </Row>
  );
}
