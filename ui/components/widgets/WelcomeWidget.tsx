import { useQuery } from '@ui/bindings';
import { Flame } from 'lucide-react';

interface WelcomeWidgetProps {
  workoutsThisWeek: number;
  streak: number;
  scoreClass: 'good' | 'warning' | 'poor';
}

export function WelcomeWidget({ workoutsThisWeek, streak, scoreClass }: WelcomeWidgetProps) {
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

  return (
    <div className="surface tight ghost">
      <span className="caption">{day} · {date}</span>
      <div className="row align-center compact">
        <h2>{greeting}, {displayName}.</h2>
      </div>
      <div className="row align-center compact">
        <p className="detail">{workoutLine}</p>
        {streak >= 2 && (
          <span className="pill caption row align-center compact" title={`${streak} day training streak`}>
            <Flame size={12} /> {streak}
          </span>
        )}
      </div>
    </div>
  );
}
