import type { Meta, StoryObj } from '@storybook/react-vite';
import { ProgressBar } from './ProgressBar';
import { Column } from '@ui/layout/Column';

const meta = {
  component: ProgressBar,
  tags: ['ai-generated'],
} satisfies Meta<typeof ProgressBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Halfway: Story = {
  args: { value: 50 },
};

export const Full: Story = {
  args: { value: 100 },
};

export const Empty: Story = {
  args: { value: 0 },
};

export const Ok: Story = {
  args: { value: 80, variant: 'ok' },
};

export const Warn: Story = {
  args: { value: 50, variant: 'warn' },
};

export const Bad: Story = {
  args: { value: 25, variant: 'bad' },
};

export const Small: Story = {
  args: { value: 66, size: 'sm' },
};

export const WithLabel: Story = {
  render: (args) => (
    <Column gap={2}>
      <span>Progress: {args.value}%</span>
      <ProgressBar {...args} />
    </Column>
  ),
  args: { value: 72, variant: 'ok' },
};
