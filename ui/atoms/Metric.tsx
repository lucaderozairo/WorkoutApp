import { Row } from '../layout/Row';

interface MetricProps {
  value: string | number;
  unit?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function Metric({ value, unit, size = 'md', className }: MetricProps) {
  const classes = ['metric', size !== 'md' ? size : '', className].filter(Boolean).join(' ');

  return (
    <Row as="span" align="baseline" gap={2} className={classes}>
      <span>{value}</span>
      {unit && <span className="unit muted">{unit}</span>}
    </Row>
  );
}
