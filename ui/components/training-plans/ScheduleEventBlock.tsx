import { Column } from '../../layout/Column';
import { Text } from '../../atoms/Text';

interface ScheduleEventBlockProps {
  sport: string;
  title: string;
  subtitle: string;
}

export function ScheduleEventBlock({ sport, title, subtitle }: ScheduleEventBlockProps) {
  return (
    <Column className="schedule-event-block" data-sport={sport}>
      <Text bold>{title}</Text>
      <Text size="caption" color="muted">{subtitle}</Text>
    </Column>
  );
}
