import type { ReactNode } from 'react';
import { Surface } from '@ui/atoms/Surface';
import { Column } from '@ui/layout/Column';

interface EmptyProps {
  icon?: ReactNode;
  title: ReactNode;
  message?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function Empty({ icon, title, message, action, className }: EmptyProps) {
  return (
    <Surface variant="ghost" className={['empty', className].filter(Boolean).join(' ')}>
      <Column align="center" gap={2}>
        {icon && <span aria-hidden className="empty-icon">{icon}</span>}
        <h3>{title}</h3>
        {message && <p className="caption muted">{message}</p>}
        {action}
      </Column>
    </Surface>
  );
}
