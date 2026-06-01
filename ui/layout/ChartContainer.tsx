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

const HEIGHT_PX: Record<ChartHeight, number> = { sm: 120, md: 180, lg: 240, xl: 320 };

export function ChartContainer({ height = 'md', loading = false, empty = false, emptyMessage = 'No data', className, children }: ChartContainerProps) {
  const classes = ['w-full', className].filter(Boolean).join(' ');
  const px = HEIGHT_PX[height];

  if (loading) {
    return <div className={`${classes} sk`} style={{ height: px }} />;
  }

  if (empty) {
    return (
      <div className={classes} style={{ height: px, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span className="caption muted">{emptyMessage}</span>
      </div>
    );
  }

  return (
    <div className={classes} style={{ height: px }}>
      {children}
    </div>
  );
}
