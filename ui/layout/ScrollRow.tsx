import type { ReactNode } from 'react';

interface ScrollRowProps {
  className?: string;
  children: ReactNode;
}

export function ScrollRow({ className, children }: ScrollRowProps) {
  const classes = ['scroll-row', className].filter(Boolean).join(' ');
  return <div className={classes}>{children}</div>;
}
