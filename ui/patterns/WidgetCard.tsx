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

interface WidgetCardSkeletonProps {
  label?: boolean;
  footer?: boolean;
  tight?: boolean;
  className?: string;
  lines?: number;
}

function WidgetCardSkeletonBody({ lines = 2 }: { lines?: number }) {
  return (
    <Column className="min-w-0" gap={2} aria-hidden>
      <Skeleton size="block" />
      {Array.from({ length: lines }, (_, index) => (
        <Skeleton key={index} size="line" short={index === lines - 1} />
      ))}
    </Column>
  );
}

function WidgetCardSkeleton({
  label = true,
  footer = false,
  tight = false,
  className,
  lines = 2,
}: WidgetCardSkeletonProps) {
  return (
    <Surface pad={tight ? 'sm' : 'md'} className={['h-full', className].filter(Boolean).join(' ')}>
      <Column className="h-full">
        {label ? <Skeleton size="line" short className="text-9" /> : null}
        <WidgetCardSkeletonBody lines={lines} />
        {footer ? <><Spacer /><Skeleton size="line" short className="text-9" /></> : null}
      </Column>
    </Surface>
  );
}

function WidgetCardImpl({ label, footer, tight = false, loading = false, className, children }: WidgetCardProps) {
  return (
    <Surface pad={tight ? 'sm' : 'md'} className={['h-full', className].filter(Boolean).join(' ')}>
      <Column className="h-full">
        {label ? <Text size="eyebrow" color="muted">{label}</Text> : null}
        {loading ? (
          <WidgetCardSkeletonBody />
        ) : (
          <div className="min-w-0">{children}</div>
        )}
        {footer ? <><Spacer />{footer}</> : null}
      </Column>
    </Surface>
  );
}

export const WidgetCard = Object.assign(WidgetCardImpl, { Skeleton: WidgetCardSkeleton });
