import type { CSSProperties } from 'react';

export interface MultiSegment {
  pct: number;
  color: string; // CSS token name without -- prefix, e.g. 'color-sleep-deep'
  label?: string;
}

interface MultiSegmentBarProps {
  segments: MultiSegment[];
  size?: 'sm' | 'md';
  className?: string;
  'aria-label'?: string;
}

export function MultiSegmentBar({ segments, size = 'sm', className, 'aria-label': ariaLabel }: MultiSegmentBarProps) {
  const classes = ['bar', 'multi', size !== 'sm' ? size : '', className].filter(Boolean).join(' ');

  return (
    <div className={classes} aria-label={ariaLabel}>
      {segments.map((seg, i) => (
        // eslint-disable-next-line no-restricted-syntax -- width and color driven by runtime values via CSS custom properties
        <div
          key={i}
          className="fill"
          style={{ '--fill': `${seg.pct}%`, '--bar-color': `var(--${seg.color})` } as CSSProperties}
          aria-label={seg.label}
        />
      ))}
    </div>
  );
}
