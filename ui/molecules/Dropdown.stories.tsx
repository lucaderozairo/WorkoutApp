import type { Meta, StoryObj } from '@storybook/react-vite';
import { Dropdown } from './Dropdown';
import { menuItems, moreButton, StoryPanel } from '../storybook/storyData';

const meta = {
  component: Dropdown,
  tags: ['ai-generated'],
  decorators: [(Story) => <StoryPanel><Story /></StoryPanel>],
} satisfies Meta<typeof Dropdown>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { trigger: moreButton, items: menuItems },
};

export const LeftAligned: Story = {
  args: { trigger: 'Session menu', items: menuItems, align: 'left' },
};
