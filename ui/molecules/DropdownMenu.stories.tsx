import type { Meta, StoryObj } from '@storybook/react-vite';
import { DropdownMenu } from './DropdownMenu';
import { menuItems, moreButton, StoryPanel } from '../storybook/storyData';

const meta = {
  component: DropdownMenu,
  tags: ['ai-generated'],
  decorators: [(Story) => <StoryPanel><Story /></StoryPanel>],
} satisfies Meta<typeof DropdownMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Alias: Story = {
  args: { trigger: moreButton, items: menuItems },
};
