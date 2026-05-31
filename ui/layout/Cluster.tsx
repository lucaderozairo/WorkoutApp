import type { ElementType, ReactNode } from 'react';
import { type Gap } from './_classes';

interface ClusterProps {
  gap?: Gap;
  as?: ElementType;
  className?: string;
  children: ReactNode;
  onClick?: () => void;
}

export function Cluster({ gap, as: Tag = 'div', className, children, onClick }: ClusterProps) {
  const gapClass = gap !== undefined && gap !== 2 ? `gap-${gap}` : '';
  const classes = ['cluster', gapClass, className].filter(Boolean).join(' ');
  return <Tag className={classes} onClick={onClick}>{children}</Tag>;
}
