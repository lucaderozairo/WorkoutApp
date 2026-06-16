import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { SegmentedControl } from './SegmentedControl';

const OPTIONS = [
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
];

const meta = {
  component: SegmentedControl,
  tags: ['ai-generated'],
  render: function Render() {
    const [val, setVal] = useState('week');
    return <SegmentedControl options={OPTIONS} value={val} onChange={setVal} />;
  },
} satisfies Meta<typeof SegmentedControl>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WeekSelected: Story = {
  args: { options: OPTIONS, value: 'week', onChange: () => {} },
};
