import type { Meta, StoryObj } from '@storybook/react-vite';
import { ContextMenu } from './ContextMenu';
import { menuItems, moreButton, StoryPanel } from '../storybook/storyData';

const meta = {
  component: ContextMenu,
  tags: ['ai-generated'],
  decorators: [(Story) => <StoryPanel><Story /></StoryPanel>],
} satisfies Meta<typeof ContextMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { trigger: moreButton, items: menuItems },
};

export const LeftAligned: Story = {
  args: { trigger: 'Actions', items: menuItems, align: 'left' },
};
