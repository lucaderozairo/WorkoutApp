import { Row, Column } from '@ui/layout';
import { Surface, Text } from '@ui/atoms';
import { Badge } from '@ui/molecules';
import type { WidgetSize } from './widgetPrimitives';

const MOCK_INSIGHTS = [
  { severity: 'ok',   message: 'New squat estimated 1RM — 122.5 kg' },
  { severity: 'warn', message: 'Training load 18% above 4-week average' },
  { severity: 'info', message: 'No cardio logged in 9 days' },
];

const SEVERITY_BADGE: Record<string, string> = { ok: 'green', warn: 'amber', info: 'blue' };

export function InsightsWidget({ size }: { size: WidgetSize }) {
  const items = size === '2x2' ? MOCK_INSIGHTS : MOCK_INSIGHTS.slice(0, 2);
  return (
    <Surface pad="sm"><Column className="h-full">
      <Text size="eyebrow">Insights</Text>
      <Column gap={1} className="grow scroll-y">
        {items.map((ins, i) => (
          <Row key={i} gap={1} className="alert">
            <Badge className={SEVERITY_BADGE[ins.severity] ?? ''}>{ins.severity}</Badge>
            <Text size="detail" className="grow">{ins.message}</Text>
          </Row>
        ))}
      </Column>
    </Column></Surface>
  );
}
