import type { ReactNode } from 'react';

type ChartHeight = 'sm' | 'md' | 'lg' | 'xl';

interface ChartContainerProps {
  height?: ChartHeight;
  loading?: boolean;
  empty?: boolean;
  emptyMessage?: string;
  className?: string;
  children: ReactNode;
}

export function ChartContainer({ height = 'md', loading = false, empty = false, emptyMessage = 'No data', className, children }: ChartContainerProps) {
  const classes = ['chart-container', `chart-container-${height}`, className].filter(Boolean).join(' ');

  if (loading) {
    return <div className={`${classes} chart-container-loading sk`} />;
  }

  if (empty) {
    return (
      <div className={`${classes} chart-container-empty`}>
        <span className="caption muted">{emptyMessage}</span>
      </div>
    );
  }

  return (
    <div className={classes}>
      {children}
    </div>
  );
}
