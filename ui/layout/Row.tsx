import type { CSSProperties, ElementType, ReactNode } from 'react';
import { layoutClasses, type Gap, type Align, type Justify } from './_classes';

interface RowProps {
  gap?: Gap;
  align?: Align;
  justify?: Justify;
  wrap?: boolean;
  as?: ElementType;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
  onClick?: () => void;
}

export function Row({ gap, align, justify, wrap = false, as: Tag = 'div', className, style, children, onClick }: RowProps) {
  const classes = layoutClasses({ base: 'row', gap, defaultGap: 3, align, justify, wrap, className });
  return <Tag className={classes} style={style} onClick={onClick}>{children}</Tag>;
}
