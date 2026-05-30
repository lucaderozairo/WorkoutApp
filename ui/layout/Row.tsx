import type { ReactNode } from 'react';

type Gap = 'xs' | 'sm' | 'md' | 'lg';
type Align = 'start' | 'center' | 'end' | 'stretch' | 'baseline';
type Justify = 'start' | 'center' | 'end' | 'between' | 'around';

interface RowProps {
  gap?: Gap;
  align?: Align;
  justify?: Justify;
  wrap?: boolean;
  className?: string;
  children: ReactNode;
  onClick?: () => void;
}

const GAP_CLASS: Record<Gap, string> = { xs: 'compact', sm: '', md: 'gap-md', lg: 'gap-lg' };
const ALIGN_CLASS: Record<Align, string> = { start: 'align-start', center: 'align-center', end: 'align-end', stretch: 'align-stretch', baseline: 'align-baseline' };
const JUSTIFY_CLASS: Record<Justify, string> = { start: '', center: 'justify-center', end: 'justify-end', between: 'space-between', around: 'justify-around' };

export function Row({ gap = 'sm', align, justify, wrap = false, className, children, onClick }: RowProps) {
  const classes = [
    'row',
    gap ? GAP_CLASS[gap] : '',
    align ? ALIGN_CLASS[align] : '',
    justify ? JUSTIFY_CLASS[justify] : '',
    wrap ? 'wrap' : '',
    className,
  ].filter(Boolean).join(' ');

  return <div className={classes} onClick={onClick}>{children}</div>;
}
