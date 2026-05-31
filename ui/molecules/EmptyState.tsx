import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon?: string;
  title: string;
  message?: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, message, action }: EmptyStateProps) {
  return (
    <div className="surface centered column align-center">
      {icon && <span aria-hidden className="empty-icon">{icon}</span>}
      <h3>{title}</h3>
      {message && <p className="caption muted">{message}</p>}
      {action}
    </div>
  );
}
