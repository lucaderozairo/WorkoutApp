import { useQuery } from '@ui/bindings';
import { Flame } from 'phosphor-react';
import { Row, Column } from '@ui/layout';
import { Surface, Text } from '@ui/atoms';
import { Badge } from '@ui/molecules';

interface WelcomeWidgetProps {
  workoutsThisWeek: number;
  streak: number;
  scoreClass: 'good' | 'warning' | 'poor' | 'none';
  hasReadinessEntry: boolean;
  score: number;
}

export function WelcomeWidget({ workoutsThisWeek, streak, scoreClass, hasReadinessEntry, score }: WelcomeWidgetProps) {
  const displayName = useQuery('display_name') ?? 'there';
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
      <Column gap={1}>
        <span className="eyebrow">{day} · {date}</span>
        <h1>{greeting}, {displayName}.</h1>
        <Row align="center" gap={2}>
          <Text size="detail">{workoutLine}</Text>
          {streak >= 2 && (
            <Badge title={`${streak} day training streak`}>
              <Flame size={12} /> {streak}
            </Badge>
          )}
        </Row>
        {hasReadinessEntry ? (
          <Badge className={`tinted ${scoreClass}`}>
            <Text as="span" mono>{score}</Text>
            <span>Readiness</span>
          </Badge>
        ) : (
          <Text size="caption" color="muted">
            Log readiness to see your score
          </Text>
        )}
      </Column>
    </Surface>
  );
}
