import type { ReactNode } from 'react';
import { Surface } from '@ui/atoms/Surface';
import { Column } from '@ui/layout/Column';
import { Text } from '@ui/atoms';

interface EmptyStateProps {
  icon?: ReactNode;
  title: ReactNode;
  message?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, message, action, className }: EmptyStateProps) {
  return (
    <Surface variant="ghost" className={['empty', 'centered', className].filter(Boolean).join(' ')}>
      <Column align="center" gap={2}>
        {icon && <span aria-hidden className="empty-icon">{icon}</span>}
        <h3>{title}</h3>
        {message && <Text as="p" size="caption" color="muted">{message}</Text>}
        {action}
      </Column>
    </Surface>
  );
}
