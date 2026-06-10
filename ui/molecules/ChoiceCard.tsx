import type { ReactNode } from 'react';
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
          <span className="choice-title">{title}</span>
          {description && <span className="caption muted">{description}</span>}
          {metadata && <span className="caption faint">{metadata}</span>}
        </Column>
        {trailing && <span className="choice-trailing">{trailing}</span>}
      </Row>
    </button>
  );
}
