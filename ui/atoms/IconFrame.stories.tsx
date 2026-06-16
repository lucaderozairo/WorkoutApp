import type { Meta, StoryObj } from '@storybook/react-vite';
import { IconFrame } from './IconFrame';
import { Icon } from './Icon';
import { Row } from '@ui/layout/Row';

const meta = {
  component: IconFrame,
  tags: ['ai-generated'],
} satisfies Meta<typeof IconFrame>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Neutral: Story = {
  args: { children: <Icon name="heart" size="sm" /> },
};

export const Accent: Story = {
  args: { tone: 'accent', children: <Icon name="heart" size="sm" /> },
};

export const Success: Story = {
  args: { tone: 'success', children: <Icon name="check" size="sm" /> },
};

export const Warning: Story = {
  args: { tone: 'warning', children: <Icon name="warning" size="sm" /> },
};

export const Danger: Story = {
  args: { tone: 'danger', children: <Icon name="close" size="sm" /> },
};

export const SportLift: Story = {
  args: { sport: 'lift', children: <Icon name="zap" size="sm" /> },
};

export const SportRun: Story = {
  args: { sport: 'run', children: <Icon name="activity" size="sm" /> },
};

export const SizeRow: Story = {
  args: { children: null, tone: 'neutral' },
  render: () => (
    <Row gap={2} align="center">
      <IconFrame size="sm"><Icon name="star" size="sm" /></IconFrame>
      <IconFrame size="md"><Icon name="star" size="sm" /></IconFrame>
      <IconFrame size="lg"><Icon name="star" size="sm" /></IconFrame>
      <IconFrame size="xl"><Icon name="star" size="sm" /></IconFrame>
    </Row>
  ),
};
