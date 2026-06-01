import { useState } from 'react';
import { ChevronDown, Check, SlidersHorizontal, Search, X } from 'lucide-react';
import type { SessionFilters, TypeFilter, ViewMode } from '@ui/components/log/SessionFilterBar';
import { Row, Column, Cluster } from '@ui/layout';
import { Surface, Button, Text, Chip } from '@ui/atoms';

const DATE_OPTIONS: { key: SessionFilters['dateRange']; label: string }[] = [
  { key: 'all', label: 'All time' },
  { key: '7d', label: 'Past 7 days' },
  { key: '30d', label: 'Past 30 days' },
];

const DATE_LABEL: Record<SessionFilters['dateRange'], string> = {
  all: 'All time',
  '7d': 'Past 7d',
  '30d': 'Past 30d',
};

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

const TYPE_LABEL: Record<string, string> = Object.fromEntries(
  TYPE_OPTIONS.map(o => [o.key, o.label])
);

interface WorkoutFilterBarProps {
  filters: SessionFilters;
  onChange: (f: SessionFilters) => void;
  exerciseOptions: string[];
  view: ViewMode;
}

export function WorkoutFilterBar({ filters, onChange, exerciseOptions, view }: WorkoutFilterBarProps) {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [dateExpanded, setDateExpanded] = useState(true);
  const [datePickerExpanded, setDatePickerExpanded] = useState(false);
  const [typeExpanded, setTypeExpanded] = useState(true);
  const [exerciseSearch, setExerciseSearch] = useState('');
  const [exerciseFocused, setExerciseFocused] = useState(false);

  const activeCount = [
    filters.type !== 'all',
    filters.exercise !== '',
    filters.dateRange !== 'all',
    filters.dateFrom !== '',
  ].filter(Boolean).length;

  const hasActivechips = activeCount > 0 || filters.sessionName !== '' || filters.sort !== 'newest';

  const matchingExercises = exerciseOptions.filter(n =>
    n.toLowerCase().includes(exerciseSearch.toLowerCase())
  );

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
        <Row gap={1} align="center" className="grow">
          <Search size={14} className="faint" />
          <input
            className="grow"
            placeholder="Search sessions…"
            value={filters.sessionName}
            onChange={e => onChange({ ...filters, sessionName: e.target.value })}
          />
          {filters.sessionName && (
            <Button variant="ghost" size="icon" onClick={() => onChange({ ...filters, sessionName: '' })}>
              <X size={12} />
            </Button>
          )}
        </Row>

        {/* ── Sort chip sm ── */}
        <Chip
          active={filters.sort !== 'newest'}
          onClick={() => onChange({ ...filters, sort: filters.sort === 'newest' ? 'oldest' : 'newest' })}
        >
          {filters.sort === 'newest' ? '↓ Newest' : '↑ Oldest'}
        </Chip>

        {/* ── Filters button + panel ── */}
        <div className="relative">
          <button
            className={activeCount > 0 ? 'primary' : `chip sm${filtersBtnOpen ? ' active' : ''}`}
            onClick={() => setFiltersOpen(o => !o)}
          >
            <SlidersHorizontal size={14} />
            Filters
            {activeCount > 0 && <span className="badge">{activeCount}</span>}
          </button>

          {filtersOpen && (
            <div className="absolute right filter-panel">
              <Surface>
                <Column gap={1}>
                  {/* Header */}
                  <Row gap={1} justify="between" align="center">
                    <Text size="caption">Filters</Text>
                    {activeCount > 0 && (
                      <Button variant="ghost" size="sm" onClick={clearAll}>Clear all</Button>
                    )}
                  </Row>


                  {/* Date range — list view only */}
                  {view === 'list' && (
                    <>
                      <button
                        className="ghost flush"
                        onClick={() => setDateExpanded(e => !e)}
                      >
                          <Row justify="between" align="center">
                            Date range
                            <ChevronDown size={12} className={`chevron${dateExpanded ? ' open' : ''}`} />
                      </Row>
                      </button>
                      {dateExpanded && (
                        <Cluster gap={1}>
                          {DATE_OPTIONS.map(opt => (
                            <Chip
                              key={opt.key}
                              active={filters.dateRange === opt.key}
                              onClick={() => onChange({ ...filters, dateRange: opt.key, dateFrom: '', dateTo: '' })}
                            >
                              {opt.label}
                            </Chip>
                          ))}
                        </Cluster>
                      )}

                    </>
                  )}

                  {/* Custom date picker */}
                  <button
                    className="ghost flush"
                    onClick={() => setDatePickerExpanded(e => !e)}
                  >
                      <Row justify="between" align="center">
                        Custom date
                        <ChevronDown size={12} className={`chevron${datePickerExpanded ? ' open' : ''}`} />
                  </Row>
                  </button>
                  {datePickerExpanded && (
                    <Column gap={1}>
                      <Column gap={1}>
                        <Text size="caption" color="muted">From</Text>
                        <input
                          type="date"
                          className="grow"
                          value={filters.dateFrom}
                          onChange={e => onChange({ ...filters, dateFrom: e.target.value, dateRange: 'all' })}
                        />
                      </Column>
                      <Column gap={1}>
                        <Text size="caption" color="muted">To</Text>
                        <input
                          type="date"
                          className="grow"
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


                  {/* Workout type */}
                  <button
                    className="ghost flush"
                    onClick={() => setTypeExpanded(e => !e)}
                  >
                      <Row justify="between" align="center">
                        Workout type
                        <ChevronDown size={12} className={`chevron${typeExpanded ? ' open' : ''}`} />
                  </Row>
                  </button>
                  {typeExpanded && (
                    <Cluster gap={1}>
                      {TYPE_OPTIONS.map(opt => (
                        <Chip
                          key={opt.key}
                          active={filters.type === opt.key}
                          onClick={() => onChange({ ...filters, type: opt.key })}
                        >
                          {opt.label}
                        </Chip>
                      ))}
                    </Cluster>

                  )}


                  {/* Exercise search */}
                  <Text size="caption" color="muted">Exercise</Text>
                  <div className="relative">
                    <Row gap={1} align="center">
                      <input
                        className="grow"
                        placeholder="Search exercises…"
                        value={exerciseSearch}
                        onChange={e => setExerciseSearch(e.target.value)}
                        onFocus={() => setExerciseFocused(true)}
                        onBlur={() => setTimeout(() => setExerciseFocused(false), 150)}
                      />
                    </Row>
                    {exerciseFocused && exerciseSearch && matchingExercises.length > 0 && (
                      <div className="dropdown">
                        <Surface pad="sm">
                          {matchingExercises.slice(0, 6).map(name => (
                            <Button
                              key={name}
                              variant="ghost"
                              block
                              onMouseDown={() => {
                                onChange({ ...filters, exercise: name });
                                setExerciseSearch('');
                              }}
                            >
                              <Row justify="between" align="center">
                                {name}
                                {filters.exercise === name && <Check size={12} />}
                              </Row>
                            </Button>
                          ))}
                          {filters.exercise && (
                            <Button
                              variant="ghost"
                              size="sm"
                              block
                              onMouseDown={() => onChange({ ...filters, exercise: '' })}
                            >
                              Clear ✕
                            </Button>
                          )}
                        </Surface>
                      </div>
                    )}
                  </div>
                  {filters.exercise && (
                    <Chip active trailing={<X size={9} />} onClick={() => onChange({ ...filters, exercise: '' })}>
                      {filters.exercise}
                    </Chip>
                  )}
                </Column>
              </Surface>
            </div>
          )}
        </div>
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
