import type { Meta, StoryObj } from '@storybook/react-vite';
import { WidgetCard } from './WidgetCard';

const meta = {
  component: WidgetCard,
  tags: ['ai-generated'],
} satisfies Meta<typeof WidgetCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    label: 'Weekly load',
    children: <span className="mono detail">486 AU</span>,
    footer: <span className="caption muted">+8% vs last week</span>,
  },
};

export const Loading: Story = {
  args: {
    children: null,
  },
  render: () => <WidgetCard.Skeleton label footer />,
};
