type ProgressVariant = 'ok' | 'warn' | 'bad' | 'accent';

interface ProgressBarProps {
  value: number;
  variant?: ProgressVariant;
  size?: 'sm' | 'md';
  className?: string;
}

export function ProgressBar({ value, variant, size = 'md', className }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value));
  const classes = ['bar', size !== 'md' ? size : '', className].filter(Boolean).join(' ');

  return (
    <div className={classes} role="progressbar" aria-valuenow={clamped} aria-valuemin={0} aria-valuemax={100}>
      <div className={['fill', variant].filter(Boolean).join(' ')} style={{ width: `${clamped}%` }} />
    </div>
  );
}
