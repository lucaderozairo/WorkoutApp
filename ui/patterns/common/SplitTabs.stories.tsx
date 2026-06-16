import type { Meta, StoryObj } from '@storybook/react-vite';
import { Text } from '@ui/atoms';
import { SplitTabs } from './SplitTabs';

const panels = [
  { id: 'planned', label: 'Planned', content: <Text>2 sessions this week</Text> },
  { id: 'complete', label: 'Complete', content: <Text>4 sessions logged</Text> },
];

const meta = {
  component: SplitTabs,
  tags: ['ai-generated'],
} satisfies Meta<typeof SplitTabs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { panels },
};
