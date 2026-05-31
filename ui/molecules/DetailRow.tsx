import type { ReactNode } from 'react';

interface DetailRowProps {
  label: ReactNode;
  value: ReactNode;
  mono?: boolean;
  className?: string;
}

export function DetailRow({ label, value, mono = false, className }: DetailRowProps) {
  // .q-row is a container context; the inner .row (a descendant) is what the
  // container query restyles — it stacks when the row is in a narrow cell.
  const inner = ['row', 'space-between', 'align-center', className].filter(Boolean).join(' ');
  return (
    <div className="q-row">
      <div className={inner}>
        <span className="caption">{label}</span>
        <span className={mono ? 'caption mono' : 'value'}>{value}</span>
      </div>
    </div>
  );
}
