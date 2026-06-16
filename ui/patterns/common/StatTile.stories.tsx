import type { Meta, StoryObj } from '@storybook/react-vite';
import { StatTile } from './StatTile';

const meta = {
  component: StatTile,
  tags: ['ai-generated'],
} satisfies Meta<typeof StatTile>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { value: 42.6, unit: 'km', label: 'Week' },
};
