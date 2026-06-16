import type { Meta, StoryObj } from '@storybook/react-vite';
import { ProgressRing } from './ProgressRing';
import { Row } from '@ui/layout/Row';

const meta = {
  component: ProgressRing,
  tags: ['ai-generated'],
} satisfies Meta<typeof ProgressRing>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Halfway: Story = {
  args: { value: 50 },
};

export const Complete: Story = {
  args: { value: 100 },
};

export const Empty: Story = {
  args: { value: 0 },
};

export const WithChildren: Story = {
  args: { value: 72, children: <span style={{ fontSize: 14 }}>72%</span> },
};

export const Ok: Story = {
  args: { value: 85, tone: 'ok' },
};

export const Warn: Story = {
  args: { value: 45, tone: 'warn' },
};

export const Bad: Story = {
  args: { value: 20, tone: 'bad' },
};

export const Small: Story = {
  args: { value: 66, size: 'sm' },
};

export const Large: Story = {
  args: { value: 33, size: 'lg' },
};

export const SizeRow: Story = {
  args: { value: 75 },
  render: () => (
    <Row gap={3} align="center">
      <ProgressRing value={75} size="sm" />
      <ProgressRing value={75} size="md" />
      <ProgressRing value={75} size="lg" />
    </Row>
  ),
};
