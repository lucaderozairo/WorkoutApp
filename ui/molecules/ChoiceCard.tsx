import type { ReactNode } from 'react';
import { Text } from '@ui/atoms/Text';
import { Row } from '@ui/layout/Row';
import { Column } from '@ui/layout/Column';

interface ChoiceCardProps {
  title: ReactNode;
  description?: ReactNode;
  metadata?: ReactNode;
  leading?: ReactNode;
  trailing?: ReactNode;
  selected?: boolean;
  disabled?: boolean;
  onSelect: () => void;
  className?: string;
}

export function ChoiceCard({
  title,
  description,
  metadata,
  leading,
  trailing,
  selected = false,
  disabled = false,
  onSelect,
  className,
}: ChoiceCardProps) {
  return (
    <button
      type="button"
      className={['choice-card', selected ? 'selected' : '', className].filter(Boolean).join(' ')}
      aria-pressed={selected}
      disabled={disabled}
      onClick={onSelect}
    >
      <Row align="center" gap={3} className="choice-card-inner">
        {leading && <span className="choice-leading">{leading}</span>}
        <Column gap={1} className="choice-copy">
          <Text bold className="choice-title">{title}</Text>
          {description && <Text size="caption" color="muted">{description}</Text>}
          {metadata && <Text size="caption" color="faint">{metadata}</Text>}
        </Column>
        {trailing && <span className="choice-trailing">{trailing}</span>}
      </Row>
    </button>
  );
}
