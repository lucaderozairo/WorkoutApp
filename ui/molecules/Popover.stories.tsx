import type { Meta, StoryObj } from '@storybook/react-vite';
import { Popover } from './Popover';

const meta = {
  component: Popover,
  tags: ['ai-generated'],
} satisfies Meta<typeof Popover>;

export default meta;
type Story = StoryObj<typeof meta>;

export const BottomStart: Story = {
  args: { trigger: 'Open', position: 'bottom', align: 'start', children: <div style={{ padding: 8 }}>Popover content here</div> },
};
