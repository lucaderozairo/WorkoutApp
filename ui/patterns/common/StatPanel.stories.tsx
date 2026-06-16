import type { Meta, StoryObj } from '@storybook/react-vite';
import { Badge } from '@ui/molecules/Badge';
import { StatPanel } from './StatPanel';

const meta = {
  component: StatPanel,
  tags: ['ai-generated'],
} satisfies Meta<typeof StatPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Readiness: Story = {
  args: { label: 'Readiness', value: 82, unit: '/100', trend: 'up', badge: <Badge tone="ok">Ready</Badge> },
};
