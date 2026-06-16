import type { Meta, StoryObj } from '@storybook/react-vite';
import { NavItem } from './NavItem';
import { House } from 'phosphor-react';

const meta = {
  component: NavItem,
  tags: ['ai-generated'],
} satisfies Meta<typeof NavItem>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Home: Story = {
  args: { to: '/home', label: 'Home', Icon: House },
};
