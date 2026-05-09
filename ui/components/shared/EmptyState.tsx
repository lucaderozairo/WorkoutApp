import type { ReactNode } from 'react';

type Props = {
  icon: string;
  title: string;
  message?: string;
  action?: ReactNode;
};

export function EmptyState({ icon, title, message, action }: Props) {
  return (
    <div className="surface stat column">
      <h1 aria-hidden>{icon}</h1>
      <h3>{title}</h3>
      {message && <p className="caption">{message}</p>}
      {action}
    </div>
  );
}
