import { Badge } from '@ui/molecules';
import { Cluster, WidgetShell, type DemoWidgetProps } from './widgetPrimitives';

export function ActiveGoalsWidget({ size }: DemoWidgetProps) {
  return (
    <WidgetShell title="Active Goals" badge="3" size={size}>
      <Cluster gap={2}>
        <Badge>10K pace</Badge>
        <Badge>Sleep 8h</Badge>
        <Badge>Strength block</Badge>
      </Cluster>
    </WidgetShell>
  );
}
