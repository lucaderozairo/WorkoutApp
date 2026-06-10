import type { CSSProperties, ReactNode } from 'react';
import { Dot } from '../atoms/Dot';

type Tone = 'ok' | 'warn' | 'bad' | 'accent' | 'plain';

interface BadgeProps {
  tone?: Tone;
  /** CSS custom property name from tokens, e.g. 'c-strength', 'color-sleep-deep' */
  color?: string;
  dot?: boolean;
  active?: boolean;
  className?: string;
  children?: ReactNode;
}

/**
 * Badge — molecule: composes a Dot atom + label content.
 * Not an atom (it is built from Dot), hence it lives in molecules/.
 */
export function Badge({ tone, color, dot = false, active = false, className, children }: BadgeProps) {
  const classes = [
    'badge',
    tone && tone !== 'plain' ? tone : '',
    active ? 'active' : '',
    className,
  ].filter(Boolean).join(' ');

  const style: CSSProperties | undefined = color
    ? { '--badge-color': `var(--${color})` } as CSSProperties
    : undefined;

  return (
    // eslint-disable-next-line no-restricted-syntax -- Dynamic CSS custom property keeps badge color token-driven without domain classes.
    <span className={classes} style={style}>
      {dot && <Dot />}
      {children}
    </span>
  );
}
