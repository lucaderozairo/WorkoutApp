import type { ReactNode } from 'react';
import { Surface } from '@ui/atoms/Surface';
import { Column } from '@ui/layout/Column';

interface EmptyStateProps {
  icon?: string;
  title: string;
  message?: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, message, action }: EmptyStateProps) {
  return (
    <Surface className="centered">
      <Column align="center">
        {icon && <span aria-hidden className="empty-icon">{icon}</span>}
        <h3>{title}</h3>
        {message && <p className="caption muted">{message}</p>}
        {action}
      </Column>
    </Surface>
  );
}
