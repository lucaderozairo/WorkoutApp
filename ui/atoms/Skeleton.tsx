interface SkeletonProps {
  /** line = text-row height, block = media/number height. */
  size?: 'line' | 'block';
  /** Narrower (60%) width, e.g. a trailing text line. */
  short?: boolean;
  className?: string;
}

/**
 * Skeleton — irreducible shimmer placeholder. Composes nothing.
 * Dimensions come from CSS (.sk size modifiers), not inline styles.
 */
export function Skeleton({ size = 'block', short = false, className }: SkeletonProps) {
  const classes = ['sk', size, short ? 'short' : '', className].filter(Boolean).join(' ');
  return <div className={classes} />;
}
