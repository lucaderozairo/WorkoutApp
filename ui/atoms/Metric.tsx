// .metric CSS sets display:inline-flex, align-items:baseline, gap:s-2
// so value + unit sit inline without a Row wrapper

interface MetricProps {
  value: string | number;
  unit?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function Metric({ value, unit, size = 'md', className }: MetricProps) {
  const classes = ['metric', size !== 'md' ? size : '', className].filter(Boolean).join(' ');
  return (
    <span className={classes}>
      <span>{value}</span>
      {unit && <span className="unit muted">{unit}</span>}
    </span>
  );
}
