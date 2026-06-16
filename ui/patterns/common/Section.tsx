import type { ReactNode } from 'react';
import { Column, Row } from '@ui/layout';
import type { Gap } from '@ui/layout/_classes';
import { Text } from '@ui/atoms';
import { Button } from '@ui/molecules';

interface SectionAction {
  label: string;
  onClick: () => void;
}

interface SectionProps {
  label: string;
  action?: SectionAction;
  gap?: Gap;
  children: ReactNode;
}

export function Section({ label, action, gap = 3, children }: SectionProps) {
  return (
    <Column gap={gap}>
      <Row justify="between" align="center">
        <Text size="eyebrow">{label}</Text>
        {action && (
          <Button variant="ghost" size="sm" onClick={action.onClick}>
            {action.label}
          </Button>
        )}
      </Row>
      {children}
    </Column>
  );
}
