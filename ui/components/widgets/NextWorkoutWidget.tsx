import { useNavigate } from 'react-router-dom';
import { useQuery } from '@ui/bindings';
import { Surface, Text } from '@ui/atoms';
import { Column, Row } from '@ui/layout';
import { Button } from '@ui/molecules';
import type { WidgetSize } from './widgetTypes';
import type { Appointment } from '@features/scheduling/contract';

export function NextWorkoutWidget({ size: _size }: { size: WidgetSize }) {
  const navigate = useNavigate();
  const allAppointments = (useQuery<Appointment[]>('appointments_by_date') ?? []) as Appointment[];

  const now = Date.now();
  const next = allAppointments
    .filter(a => a.scheduledAt > now)
    .sort((a, b) => a.scheduledAt - b.scheduledAt)[0];

  return (
    <Surface pad="sm" className="h-full">
      <Column gap={2} className="h-full">
        <Row align="center" justify="between">
          <span className="eyebrow">Next Workout</span>
          <Button variant="ghost" size="sm" onClick={() => navigate('/sessions/new')}>+ New</Button>
        </Row>

        {!next ? (
          <Text size="caption" color="muted">No workout planned</Text>
        ) : (() => {
          const dateStr = new Date(next.scheduledAt).toLocaleDateString(undefined, {
            weekday: 'short', month: 'short', day: 'numeric',
          });
          const timeStr = new Date(next.scheduledAt).toLocaleTimeString(undefined, {
            hour: '2-digit', minute: '2-digit',
          });
          return (
            <Column gap={0}>
              <Text size="detail">{next.title}</Text>
              <Text size="caption" color="muted">{dateStr} · {timeStr}</Text>
            </Column>
          );
        })()}
      </Column>
    </Surface>
  );
}
