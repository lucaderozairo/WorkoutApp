import type { ReactNode } from 'react';
import { Button } from '@ui/molecules/Button';
import { Surface } from '@ui/atoms/Surface';
import { Text } from '@ui/atoms';
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

export function Alert({ variant, title, message, dismissible = false, onDismiss, action, className }: AlertProps) {
  return (
    <Surface
      variant={SURFACE_VARIANT[variant]}
      className={['alert', className].filter(Boolean).join(' ') || undefined}
      data-tone={variant}
      role="alert"
    >
      <Row align="center">
        <Column className="min-w-0">
          {title && <strong>{title}</strong>}
          <Text as="span" size="caption">{message}</Text>
        </Column>
        {action}
        {dismissible && onDismiss && (
          <Button variant="ghost" size="icon" onClick={onDismiss} aria-label="Dismiss">×</Button>
        )}
      </Row>
    </Surface>
  );
}
