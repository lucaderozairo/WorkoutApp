import type { ElementType, ReactNode } from 'react';
import { layoutClasses, type Gap } from './_classes';

interface StackProps {
  gap?: Gap;
  as?: ElementType;
  className?: string;
  children: ReactNode;
}

export function Stack({ gap, as: Tag = 'div', className, children }: StackProps) {
  const classes = layoutClasses({ base: 'stack', gap, defaultGap: 4, className });

  return <Tag className={classes}>{children}</Tag>;
}
