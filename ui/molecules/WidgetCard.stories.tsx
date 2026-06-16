import type { Meta, StoryObj } from '@storybook/react-vite';
import { WidgetCard } from './WidgetCard';

const meta = {
  component: WidgetCard,
  tags: ['ai-generated'],
} satisfies Meta<typeof WidgetCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Alias: Story = {
  args: {
    label: 'Readiness',
    children: <span className="mono detail">82</span>,
    footer: <span className="caption muted">Updated 06:20</span>,
  },
};
