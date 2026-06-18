import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { SessionFilters, TypeFilter } from '@ui/components/log/SessionFilterBar';
import { Row } from '@ui/layout';
import { Chip } from '@ui/atoms';
import { Button } from '@ui/molecules';

const TYPE_OPTIONS: { key: TypeFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'strength', label: 'Gym' },
  { key: 'run', label: 'Run' },
  { key: 'cycle', label: 'Cycle' },
  { key: 'hike', label: 'Hike' },
  { key: 'swim', label: 'Swim' },
  { key: 'row', label: 'Row' },
  { key: 'ski', label: 'Ski' },
  { key: 'snowboard', label: 'Snowboard' },
  { key: 'climb', label: 'Climb' },
  { key: 'surf', label: 'Surf' },
  { key: 'kayak', label: 'Kayak' },
  { key: 'yoga', label: 'Yoga' },
  { key: 'boxing', label: 'Boxing' },
  { key: 'stretch', label: 'Stretch' },
  { key: 'hiit', label: 'HIIT' },
];

export const TYPE_LABEL: Record<string, string> = Object.fromEntries(
  TYPE_OPTIONS.map(o => [o.key, o.label])
);

interface TypeFilterPanelProps {
  filters: SessionFilters;
  onChange: (f: SessionFilters) => void;
}

export function TypeFilterPanel({ filters, onChange }: TypeFilterPanelProps) {
  const [typeExpanded, setTypeExpanded] = useState(true);

  return (
    <>
      <Button
        variant="ghost"
        block
        className="flush"
        onClick={() => setTypeExpanded(e => !e)}
      >
        <Row justify="between" align="center">
          Workout type
          <ChevronDown size={12} className={`chevron${typeExpanded ? ' open' : ''}`} />
        </Row>
      </Button>
      {typeExpanded && (
        <Row gap={1} wrap>
          {TYPE_OPTIONS.map(opt => (
            <Chip
              key={opt.key}
              active={filters.type === opt.key}
              onClick={() => onChange({ ...filters, type: opt.key })}
            >
              {opt.label}
            </Chip>
          ))}
        </Row>
      )}
    </>
  );
}
