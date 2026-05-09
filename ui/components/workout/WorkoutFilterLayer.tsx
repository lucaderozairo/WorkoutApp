interface WorkoutFilterLayerProps {
  sessionType?: string;       // e.g. 'strength', 'run', etc.
  exercise?: string;          // specific exercise name
  dateRange?: string;         // '7d' | '30d' | 'all'
  onClearType?: () => void;
  onClearExercise?: () => void;
  onClearDateRange?: () => void;
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
    exercise ||
    (dateRange && dateRange !== 'all');

  if (!hasActiveFilters) return null;

  return (
    <div className="row">
      {sessionType && sessionType !== 'all' && (
        <button className="chip active" onClick={onClearType}>
          {sessionType} ✕
        </button>
      )}
      {exercise && (
        <button className="chip active" onClick={onClearExercise}>
          {exercise} ✕
        </button>
      )}
      {dateRange && dateRange !== 'all' && (
        <button className="chip active" onClick={onClearDateRange}>
          {dateRange} ✕
        </button>
      )}
    </div>
  );
}
