import type { AllHTMLAttributes, ElementType, ReactNode } from 'react';

type TextSize = 'body' | 'detail' | 'caption' | 'eyebrow';
type TextColor = 'default' | 'muted' | 'faint' | 'positive' | 'negative';

interface TextProps extends Omit<AllHTMLAttributes<HTMLElement>, 'color' | 'as' | 'size'> {
  size?: TextSize;
  color?: TextColor;
  mono?: boolean;
  bold?: boolean;
  truncate?: boolean;
  nowrap?: boolean;
  as?: ElementType;
  className?: string;
  children: ReactNode;
}

const SIZE_CLASS: Record<TextSize, string> = {
  body:    '',
  detail:  'detail',
  caption: 'caption',
  eyebrow: 'eyebrow',
};

const COLOR_CLASS: Record<TextColor, string> = {
  default:  '',
  muted:    'muted',
  faint:    'faint',
  positive: 'positive',
  negative: 'negative',
};

export function Text({
  size = 'body',
  color = 'default',
  mono = false,
  bold = false,
  truncate = false,
  nowrap = false,
  as: Tag = 'span',
  className,
  children,
  ...rest
}: TextProps) {
  const classes = [
    SIZE_CLASS[size],
    COLOR_CLASS[color],
    mono     ? 'mono'     : '',
    bold     ? 'bold'     : '',
    truncate ? 'truncate' : '',
    nowrap   ? 'nowrap'   : '',
    className,
  ].filter(Boolean).join(' ');

  return <Tag className={classes || undefined} {...rest}>{children}</Tag>;
}
