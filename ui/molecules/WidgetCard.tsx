import type { ReactNode } from 'react';
import { Surface } from '@ui/atoms/Surface';
import { Column } from '@ui/layout/Column';
import { Spacer } from '@ui/layout/Spacer';

interface WidgetCardProps {
  label?: string;
  footer?: ReactNode;
  tight?: boolean;
  loading?: boolean;
  className?: string;
  children: ReactNode;
}

export function WidgetCard({ label, footer, tight = false, loading = false, className, children }: WidgetCardProps) {
  return (
    <Surface pad={tight ? 'sm' : 'md'} className={['h-full', className].filter(Boolean).join(' ')}>
      <Column className="h-full">
        {label && <span className="eyebrow muted">{label}</span>}
        {loading ? (
          <Column className="grow">
            <div className="sk" style={{ height: 48 }} />
            <div className="sk" style={{ height: 24, width: '60%' }} />
          </Column>
        ) : (
          <div className="grow">{children}</div>
        )}
        {footer && <><Spacer />{footer}</>}
      </Column>
    </Surface>
  );
}
