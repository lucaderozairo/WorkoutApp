import type { Meta, StoryObj } from '@storybook/react-vite';
import { ChevronRight } from 'lucide-react';
import { Badge } from '@ui/molecules/Badge';
import { StackedList } from './StackedList';
import { noop } from '../../storybook/storyData';

const meta = {
  component: StackedList,
  tags: ['ai-generated'],
} satisfies Meta<typeof StackedList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Interactive: Story = {
  args: {
    items: [
      { id: 'hrv', label: 'HRV baseline', sublabel: 'Updated 06:20', trailing: <Badge tone="ok">Stable</Badge>, onClick: noop },
      { id: 'load', label: 'Training load', sublabel: '7 day total', trailing: <Badge tone="warn">High</Badge>, onClick: noop },
      { id: 'details', label: 'Session details', trailing: <ChevronRight size={16} aria-hidden="true" />, onClick: noop },
    ],
  },
};
