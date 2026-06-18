import { useState } from 'react';
import { SlidersHorizontal, Search, X } from 'lucide-react';
import type { SessionFilters, ViewMode } from '@ui/components/log/SessionFilterBar';
import { Row, Column, Cluster, Layered } from '@ui/layout';
import { Text, Chip } from '@ui/atoms';
import { Button, FloatingPanel, Input } from '@ui/molecules';
import { DateFilterPanel } from './DateFilterPanel';
import { TypeFilterPanel, TYPE_LABEL } from './TypeFilterPanel';
import { ExerciseSearchFilter } from './ExerciseSearchFilter';

const DATE_LABEL: Record<SessionFilters['dateRange'], string> = {
  all: 'All time',
  '7d': 'Past 7d',
  '30d': 'Past 30d',
};

interface WorkoutFilterBarProps {
  filters: SessionFilters;
  onChange: (f: SessionFilters) => void;
  exerciseOptions: string[];
  view: ViewMode;
}

export function WorkoutFilterBar({ filters, onChange, exerciseOptions, view }: WorkoutFilterBarProps) {
  const [filtersOpen, setFiltersOpen] = useState(false);

  const activeCount = [
    filters.type !== 'all',
    filters.exercise !== '',
    filters.dateRange !== 'all',
    filters.dateFrom !== '',
  ].filter(Boolean).length;

  const hasActivechips = activeCount > 0 || filters.sessionName !== '' || filters.sort !== 'newest';

  function clearAll() {
    onChange({
      ...filters,
      type: 'all', exercise: '', dateRange: 'all',
      dateFrom: '', dateTo: '', sort: 'newest',
    });
  }

  const filtersBtnOpen = filtersOpen && activeCount === 0;

  return (
    <Column gap={1}>
      <Row gap={1} align="center">
        {/* ── Session name search ── */}
        <Input
          className="min-w-0"
          leading={<Search size={14} className="faint" />}
          trailing={filters.sessionName ? (
            <Button variant="ghost" size="icon-sm" onClick={() => onChange({ ...filters, sessionName: '' })}>
              <X size={12} />
            </Button>
          ) : undefined}
            placeholder="Search sessions…"
            value={filters.sessionName}
            onChange={e => onChange({ ...filters, sessionName: e.target.value })}
        />

        {/* ── Sort chip sm ── */}
        <Chip
          active={filters.sort !== 'newest'}
          onClick={() => onChange({ ...filters, sort: filters.sort === 'newest' ? 'oldest' : 'newest' })}
        >
          {filters.sort === 'newest' ? '↓ Newest' : '↑ Oldest'}
        </Chip>

        {/* ── Filters button + panel ── */}
        <Layered>
          <Button
            variant={activeCount > 0 ? 'primary' : 'secondary'}
            size="sm"
            active={filtersBtnOpen}
            onClick={() => setFiltersOpen(o => !o)}
            leading={<SlidersHorizontal size={14} />}
          >
            Filters
            {activeCount > 0 && <span className="badge">{activeCount}</span>}
          </Button>

          {filtersOpen && (
            <FloatingPanel pin="below-right" z="fixed" className="filter-panel">
                <Column gap={1}>
                  {/* Header */}
                  <Row gap={1} justify="between" align="center">
                    <Text size="caption">Filters</Text>
                    {activeCount > 0 && (
                      <Button variant="ghost" size="sm" onClick={clearAll}>Clear all</Button>
                    )}
                  </Row>


                  <DateFilterPanel filters={filters} onChange={onChange} view={view} />
                  <TypeFilterPanel filters={filters} onChange={onChange} />
                  <ExerciseSearchFilter filters={filters} onChange={onChange} exerciseOptions={exerciseOptions} />
                </Column>
            </FloatingPanel>
          )}
        </Layered>
      </Row>

      {/* ── Active filter chip sms ── */}
      {hasActivechips && (
        <Cluster gap={1}>
          {filters.sessionName && (
            <Chip active trailing={<X size={9} />} onClick={() => onChange({ ...filters, sessionName: '' })}>
              "{filters.sessionName}"
            </Chip>
          )}
          {filters.type !== 'all' && (
            <Chip active trailing={<X size={9} />} onClick={() => onChange({ ...filters, type: 'all' })}>
              {TYPE_LABEL[filters.type]}
            </Chip>
          )}
          {filters.exercise && (
            <Chip active trailing={<X size={9} />} onClick={() => onChange({ ...filters, exercise: '' })}>
              {filters.exercise}
            </Chip>
          )}
          {filters.dateFrom ? (
            <Chip active trailing={<X size={9} />} onClick={() => onChange({ ...filters, dateFrom: '', dateTo: '' })}>
              {filters.dateFrom}{filters.dateTo && filters.dateTo !== filters.dateFrom ? ` – ${filters.dateTo}` : ''}
            </Chip>
          ) : filters.dateRange !== 'all' && (
            <Chip active trailing={<X size={9} />} onClick={() => onChange({ ...filters, dateRange: 'all' })}>
              {DATE_LABEL[filters.dateRange]}
            </Chip>
          )}
          {filters.sort !== 'newest' && (
            <Chip active trailing={<X size={9} />} onClick={() => onChange({ ...filters, sort: 'newest' })}>
              ↑ Oldest
            </Chip>
          )}
        </Cluster>
      )}
    </Column>
  );
}
