import {
  ActivityKey, OUTDOOR_SPORTS, ACTIVITY_META, DEFAULT_RECENT_SPORTS,
} from './activityConfig';

interface Props {
  recentSports: ActivityKey[];
  selectedActivity: ActivityKey;
  onSelectActivity: (a: ActivityKey) => void;
  onStartNow: () => void;
  onPlan: () => void;
  onOpenOverlay: () => void;
}

export function ActivityInlinePicker({
  recentSports, selectedActivity, onSelectActivity, onStartNow, onPlan, onOpenOverlay,
}: Props) {
  const chips = recentSports.length >= 3
    ? recentSports.slice(0, 3)
    : DEFAULT_RECENT_SPORTS;

  const isOutdoor = OUTDOOR_SPORTS.has(selectedActivity);

  return (
    <div className="column compact surface">
      <div className="row compact">
        {chips.map(key => {
          const { emoji, label } = ACTIVITY_META[key];
          return (
            <button
              key={key}
              className={`surface compact column${selectedActivity === key ? ' chip--active' : ''}`}
              onClick={() => onSelectActivity(key)}
            >
              <h2>{emoji}</h2>
              <span className="caption">{label}</span>
            </button>
          );
        })}
        <button className="surface compact column" onClick={onOpenOverlay}>
          <h2>⊕</h2>
          <span className="caption">Other</span>
        </button>
      </div>

      {isOutdoor && (
        <button className="surface inset row align-center compact">
          <span>🗺️</span>
          <span className="grow muted">Add route (optional)</span>
          <button className="primary icon">＋</button>
        </button>
      )}

      <div className="row compact">
        <button className="surface primary grow" onClick={onStartNow}>▶ Start now</button>
        <button className="surface secondary grow" onClick={onPlan}>📅 Plan</button>
      </div>
    </div>
  );
}
