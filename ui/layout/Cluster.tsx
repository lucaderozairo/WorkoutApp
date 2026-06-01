import type { ElementType, ReactNode } from 'react';
import { type Gap, type Justify } from './_classes';

interface ClusterProps {
  gap?: Gap;
  justify?: Justify;
  as?: ElementType;
  className?: string;
  children: ReactNode;
  onClick?: () => void;
}

export function Cluster({ gap, justify, as: Tag = 'div', className, children, onClick }: ClusterProps) {
  const gapClass = gap !== undefined && gap !== 2 ? `gap-${gap}` : '';
  const justifyClass = justify ? `justify-${justify}` : '';
  const classes = ['cluster', gapClass, justifyClass, className].filter(Boolean).join(' ');
  return <Tag className={classes} onClick={onClick}>{children}</Tag>;
}
