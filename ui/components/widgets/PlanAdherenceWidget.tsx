import { DemoWidget, type DemoWidgetProps } from './widgetPrimitives';

export function PlanAdherenceWidget({ size }: DemoWidgetProps) {
  return (
    <DemoWidget
      title="Plan Adherence"
      badge="Week 4"
      size={size}
      metrics={[
        { label: 'Complete', value: 86, unit: '%' },
        { label: 'Missed', value: 1 },
      ]}
    />
  );
}
