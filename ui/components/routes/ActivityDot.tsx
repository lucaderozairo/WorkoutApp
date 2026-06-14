import type { HTMLAttributes } from 'react';

interface ActivityDotProps extends HTMLAttributes<HTMLSpanElement> {
  'data-id'?: string;
}

export function ActivityDot({ ...props }: ActivityDotProps) {
  return <span className="activity-dot" {...props} />;
}
