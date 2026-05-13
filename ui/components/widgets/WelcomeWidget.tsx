import { useQuery } from '@ui/bindings';
import { viewStore } from '@data/projections/views';
import { APP_MODE } from '@config/app-mode';

interface WelcomeWidgetProps {
  workoutsThisWeek: number;
  scoreClass: 'good' | 'warning' | 'poor';
}

export function WelcomeWidget({ workoutsThisWeek, scoreClass }: WelcomeWidgetProps) {
  const displayName = useQuery<string>('display_name') ?? 'there';
  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const day  = now.toLocaleDateString(undefined, { weekday: 'long' });
  const date = now.toLocaleDateString(undefined, { month: 'long', day: 'numeric' });

  const workoutLine = workoutsThisWeek === 0
    ? 'No workouts logged yet this week.'
    : workoutsThisWeek === 1 ? 'One workout this week.'
    : `${workoutsThisWeek} workouts this week.`;

  const recoveryWord = scoreClass === 'good' ? 'green' : scoreClass === 'warning' ? 'amber' : 'red';

  function handleChangeName() {
    viewStore.set('display_name', null);
  }

  return (
    <div className="surface compact ghost">
      <span className="caption">{day} · {date}</span>
      <div className="row align-center compact">
        <h2>{ greeting }, {displayName}.</h2>
      </div>
      <p className="detail">
        {/* {{workoutLine} Recovery is <span className={`value ${scoreClass}`}>{recoveryWord}</span>. }Let's keep it rolling. */}
      </p>
    </div>
  );
}
