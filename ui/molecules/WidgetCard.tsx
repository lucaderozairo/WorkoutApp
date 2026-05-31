import type { ReactNode } from 'react';

interface WidgetCardProps {
  label?: string;
  footer?: ReactNode;
  tight?: boolean;
  loading?: boolean;
  className?: string;
  children: ReactNode;
}

export function WidgetCard({ label, footer, tight = false, loading = false, className, children }: WidgetCardProps) {
  const classes = ['surface', 'column', 'h-full', tight ? 'tight' : '', className].filter(Boolean).join(' ');

  return (
    <div className={classes}>
      {label && <span className="eyebrow muted">{label}</span>}
      {loading ? (
        <div className="column grow">
          <div className="sk" style={{ height: 48 }} />
          <div className="sk" style={{ height: 24, width: '60%' }} />
        </div>
      ) : (
        <div className="grow">{children}</div>
      )}
      {footer}
    </div>
  );
}
