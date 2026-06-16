import type { Meta, StoryObj } from '@storybook/react-vite';
import { Badge } from './Badge';

const meta = {
  component: Badge,
  tags: ['ai-generated'],
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Ok: Story = {
  args: { tone: 'ok', children: 'Completed' },
};

export const Warn: Story = {
  args: { tone: 'warn', children: 'Delayed' },
};

export const Bad: Story = {
  args: { tone: 'bad', children: 'Failed' },
};

export const Accent: Story = {
  args: { tone: 'accent', children: 'Featured' },
};

export const Plain: Story = {
  args: { tone: 'plain', children: 'Default' },
};

export const WithDot: Story = {
  args: { dot: true, tone: 'ok', children: 'Online' },
};

export const Active: Story = {
  args: { active: true, tone: 'accent', children: 'Active' },
};
