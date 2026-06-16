import type { ReactNode } from 'react';
import { Surface } from '@ui/atoms/Surface';
import { Skeleton } from '@ui/atoms/Skeleton';
import { Text } from '@ui/atoms';
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
        {label && <Text size="eyebrow" color="muted">{label}</Text>}
        {loading ? (
          <Column className="min-w-0">
            <Skeleton size="block" />
            <Skeleton size="line" short />
          </Column>
        ) : (
          <div className="min-w-0">{children}</div>
        )}
        {footer && <><Spacer />{footer}</>}
      </Column>
    </Surface>
  );
}
