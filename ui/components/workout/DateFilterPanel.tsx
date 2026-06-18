import { useState } from 'react';
import { ChevronDown, X } from 'lucide-react';
import type { SessionFilters, ViewMode } from '@ui/components/log/SessionFilterBar';
import { Row, Column } from '@ui/layout';
import { Text, Chip } from '@ui/atoms';
import { Button, Input } from '@ui/molecules';

const DATE_OPTIONS: { key: SessionFilters['dateRange']; label: string }[] = [
  { key: 'all', label: 'All time' },
  { key: '7d', label: 'Past 7 days' },
  { key: '30d', label: 'Past 30 days' },
];

interface DateFilterPanelProps {
  filters: SessionFilters;
  onChange: (f: SessionFilters) => void;
  view: ViewMode;
}

export function DateFilterPanel({ filters, onChange, view }: DateFilterPanelProps) {
  const [dateExpanded, setDateExpanded] = useState(true);
  const [datePickerExpanded, setDatePickerExpanded] = useState(false);

  return (
    <Column gap={1}>
      {view === 'list' && (
        <>
          <Button
            variant="ghost"
            block
            className="flush"
            onClick={() => setDateExpanded(e => !e)}
          >
            <Row justify="between" align="center">
              Date range
              <ChevronDown size={12} className={`chevron${dateExpanded ? ' open' : ''}`} />
            </Row>
          </Button>
          {dateExpanded && (
            <Row gap={1} wrap>
              {DATE_OPTIONS.map(opt => (
                <Chip
                  key={opt.key}
                  active={filters.dateRange === opt.key}
                  onClick={() => onChange({ ...filters, dateRange: opt.key, dateFrom: '', dateTo: '' })}
                >
                  {opt.label}
                </Chip>
              ))}
            </Row>
          )}
        </>
      )}

      <Button
        variant="ghost"
        block
        className="flush"
        onClick={() => setDatePickerExpanded(e => !e)}
      >
        <Row justify="between" align="center">
          Custom date
          <ChevronDown size={12} className={`chevron${datePickerExpanded ? ' open' : ''}`} />
        </Row>
      </Button>
      {datePickerExpanded && (
        <Column gap={1}>
          <Column gap={1}>
            <Text size="caption" color="muted">From</Text>
            <Input
              type="date"
              className="min-w-0"
              value={filters.dateFrom}
              onChange={e => onChange({ ...filters, dateFrom: e.target.value, dateRange: 'all' })}
            />
          </Column>
          <Column gap={1}>
            <Text size="caption" color="muted">To</Text>
            <Input
              type="date"
              className="min-w-0"
              value={filters.dateTo}
              min={filters.dateFrom || undefined}
              onChange={e => onChange({ ...filters, dateTo: e.target.value, dateRange: 'all' })}
            />
          </Column>
          {(filters.dateFrom || filters.dateTo) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onChange({ ...filters, dateFrom: '', dateTo: '' })}
            >
              <Row justify="between" align="center">
                Clear dates <X size={12} />
              </Row>
            </Button>
          )}
        </Column>
      )}
    </Column>
  );
}
