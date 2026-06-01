import { useQuery } from '@ui/bindings';
import { Flame } from 'lucide-react';
import { Row, Column } from '@ui/layout';
import { Surface, Text, Badge } from '@ui/atoms';

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
    <Surface pad="sm" variant="ghost">
      <Column>
        <Text size="caption">{day} · {date}</Text>
        <Row align="center" gap={1}>
          <Text as="h2">{greeting}, {displayName}.</Text>
        </Row>
        <Row align="center" gap={1}>
          <Text size="detail">{workoutLine}</Text>
          {streak >= 2 && (
            <span className="badge caption" title={`${streak} day training streak`}>
              <Flame size={12} /> {streak}
            </span>
          )}
        </Row>
      </Column>
    </Surface>
  );
}
