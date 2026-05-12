import type { CardioSport } from "@features/cardio";

export type ViewMode = 'list' | 'month' | 'week';
export type TimeRange = '7d' | '30d' | 'all';
export type SortOrder = 'newest' | 'oldest';
export type TypeFilter = "all" | "strength" | CardioSport;

export interface SessionFilters {
  view: ViewMode;
  dateRange: TimeRange;
  dateFrom: string;
  dateTo: string;
  type: TypeFilter;
  exercise: string;
  sessionName: string;
  sort: SortOrder;
}

export const DEFAULT_FILTERS: SessionFilters = {
  view: 'list',
  dateRange: 'all',
  dateFrom: '',
  dateTo: '',
  type: 'all',
  exercise: '',
  sessionName: '',
  sort: 'newest',
};


export function SessionFilterBar({
  filters,
  onChange,
}: {
  filters: SessionFilters;
  onChange: (f: SessionFilters) => void;
}) {
  return (
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
  );
}
