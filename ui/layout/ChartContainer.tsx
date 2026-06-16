import type { ReactNode } from 'react';
import { Text } from '@ui/atoms';

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
        <Text as="span" size="caption" color="muted">{emptyMessage}</Text>
      </div>
    );
  }

  return (
    <div className={classes}>
      {children}
    </div>
  );
}
