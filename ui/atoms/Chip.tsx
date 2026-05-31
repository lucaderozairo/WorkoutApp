import type { ReactNode } from 'react';

interface ChipProps {
  active?: boolean;
  source?: boolean;
  leading?: ReactNode;
  trailing?: ReactNode;
  onClick?: () => void;
  className?: string;
  children: ReactNode;
}

export function Chip({ active = false, source = false, leading, trailing, onClick, className, children }: ChipProps) {
  const classes = ['chip', active ? 'active' : '', source ? 'source' : '', className]
    .filter(Boolean)
    .join(' ');

  return (
    <button type="button" className={classes} onClick={onClick}>
      {leading}
      {children}
      {trailing}
    </button>
  );
}
