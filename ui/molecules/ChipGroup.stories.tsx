import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { ChipGroup } from './ChipGroup';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const meta = {
  component: ChipGroup,
  tags: ['ai-generated'],
} as Meta<typeof ChipGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const DaysOfWeek: Story = {
  args: { options: DAYS, isActive: () => false, onToggle: () => {} },
  render: () => {
    const [active, setActive] = useState<string[]>(['Mon', 'Wed', 'Fri']);
    const isActive = (d: string | number) => active.includes(d as string);
    const onToggle = (d: string | number) => {
      const s = d as string;
      setActive(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
    };
    return <ChipGroup options={DAYS} isActive={isActive} onToggle={onToggle} />;
  },
};
