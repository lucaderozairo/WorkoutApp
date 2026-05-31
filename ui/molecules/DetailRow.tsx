import type { ReactNode } from 'react';
import { Row } from '@ui/layout/Row';

interface DetailRowProps {
  label: ReactNode;
  value: ReactNode;
  mono?: boolean;
  className?: string;
}

export function DetailRow({ label, value, mono = false, className }: DetailRowProps) {
  // .q-row is a container context; the inner Row (a descendant) is what the
  // container query restyles — it stacks when the row is in a narrow cell.
  return (
    <div className="q-row">
      <Row justify="between" align="center" className={className}>
        <span className="caption">{label}</span>
        <span className={mono ? 'caption mono' : 'value'}>{value}</span>
      </Row>
    </div>
  );
}
