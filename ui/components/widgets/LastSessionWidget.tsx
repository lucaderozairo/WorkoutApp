import { useNavigate } from 'react-router-dom';
import { useQuery } from '@ui/bindings';
import { Surface, Text } from '@ui/atoms';
import { Column, Row } from '@ui/layout';
import { Button } from '@ui/molecules';
import type { WidgetSize } from './widgetTypes';
import type { ActivityHistoryItem } from '@features/training_log/contract';

export function LastSessionWidget({ size }: { size: WidgetSize }) {
  const navigate = useNavigate();
  const history = (useQuery('activity_history') ?? []) as ActivityHistoryItem[];
  const last = history[0];

  return (
    <Surface pad="sm" className="h-full">
      <Column gap={2} className="h-full">
        <Row align="center" justify="between">
          <Text size="eyebrow">Last Session</Text>
          <Button variant="ghost" size="sm" onClick={() => navigate('/sessions')}>See all</Button>
        </Row>

        {!last ? (
          <Column gap={1} className="h-full" justify="center">
            <Text size="caption" color="muted">No sessions logged yet</Text>
          </Column>
        ) : (() => {
          const dateStr = new Date(last.startedAt).toLocaleDateString(undefined, {
            weekday: 'short', month: 'short', day: 'numeric',
          });
          const durMin = Math.round(last.durationSeconds / 60);
          const durStr = durMin >= 60
            ? `${Math.floor(durMin / 60)}h ${durMin % 60}m`
            : `${durMin} min`;

          if (size === 'sm') {
            return (
              <Column gap={0} className="min-w-0">
                <Text size="detail">{last.name}</Text>
                <Text size="caption" color="muted">{durStr} · {last.totalSets} sets</Text>
              </Column>
            );
          }

          return (
            <Column gap={1}>
              <Text size="detail">{last.name}</Text>
              <Row gap={3}>
                <Column gap={0} className="surface flat pad-sm r-sm grow">
                  <Text size="caption" color="muted">Duration</Text>
                  <Text size="detail" mono>{durStr}</Text>
                </Column>
                <Column gap={0} className="surface flat pad-sm r-sm grow">
                  <Text size="caption" color="muted">Sets</Text>
                  <Text size="detail" mono>{last.totalSets}</Text>
                </Column>
                <Column gap={0} className="surface flat pad-sm r-sm grow">
                  <Text size="caption" color="muted">Date</Text>
                  <Text size="detail">{dateStr}</Text>
                </Column>
              </Row>
            </Column>
          );
        })()}
      </Column>
    </Surface>
  );
}
