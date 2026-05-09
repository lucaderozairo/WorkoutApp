import { useState } from "react";
import type { CardioSport } from "@features/cardio";

export type ViewMode = 'list' | 'month' | 'week';
export type TimeRange = '7d' | '30d' | 'all';
export type SortOrder = 'newest' | 'oldest';
export type TypeFilter = "all" | "strength" | CardioSport;

export interface SessionFilters {
  view: ViewMode;
  dateRange: TimeRange;
  type: TypeFilter;
  exercise: string;
  sort: SortOrder;
}

export const DEFAULT_FILTERS: SessionFilters = {
  view: 'list',
  dateRange: 'all',
  type: 'all',
  exercise: '',
  sort: 'newest',
};

const TYPE_OPTIONS: { key: TypeFilter; label: string }[] = [
  { key: 'all',       label: 'All' },
  { key: 'strength',  label: 'Gym' },
  { key: 'run',       label: 'Run' },
  { key: 'cycle',     label: 'Cycle' },
  { key: 'hike',      label: 'Hike' },
  { key: 'swim',      label: 'Swim' },
  { key: 'row',       label: 'Row' },
  { key: 'ski',       label: 'Ski' },
  { key: 'snowboard', label: 'Snowboard' },
  { key: 'climb',     label: 'Climb' },
  { key: 'surf',      label: 'Surf' },
  { key: 'kayak',     label: 'Kayak' },
  { key: 'yoga',      label: 'Yoga' },
  { key: 'boxing',    label: 'Boxing' },
  { key: 'stretch',   label: 'Stretch' },
  { key: 'hiit',      label: 'HIIT' },
];

interface SessionFilterBarProps {
  filters: SessionFilters;
  onChange: (f: SessionFilters) => void;
  exerciseOptions: string[];
}

export function SessionFilterBar({
  filters,
  onChange,
}: Omit<SessionFilterBarProps, 'exerciseOptions'>) {
  return (
    <div className="column compact">
      {/* View toggle — always visible */}
      <div className="tabs">
        {(['list', 'month', 'week'] as ViewMode[]).map(v => (
          <button
            key={v}
            className={`tab${filters.view === v ? ' active' : ''}`}
            onClick={() => onChange({ ...filters, view: v })}
          >
            {v === 'list' ? '≡ List' : v === 'month' ? '▦ Month' : '⬚ Week'}
          </button>
        ))}
      </div>

      {/* Time range + sort — list view only */}
      {filters.view === 'list' && (
        <div className="row compact align-center">
          <div className="cluster compact">
            {(['all', '7d', '30d'] as TimeRange[]).map(r => (
              <button
                key={r}
                className={`chip${filters.dateRange === r ? ' active' : ''}`}
                onClick={() => onChange({ ...filters, dateRange: r })}
              >
                {r === 'all' ? 'All time' : r === '7d' ? 'Past 7d' : 'Past 30d'}
              </button>
            ))}
          </div>
          <button
            className="chip"
            onClick={() => onChange({ ...filters, sort: filters.sort === 'newest' ? 'oldest' : 'newest' })}
          >
            {filters.sort === 'newest' ? '↓ Newest' : '↑ Oldest'}
          </button>
        </div>
      )}
    </div>
  );
}

export function SessionTypeExerciseFilter({
  filters,
  onChange,
  exerciseOptions,
}: SessionFilterBarProps) {
  const [exerciseOpen, setExerciseOpen] = useState(false);
  const [exerciseSearch, setExerciseSearch] = useState("");

  const matchingExercises = exerciseOptions.filter((n) =>
    n.toLowerCase().includes(exerciseSearch.toLowerCase()),
  );

  return (
    <div className="column compact">
      {/* Type chips */}
      <div className="cluster">
        {TYPE_OPTIONS.map(opt => (
          <button
            key={opt.key}
            className={`chip${filters.type === opt.key ? ' active' : ''}`}
            onClick={() => onChange({ ...filters, type: opt.key })}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Exercise filter chip */}
      <div className="cluster">
        <button
          className={`chip${filters.exercise ? ' active' : ''}`}
          onClick={() => setExerciseOpen(o => !o)}
        >
          {filters.exercise || 'Exercise'}{' '}
          <span aria-hidden="true">{exerciseOpen ? '▴' : '▾'}</span>
        </button>
      </div>

      {exerciseOpen && (
        <div className="column compact">
          <input
            placeholder="Search exercises…"
            value={exerciseSearch}
            onChange={(e) => setExerciseSearch(e.target.value)}
            autoFocus
          />
          <div className="cluster compact">
            {matchingExercises.slice(0, 8).map((name) => (
              <button
                key={name}
                className={filters.exercise === name ? 'primary' : ''}
                onClick={() => {
                  onChange({ ...filters, exercise: filters.exercise === name ? '' : name });
                  setExerciseOpen(false);
                  setExerciseSearch('');
                }}
              >
                {name}
              </button>
            ))}
            {filters.exercise && (
              <button
                className="ghost sm"
                onClick={() => {
                  onChange({ ...filters, exercise: '' });
                  setExerciseOpen(false);
                }}
              >
                Clear ✕
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
