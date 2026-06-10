import { DemoWidget, type DemoWidgetProps } from './widgetPrimitives';

export function CaloriesWidget({ size }: DemoWidgetProps) {
  return (
    <DemoWidget
      title="Calories"
      size={size}
      metrics={[{ label: 'Today', value: 2480 }]}
    />
  );
}
