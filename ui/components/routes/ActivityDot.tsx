import type { HTMLAttributes } from 'react';

interface ActivityDotProps extends HTMLAttributes<HTMLSpanElement> {
  'data-id'?: string;
}

export function ActivityDot({ className, ...props }: ActivityDotProps) {
  const cls = ['row align-center justify-center gap-0 activity-dot', className].filter(Boolean).join(' ');
  return <span className={cls} {...props} />;
}
