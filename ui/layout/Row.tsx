import type { ElementType, KeyboardEventHandler, ReactNode } from 'react';
import { layoutClasses, type Gap, type Align, type Justify } from './_classes';

interface RowProps {
  gap?: Gap;
  align?: Align;
  justify?: Justify;
  wrap?: boolean;
  as?: ElementType;
  className?: string;
  children: ReactNode;
  onClick?: () => void;
  onKeyDown?: KeyboardEventHandler;
}

export function Row({ gap, align, justify, wrap = false, as: Tag = 'div', className, children, onClick, onKeyDown }: RowProps) {
  const classes = layoutClasses({ base: 'row', gap, defaultGap: 3, align, justify, wrap, className });
  return <Tag className={classes} onClick={onClick} onKeyDown={onKeyDown}>{children}</Tag>;
}
