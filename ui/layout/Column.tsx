import type { ElementType, ReactNode } from 'react';
import { layoutClasses, type Gap, type Align, type Justify } from './_classes';

interface ColumnProps {
  gap?: Gap;
  align?: Align;
  justify?: Justify;
  grow?: boolean;
  as?: ElementType;
  className?: string;
  'aria-describedby'?: string;
  'aria-labelledby'?: string;
  children: ReactNode;
  onClick?: () => void;
}

export function Column({
  gap,
  align,
  justify,
  grow = false,
  as: Tag = 'div',
  className,
  'aria-describedby': ariaDescribedBy,
  'aria-labelledby': ariaLabelledBy,
  children,
  onClick,
}: ColumnProps) {
  const classes = layoutClasses({ base: 'column', gap, defaultGap: 4, align, justify, grow, className });
  return (
    <Tag
      className={classes}
      aria-describedby={ariaDescribedBy}
      aria-labelledby={ariaLabelledBy}
      onClick={onClick}
    >
      {children}
    </Tag>
  );
}
