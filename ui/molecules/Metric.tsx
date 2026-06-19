// .metric CSS sets display:inline-flex, align-items:baseline, gap:s-2
// so value + unit sit inline without a Row wrapper
import { Text } from '@ui/atoms';

interface MetricProps {
  value: string | number;
  unit?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  mono?: boolean;
  className?: string;
}

export function Metric({ value, unit, size = 'md', mono, className }: MetricProps) {
  const classes = ['metric', size !== 'md' ? size : '', mono ? 'mono' : '', className].filter(Boolean).join(' ');
  return (
    <span className={classes}>
      <Text as="span">{value}</Text>
      {unit && <Text as="span" size="caption" color="muted" className="unit">{unit}</Text>}
    </span>
  );
}
