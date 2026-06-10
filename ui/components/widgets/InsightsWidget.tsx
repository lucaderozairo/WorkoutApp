import { Column, Text, WidgetShell, type DemoWidgetProps } from './widgetPrimitives';

export function InsightsWidget({ size }: DemoWidgetProps) {
  return (
    <WidgetShell title="Insights" badge="2" size={size}>
      <Column gap={2}>
        <Text size="detail">Long-run pace is trending faster at similar HR.</Text>
        {size !== 'sm' && <Text size="caption" color="muted">Review the last four aerobic sessions.</Text>}
      </Column>
    </WidgetShell>
  );
}
