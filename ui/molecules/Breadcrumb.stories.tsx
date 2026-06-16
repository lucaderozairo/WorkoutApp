import type { Meta, StoryObj } from '@storybook/react-vite';
import { Breadcrumb } from './Breadcrumb';

const meta = {
  component: Breadcrumb,
  tags: ['ai-generated'],
} satisfies Meta<typeof Breadcrumb>;

export default meta;
type Story = StoryObj<typeof meta>;

export const TwoLevels: Story = {
  args: { items: [{ label: 'Home', href: '/' }, { label: 'Settings' }] },
};

export const ThreeLevels: Story = {
  args: { items: [{ label: 'Home', href: '/' }, { label: 'Workouts', href: '/workouts' }, { label: 'Bench Press' }] },
};

export const WithButtons: Story = {
  args: { items: [{ label: 'Back', onClick: () => {} }, { label: 'Current Page' }] },
};
