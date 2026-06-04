import { Row, Column } from '@ui/layout';
import { Surface, Text } from '@ui/atoms';
import { Badge } from '@ui/molecules';
import type { WidgetSize } from './widgetPrimitives';

const MOCK_FEED = [
  { type: 'lift',  date: 'Today', title: 'Upper A',        metric: '75 min · 18 sets' },
  { type: 'run',   date: 'May 8', title: 'Morning Run',    metric: '5.2 km · 26:14'   },
  { type: 'lift',  date: 'May 7', title: 'Lower B',        metric: '60 min · 14 sets'  },
  { type: 'cycle', date: 'May 5', title: 'Endurance Ride', metric: '42 km · 1:38'      },
  { type: 'lift',  date: 'May 4', title: 'Upper B',        metric: '68 min · 16 sets'  },
];

export function ActivityFeedWidget({ size }: { size: WidgetSize }) {
  const items = size === '2x2' ? MOCK_FEED : MOCK_FEED.slice(0, 3);
  return (
    <Surface pad="sm"><Column className="h-full">
      <Text size="eyebrow">Recent Sessions</Text>
      <Column gap={1} className="grow scroll-y">
        {items.map((item, i) => (
          <Row key={i} align="center" gap={1} className="list-divider">
            <Badge className={`pill ${item.type} plain`}>{item.type}</Badge>
            <Column gap={1} className="grow">
              <Text size="detail" className="truncate">{item.title}</Text>
              <Text size="caption" color="faint">{item.date}</Text>
            </Column>
            <Text size="caption" mono>{item.metric}</Text>
          </Row>
        ))}
      </Column>
    </Column></Surface>
  );
}
