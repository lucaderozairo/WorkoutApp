interface SegmentBarProps {
  value: number;
  max: number;
  segments?: number;
  /** Sport/category accent applied to filled segments, e.g. 'run' | 'cycle' | 'strength'. */
  variant?: string;
  className?: string;
}

const DEFAULT_SEGMENTS = 14;

export function SegmentBar({ value, max, segments = DEFAULT_SEGMENTS, variant, className }: SegmentBarProps) {
  const filled = max > 0 ? Math.round((value / max) * segments) : 0;
  const wrapperClass = ['seg-bar', className ?? ''].filter(Boolean).join(' ');

  return (
    <div className={wrapperClass}>
      {Array.from({ length: segments }, (_, i) => (
        <div key={i} className={i < filled ? `seg filled${variant ? ` ${variant}` : ''}` : 'seg'} />
      ))}
    </div>
  );
}
