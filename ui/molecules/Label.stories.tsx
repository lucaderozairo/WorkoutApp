import type { Meta, StoryObj } from '@storybook/react-vite';
import { Label } from './Label';

const meta = {
  component: Label,
  tags: ['ai-generated'],
} satisfies Meta<typeof Label>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { children: 'Email Address' },
};

export const Required: Story = {
  args: { children: null },
  render: () => <Label>Password <span style={{ color: 'red' }}>*</span></Label>,
};
