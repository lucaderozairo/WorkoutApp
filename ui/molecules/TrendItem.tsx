import type { ReactNode } from 'react';
import { Row } from '@ui/layout/Row';
import { Text } from '@ui/atoms';

interface TrendItemProps {
  label: ReactNode;
  value: ReactNode;
  trailing?: ReactNode;
  className?: string;
}

export function TrendItem({ label, value, trailing, className }: TrendItemProps) {
  return (
    <Row align="center" className={['trend-item', className].filter(Boolean).join(' ')}>
      <div className="min-w-0">{label}</div>
      <Text as="span" size="caption" color="muted">{value}</Text>
      {trailing}
    </Row>
  );
}
