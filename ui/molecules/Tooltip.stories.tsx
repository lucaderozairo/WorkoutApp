import type { Meta, StoryObj } from '@storybook/react-vite';
import { Tooltip } from './Tooltip';
import { Cluster } from '@ui/layout/Cluster';

const meta = {
  component: Tooltip,
  tags: ['ai-generated'],
} satisfies Meta<typeof Tooltip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Top: Story = {
  args: { content: 'Add exercise', children: <span>Hover me</span> },
};

export const Bottom: Story = {
  args: { content: 'More info', position: 'bottom', children: <span>Bottom tooltip</span> },
};

export const OnIcon: Story = {
  args: { content: 'Settings', children: <span>⚙️</span> },
};
