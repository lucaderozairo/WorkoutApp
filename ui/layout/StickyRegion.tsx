import type { ElementType, ReactNode } from 'react';

type StickyPosition = 'top' | 'bottom';
type StickyOffset = 'app' | 'none';

interface StickyRegionProps {
  position: StickyPosition;
  offset?: StickyOffset;
  elevated?: boolean;
  as?: ElementType;
  className?: string;
  children: ReactNode;
}

export function StickyRegion({
  position,
  offset = 'none',
  elevated = false,
  as: Tag = 'div',
  className,
  children,
}: StickyRegionProps) {
  const classes = [
    'sticky-region',
    `sticky-region-${position}`,
    `sticky-offset-${offset}`,
    elevated ? 'elevated' : '',
    className,
  ].filter(Boolean).join(' ');

  return <Tag className={classes}>{children}</Tag>;
}
