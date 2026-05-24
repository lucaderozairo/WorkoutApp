import { useState } from 'react';
import { ChevronDown, Check, SlidersHorizontal, Search, X } from 'lucide-react';
import type { SessionFilters, TypeFilter, ViewMode } from '@ui/components/log/SessionFilterBar';

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
    <div className="column compact">
      <div className="row compact align-center">
        {/* ── Session name search ── */}
        <div className="row compact align-center grow">
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
        </div>

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
            {activeCount > 0 && <span className="pill">{activeCount}</span>}
          </button>

          {filtersOpen && (
            <div className="absolute right filter-panel">
              <div className="surface column compact">
                {/* Header */}
                <div className="row compact space-between align-center">
                  <span className="caption">Filters</span>
                  {activeCount > 0 && (
                    <button className="ghost sm" onClick={clearAll}>Clear all</button>
                  )}
                </div>
                

                {/* Date range — list view only */}
                {view === 'list' && (
                  <>
                    <button
                      className="ghost flush row space-between align-center"
                      onClick={() => setDateExpanded(e => !e)}
                    >
                      Date range
                      <ChevronDown size={12} className={`chevron${dateExpanded ? ' open' : ''}`} />
                    </button>
                    {dateExpanded && (
                      <div className="cluster compact">
                        {DATE_OPTIONS.map(opt => (
                          <button
                            key={opt.key}
                            className={`chip sm${filters.dateRange === opt.key ? ' active' : ''}`}
                            onClick={() => onChange({ ...filters, dateRange: opt.key, dateFrom: '', dateTo: '' })}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    )}
                    
                  </>
                )}

                {/* Custom date picker */}
                <button
                  className="ghost flush row space-between align-center"
                  onClick={() => setDatePickerExpanded(e => !e)}
                >
                  Custom date
                  <ChevronDown size={12} className={`chevron${datePickerExpanded ? ' open' : ''}`} />
                </button>
                {datePickerExpanded && (
                  <div className=" column compact">
                    <div className="column compact">
                      <span className="caption muted">From</span>
                      <input
                        type="date"
                        className="grow"
                        value={filters.dateFrom}
                        onChange={e => onChange({ ...filters, dateFrom: e.target.value, dateRange: 'all' })}
                      />
                    </div>
                    <div className="column compact">
                      <span className="caption muted">To</span>
                      <input
                        type="date"
                        className="grow"
                        value={filters.dateTo}
                        min={filters.dateFrom || undefined}
                        onChange={e => onChange({ ...filters, dateTo: e.target.value, dateRange: 'all' })}
                      />
                    </div>
                    {(filters.dateFrom || filters.dateTo) && (
                      <button
                        className="ghost sm"
                        onClick={() => onChange({ ...filters, dateFrom: '', dateTo: '' })}
                      >
                        <div className="row space-between align-center">
                          <span>Clear dates </span>
                          <X size={12} />
                        </div>
                      </button>
                    )}
                  </div>
                )}
                

                {/* Workout type */}
                <button
                  className="ghost flush row space-between align-center"
                  onClick={() => setTypeExpanded(e => !e)}
                >
                  Workout type
                  <ChevronDown size={12} className={`chevron${typeExpanded ? ' open' : ''}`} />
                </button>
                {typeExpanded && (
                  <div className="cluster compact">
                    {TYPE_OPTIONS.map(opt => (
                      <button
                        key={opt.key}
                        className={`chip sm${filters.type === opt.key ? ' active' : ''}`}
                        onClick={() => onChange({ ...filters, type: opt.key })}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>

                )}
                

                {/* Exercise search */}
                <span className="caption muted">Exercise</span>
                <div className="relative">
                  <div className="row compact align-center">
                    <input
                      className="grow"
                      placeholder="Search exercises…"
                      value={exerciseSearch}
                      onChange={e => setExerciseSearch(e.target.value)}
                      onFocus={() => setExerciseFocused(true)}
                      onBlur={() => setTimeout(() => setExerciseFocused(false), 150)}
                    />
                  </div>
                  {exerciseFocused && exerciseSearch && matchingExercises.length > 0 && (
                    <div className="dropdown">
                      <div className="surface tight">
                        {matchingExercises.slice(0, 6).map(name => (
                          <button
                            key={name}
                            className="ghost row space-between align-center"
                            onMouseDown={() => {
                              onChange({ ...filters, exercise: name });
                              setExerciseSearch('');
                            }}
                          >
                            {name}
                            {filters.exercise === name && <Check size={12} />}
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
                      </div>
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
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Active filter chip sms ── */}
      {hasActivechips && (
        <div className="cluster compact">
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
        </div>
      )}
    </div>
  );
}
