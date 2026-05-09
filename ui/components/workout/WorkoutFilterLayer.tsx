import { X } from 'lucide-react';
import type { TypeFilter, TimeRange } from '@ui/components/log/SessionFilterBar';

interface WorkoutFilterLayerProps {
  sessionType?: TypeFilter;
  exercise: string;
  dateRange?: TimeRange;
  onClearType: () => void;
  onClearExercise: () => void;
  onClearDateRange: () => void;
}

export function WorkoutFilterLayer({
  sessionType,
  exercise,
  dateRange,
  onClearType,
  onClearExercise,
  onClearDateRange,
}: WorkoutFilterLayerProps) {
  const hasActiveFilters =
    (sessionType && sessionType !== 'all') ||
    (exercise && exercise !== '') ||
    (dateRange && dateRange !== 'all');

  if (!hasActiveFilters) return null;

  return (
    <div className="row">
      {sessionType && sessionType !== 'all' && (
        <button className="chip active" onClick={onClearType}>
          {sessionType} <X size={9} />
        </button>
      )}
      {exercise && exercise !== '' && (
        <button className="chip active" onClick={onClearExercise}>
          {exercise} <X size={9} />
        </button>
      )}
      {dateRange && dateRange !== 'all' && (
        <button className="chip active" onClick={onClearDateRange}>
          {dateRange} <X size={9} />
        </button>
      )}
    </div>
  );
}
