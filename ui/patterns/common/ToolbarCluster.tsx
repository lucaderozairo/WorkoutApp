import type { ReactNode } from 'react';
import { Cluster } from '@ui/layout';
import type { Gap, Justify } from '@ui/layout/_classes';

interface ToolbarClusterProps {
  label?: string;
  gap?: Gap;
  justify?: Justify;
  className?: string;
  children: ReactNode;
}

export function ToolbarCluster({ label, gap = 1, justify = 'end', className, children }: ToolbarClusterProps) {
  return (
    <Cluster as="div" gap={gap} justify={justify} className={['toolbar-cluster', className].filter(Boolean).join(' ')} aria-label={label}>
      {children}
    </Cluster>
  );
}
