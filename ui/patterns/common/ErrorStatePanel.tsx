import type { ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import { EmptyState } from './EmptyState';

interface ErrorStatePanelProps {
  title?: ReactNode;
  message?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function ErrorStatePanel({
  title = 'Something went wrong',
  message,
  action,
  className,
}: ErrorStatePanelProps) {
  return (
    <EmptyState
      icon={<AlertTriangle size={28} />}
      title={title}
      message={message}
      action={action}
      className={['error-state-panel', className].filter(Boolean).join(' ')}
    />
  );
}
