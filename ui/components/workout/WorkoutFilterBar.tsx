import { useState } from 'react';
import { ChevronDown, Check, SlidersHorizontal, Search, X } from 'lucide-react';
import type { SessionFilters, TypeFilter, ViewMode } from '@ui/components/log/SessionFilterBar';
import { Row, Column, Cluster } from '@ui/layout';
import { Surface } from '@ui/atoms';

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
            <button className="ghost icon sm" onClick={() => onChange({ ...filters, sessionName: '' })}>
              <X size={12} />
            </button>
          )}
        </Row>

        {/* ── Sort chip sm ── */}
        <button
          className={`chip sm${filters.sort !== 'newest' ? ' active' : ''}`}
          onClick={() => onChange({ ...filters, sort: filters.sort === 'newest' ? 'oldest' : 'newest' })}
        >
          {filters.sort === 'newest' ? '↓ Newest' : '↑ Oldest'}
        </button>

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
                    <span className="caption">Filters</span>
                    {activeCount > 0 && (
                      <button className="ghost sm" onClick={clearAll}>Clear all</button>
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
                            <button
                              key={opt.key}
                              className={`chip sm${filters.dateRange === opt.key ? ' active' : ''}`}
                              onClick={() => onChange({ ...filters, dateRange: opt.key, dateFrom: '', dateTo: '' })}
                            >
                              {opt.label}
                            </button>
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
                        <span className="caption muted">From</span>
                        <input
                          type="date"
                          className="grow"
                          value={filters.dateFrom}
                          onChange={e => onChange({ ...filters, dateFrom: e.target.value, dateRange: 'all' })}
                        />
                      </Column>
                      <Column gap={1}>
                        <span className="caption muted">To</span>
                        <input
                          type="date"
                          className="grow"
                          value={filters.dateTo}
                          min={filters.dateFrom || undefined}
                          onChange={e => onChange({ ...filters, dateTo: e.target.value, dateRange: 'all' })}
                        />
                      </Column>
                      {(filters.dateFrom || filters.dateTo) && (
                        <button
                          className="ghost sm"
                          onClick={() => onChange({ ...filters, dateFrom: '', dateTo: '' })}
                        >
                          <Row justify="between" align="center">
                            <span>Clear dates </span>
                            <X size={12} />
                          </Row>
                        </button>
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
                        <button
                          key={opt.key}
                          className={`chip sm${filters.type === opt.key ? ' active' : ''}`}
                          onClick={() => onChange({ ...filters, type: opt.key })}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </Cluster>

                  )}


                  {/* Exercise search */}
                  <span className="caption muted">Exercise</span>
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
                            <button
                              key={name}
                              className="ghost block"
                              onMouseDown={() => {
                                onChange({ ...filters, exercise: name });
                                setExerciseSearch('');
                              }}
                            >
                              <Row justify="between" align="center">
                                {name}
                                {filters.exercise === name && <Check size={12} />}
                              </Row>
                            </button>
                          ))}
                          {filters.exercise && (
                            <button
                              className="ghost sm block"
                              onMouseDown={() => onChange({ ...filters, exercise: '' })}
                            >
                              Clear ✕
                            </button>
                          )}
                        </Surface>
                      </div>
                    )}
                  </div>
                  {filters.exercise && (
                    <button
                      className="chip sm active"
                      onClick={() => onChange({ ...filters, exercise: '' })}
                    >
                      {filters.exercise} <X size={9} />
                    </button>
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
            <button className="chip sm active" onClick={() => onChange({ ...filters, sessionName: '' })}>
              "{filters.sessionName}" <X size={9} />
            </button>
          )}
          {filters.type !== 'all' && (
            <button className="chip sm active" onClick={() => onChange({ ...filters, type: 'all' })}>
              {TYPE_LABEL[filters.type]} <X size={9} />
            </button>
          )}
          {filters.exercise && (
            <button className="chip sm active" onClick={() => onChange({ ...filters, exercise: '' })}>
              {filters.exercise} <X size={9} />
            </button>
          )}
          {filters.dateFrom ? (
            <button className="chip sm active" onClick={() => onChange({ ...filters, dateFrom: '', dateTo: '' })}>
              {filters.dateFrom}{filters.dateTo && filters.dateTo !== filters.dateFrom ? ` – ${filters.dateTo}` : ''}
              {' '}<X size={9} />
            </button>
          ) : filters.dateRange !== 'all' && (
            <button className="chip sm active" onClick={() => onChange({ ...filters, dateRange: 'all' })}>
              {DATE_LABEL[filters.dateRange]} <X size={9} />
            </button>
          )}
          {filters.sort !== 'newest' && (
            <button className="chip sm active" onClick={() => onChange({ ...filters, sort: 'newest' })}>
              ↑ Oldest <X size={9} />
            </button>
          )}
        </Cluster>
      )}
    </Column>
  );
}
