import type { ReactNode } from 'react';
import { Button } from '@ui/atoms/Button';
import { Surface } from '@ui/atoms/Surface';
import { Row } from '@ui/layout/Row';
import { Column } from '@ui/layout/Column';

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

const SURFACE_VARIANT = {
  info:    'accent',
  success: 'default',
  warn:    'default',
  error:   'default',
} as const;

const EXTRA_CLASS: Record<AlertVariant, string> = {
  info:    '',
  success: '',
  warn:    'warning',
  error:   'warning',
};

export function Alert({ variant, title, message, dismissible = false, onDismiss, action, className }: AlertProps) {
  const extra = [EXTRA_CLASS[variant], className].filter(Boolean).join(' ') || undefined;

  return (
    <Surface variant={SURFACE_VARIANT[variant]} className={extra} role="alert">
      <Row align="center">
        <Column className="grow">
          {title && <strong>{title}</strong>}
          <span className="caption">{message}</span>
        </Column>
        {action}
        {dismissible && onDismiss && (
          <Button variant="ghost" size="icon" onClick={onDismiss} aria-label="Dismiss">×</Button>
        )}
      </Row>
    </Surface>
  );
}
