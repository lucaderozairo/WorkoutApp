import type { ReactNode } from 'react';

interface DetailRowProps {
  label: ReactNode;
  value: ReactNode;
  mono?: boolean;
  className?: string;
}

export function DetailRow({ label, value, mono = false, className }: DetailRowProps) {
  const classes = ['row', 'space-between', 'align-center', className].filter(Boolean).join(' ');
  return (
    <div className={classes}>
      <span className="caption">{label}</span>
      <span className={mono ? 'caption mono' : 'value'}>{value}</span>
    </div>
  );
}
