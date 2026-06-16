import type { ReactNode } from 'react';
import { Surface, Text } from '@ui/atoms';
import { Column, Row } from '@ui/layout';

interface SettingsSectionProps {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function SettingsSection({ title, description, action, children, className }: SettingsSectionProps) {
  return (
    <Surface as="section" className={['settings-section', className].filter(Boolean).join(' ')}>
      <Column gap={3}>
        <Row align="start" justify="between" gap={3}>
          <Column gap={1} className="min-w-0">
            <Text as="h3">{title}</Text>
            {description ? <Text size="caption" color="muted">{description}</Text> : null}
          </Column>
          {action}
        </Row>
        {children}
      </Column>
    </Surface>
  );
}
