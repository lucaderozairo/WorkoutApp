import type { ReactNode } from 'react';

type Position = 'top' | 'bottom' | 'left' | 'right';

interface TooltipProps {
  content: string;
  position?: Position;
  children: ReactNode;
}

export function Tooltip({ content, position = 'top', children }: TooltipProps) {
  return (
    <div className="tooltip-root" data-tip={content} data-tip-pos={position}>
      {children}
    </div>
  );
}
