import type { ElementType, ReactNode } from 'react';
import { layoutClasses, type Gap, type Align, type Justify } from './_classes';

interface ClusterProps {
  gap?: Gap;
  align?: Align;
  justify?: Justify;
  as?: ElementType;
  className?: string;
  'aria-label'?: string;
  children: ReactNode;
  onClick?: () => void;
}

export function Cluster({ gap, align, justify, as: Tag = 'div', className, 'aria-label': ariaLabel, children, onClick }: ClusterProps) {
  const classes = layoutClasses({ base: 'cluster', gap, defaultGap: 2, align, justify, wrap: true, className });
  return <Tag className={classes} aria-label={ariaLabel} onClick={onClick}>{children}</Tag>;
}
