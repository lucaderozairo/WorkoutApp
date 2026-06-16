import type { CSSProperties, ReactNode } from 'react';

type RingTone = 'accent' | 'ok' | 'warn' | 'bad';

interface ProgressRingProps {
  value: number; // 0–100
  tone?: RingTone;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  children?: ReactNode;
}

export function ProgressRing({ value, tone = 'accent', size = 'md', className, children }: ProgressRingProps) {
  const clamped = Math.min(100, Math.max(0, value));
  const classes = ['progress-ring', size !== 'md' ? size : '', className].filter(Boolean).join(' ');

  return (
    // eslint-disable-next-line no-restricted-syntax -- conic-gradient fill % must be set at runtime via CSS custom property
    <div
      className={classes}
      data-tone={tone !== 'accent' ? tone : undefined}
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      style={{ '--ring-fill': `${clamped}%` } as CSSProperties}
    >
      {children}
    </div>
  );
}
