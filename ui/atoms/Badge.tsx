import type { CSSProperties, ReactNode } from 'react';

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
    <span className={classes} style={style}>
      {dot && <span className="dot" />}
      {children}
    </span>
  );
}
