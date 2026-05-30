import type { ReactNode } from 'react';

type Gap = 'xs' | 'sm' | 'md' | 'lg';

interface ClusterProps {
  gap?: Gap;
  className?: string;
  children: ReactNode;
}

const GAP_CLASS: Record<Gap, string> = { xs: 'compact', sm: '', md: 'gap-md', lg: 'gap-lg' };

export function Cluster({ gap = 'sm', className, children }: ClusterProps) {
  const classes = ['cluster', gap ? GAP_CLASS[gap] : '', className].filter(Boolean).join(' ');
  return <div className={classes}>{children}</div>;
}
