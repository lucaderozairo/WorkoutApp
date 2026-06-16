import type { ReactNode } from 'react';
import { Spinner } from '@ui/atoms/Spinner';
import { Skeleton } from '@ui/atoms/Skeleton';
import { Surface } from '@ui/atoms/Surface';
import { Text } from '@ui/atoms/Text';
import { Column } from '@ui/layout/Column';

type LoadingStateKind = 'loading' | 'empty' | 'error';

interface LoadingStateProps {
  state: LoadingStateKind;
  title?: ReactNode;
  message?: ReactNode;
  action?: ReactNode;
  skeletonRows?: number;
  className?: string;
}

export function LoadingState({
  state,
  title,
  message,
  action,
  skeletonRows = 3,
  className,
}: LoadingStateProps) {
  const isLoading = state === 'loading';

  return (
    <Surface variant={state === 'error' ? 'flat' : 'default'} className={['loading-state', className].filter(Boolean).join(' ')}>
      <Column align="center" gap={3}>
        {isLoading ? (
          <Column gap={2} className="loading-state-skeleton" aria-hidden>
            {Array.from({ length: skeletonRows }, (_, index) => (
              <Skeleton key={index} size="line" short={index === skeletonRows - 1} />
            ))}
          </Column>
        ) : (
          <Text size="detail" mono bold className="loading-state-mark" aria-hidden>{state === 'error' ? '!' : 'i'}</Text>
        )}
        {isLoading && <Spinner size="sm" />}
        {title && <h3>{title}</h3>}
        {message && <Text as="p" size="caption" color="muted">{message}</Text>}
        {action}
      </Column>
    </Surface>
  );
}
