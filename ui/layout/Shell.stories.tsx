import type { Meta, StoryObj } from '@storybook/react-vite';
import { Shell } from './Shell';

const meta = {
  component: Shell,
  tags: ['ai-generated'],
} satisfies Meta<typeof Shell>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { children: <div style={{ padding: 24 }}>Main content area</div> },
};
