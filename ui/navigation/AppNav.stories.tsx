import type { Meta, StoryObj } from '@storybook/react-vite';
import { AppNav } from './AppNav';
import { noop } from '../storybook/storyData';

const meta = {
  component: AppNav,
  tags: ['ai-generated'],
} satisfies Meta<typeof AppNav>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Rail: Story = {
  args: { menuOpen: false, onMenuToggle: noop },
};

export const Expanded: Story = {
  args: { menuOpen: true, onMenuToggle: noop, onMenuClose: noop },
};
