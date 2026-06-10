import type { CSSProperties } from 'react';

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
  const fillStyle = { '--fill': `${clamped}%` } as CSSProperties;

  return (
    <div className={classes} role="progressbar" aria-valuenow={clamped} aria-valuemin={0} aria-valuemax={100}>
      {/* eslint-disable-next-line no-restricted-syntax -- Progress value must drive the tokenized --fill custom property at runtime. */}
      <div className={['fill', variant].filter(Boolean).join(' ')} style={fillStyle} />
    </div>
  );
}
