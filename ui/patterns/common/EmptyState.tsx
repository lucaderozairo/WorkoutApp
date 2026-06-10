import type { ReactNode } from 'react';
import { Empty } from '@ui/molecules/Empty';

interface EmptyStateProps {
  icon?: string;
  title: string;
  message?: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, message, action }: EmptyStateProps) {
  return <Empty icon={icon} title={title} message={message} action={action} className="centered" />;
}
