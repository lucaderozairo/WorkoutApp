import type { ReactNode } from 'react';
import { Button } from '@ui/atoms/Button';

type AlertVariant = 'info' | 'success' | 'warn' | 'error';

interface AlertProps {
  variant: AlertVariant;
  title?: string;
  message: string;
  dismissible?: boolean;
  onDismiss?: () => void;
  action?: ReactNode;
  className?: string;
}

const VARIANT_CLASS: Record<AlertVariant, string> = {
  info: 'accent',
  success: '',
  warn: 'warning',
  error: 'warning',
};

export function Alert({ variant, title, message, dismissible = false, onDismiss, action, className }: AlertProps) {
  const classes = ['surface', VARIANT_CLASS[variant], 'row', 'align-center', className].filter(Boolean).join(' ');

  return (
    <div className={classes} role="alert">
      <div className="column grow">
        {title && <strong>{title}</strong>}
        <span className="caption">{message}</span>
      </div>
      {action}
      {dismissible && onDismiss && (
        <Button variant="ghost" size="icon" onClick={onDismiss} aria-label="Dismiss">×</Button>
      )}
    </div>
  );
}
