import type { Meta, StoryObj } from '@storybook/react-vite';
import { Badge } from './Badge';
import { StatDisplay } from './StatDisplay';
import { StoryPanel } from '../storybook/storyData';

const meta = {
  component: StatDisplay,
  tags: ['ai-generated'],
  decorators: [(Story) => <StoryPanel><Story /></StoryPanel>],
} satisfies Meta<typeof StatDisplay>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { label: 'Readiness', value: 82, unit: '/100', trend: 'up', badge: <Badge tone="ok">Ready</Badge> },
};

export const Large: Story = {
  args: { label: 'Weekly load', value: 486, unit: 'AU', size: 'lg', trend: 'flat' },
};
