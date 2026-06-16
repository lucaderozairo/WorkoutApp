import type { CSSProperties, HTMLAttributes } from 'react';

interface DotProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'color'> {
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
export function Dot({ color, size = 'md', active = false, className, style, ...rest }: DotProps) {
  const classes = ['dot', size === 'sm' ? 'sm' : '', active ? 'active' : '', className]
    .filter(Boolean)
    .join(' ');
  const dotStyle = color ? ({ ...style, '--dot-color': `var(--${color})` } as CSSProperties) : style;
  // eslint-disable-next-line no-restricted-syntax -- Dynamic CSS custom property keeps the generic atom token-driven without domain classes.
  return <span className={classes} style={dotStyle} {...rest} />;
}
