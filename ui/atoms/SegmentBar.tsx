import type { CSSProperties } from 'react';

interface SegmentBarProps {
  value: number;
  max: number;
  segments?: number;
  /** CSS custom-property token name for filled segments, e.g. 'c-cardio'. No domain vocabulary. */
  color?: string;
  className?: string;
}

const DEFAULT_SEGMENTS = 14;

export function SegmentBar({ value, max, segments = DEFAULT_SEGMENTS, color, className }: SegmentBarProps) {
  const filled = max > 0 ? Math.round((value / max) * segments) : 0;
  const wrapperClass = ['seg-bar', className ?? ''].filter(Boolean).join(' ');
  const style = color ? ({ '--seg-color': `var(--${color})` } as CSSProperties) : undefined;

  return (
    // eslint-disable-next-line no-restricted-syntax -- Dynamic CSS custom property keeps segment color tokenized while caller owns meaning.
    <div className={wrapperClass} style={style}>
      {Array.from({ length: segments }, (_, i) => (
        <div key={i} className={i < filled ? 'seg filled' : 'seg'} />
      ))}
    </div>
  );
}
