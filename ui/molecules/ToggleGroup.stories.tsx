import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { ToggleGroup } from './ToggleGroup';
import type { ToggleGroupItem } from './ToggleGroup';

const VIEWS: ToggleGroupItem<string>[] = [
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
];

const meta = {
  component: ToggleGroup,
  tags: ['ai-generated'],
  render: function Render() {
    const [view, setView] = useState('week');
    return <ToggleGroup items={VIEWS} value={view} onChange={(v) => setView(v)} label="Calendar view" />;
  },
} satisfies Meta<typeof ToggleGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const CalendarViews: Story = {
  args: { items: VIEWS, value: 'week', onChange: () => {} },
};
