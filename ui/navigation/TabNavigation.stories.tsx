import type { Meta, StoryObj } from '@storybook/react-vite';
import { TabNavigation } from './TabNavigation';
import { noop } from '../storybook/storyData';

const meta = {
  component: TabNavigation,
  tags: ['ai-generated'],
} satisfies Meta<typeof TabNavigation>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Collapsed: Story = {
  args: { menuOpen: false, onMenuToggle: noop },
};

export const Expanded: Story = {
  args: { menuOpen: true, onMenuToggle: noop },
};
