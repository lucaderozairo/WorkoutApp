import type { CSSProperties, ElementType, ReactNode } from 'react';
import { layoutClasses, type Gap, type Align, type Justify } from './_classes';

interface ColumnProps {
  gap?: Gap;
  align?: Align;
  justify?: Justify;
  as?: ElementType;
  className?: string;
  style?: CSSProperties;
  'aria-describedby'?: string;
  children: ReactNode;
  onClick?: () => void;
}

export function Column({
  gap,
  align,
  justify,
  as: Tag = 'div',
  className,
  style,
  'aria-describedby': ariaDescribedBy,
  children,
  onClick,
}: ColumnProps) {
  const classes = layoutClasses({ base: 'column', gap, defaultGap: 4, align, justify, className });
  return <Tag className={classes} style={style} aria-describedby={ariaDescribedBy} onClick={onClick}>{children}</Tag>;
}
