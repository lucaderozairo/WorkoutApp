import type { CSSProperties } from 'react';

interface DotProps {
  /** CSS custom-property token name for the dot color, e.g. 'c-cardio'. No domain knowledge — caller maps concept → token. */
  color?: string;
  size?: 'sm' | 'md';
  active?: boolean;
  className?: string;
}

/**
 * Dot — irreducible colored indicator. Composes nothing.
 * Size via --dot-size, color via --dot-color (set by `color` or inherited from context).
 */
export function Dot({ color, size = 'md', active = false, className }: DotProps) {
  const classes = ['dot', size === 'sm' ? 'sm' : '', active ? 'active' : '', className]
    .filter(Boolean)
    .join(' ');
  const style = color ? ({ '--dot-color': `var(--${color})` } as CSSProperties) : undefined;
  return <span className={classes} style={style} />;
}
