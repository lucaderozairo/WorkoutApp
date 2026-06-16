import type { ReactNode } from 'react';
import { Grid } from '@ui/layout';

interface DashboardGridProps {
  children: ReactNode;
  className?: string;
}

export function DashboardGrid({ children, className }: DashboardGridProps) {
  return (
    <Grid variant="widget" gap={3} className={['dashboard-grid', className].filter(Boolean).join(' ')}>
      {children}
    </Grid>
  );
}
