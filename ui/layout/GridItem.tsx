import React from 'react';
import type { ReactNode } from 'react';

type GridPlaceSelf = 'center' | 'start' | 'end' | 'stretch';

interface GridItemProps {
  area?:      string;                         // grid-area name matching a template-area slot
  colSpan?:   1 | 2 | 3 | 4 | 5 | 6 | 'full';
  rowSpan?:   1 | 2 | 3;
  placeSelf?: GridPlaceSelf;
  className?: string;
  children:   ReactNode;
}

export function GridItem({ area, colSpan, rowSpan, placeSelf, className, children }: GridItemProps) {
  const vars: Record<string, string> = {};
  if (area !== undefined)
    vars['--area'] = area;
  if (colSpan !== undefined)
    vars['--col-span'] = colSpan === 'full' ? '1 / -1' : `span ${colSpan}`;
  if (rowSpan !== undefined)
    vars['--row-span'] = `span ${rowSpan}`;
  if (placeSelf !== undefined)
    vars['--place-self'] = placeSelf;

  const cx = ['grid-item', className].filter(Boolean).join(' ');
  return (
    <div className={cx} style={vars as React.CSSProperties}>
      {children}
    </div>
  );
}
