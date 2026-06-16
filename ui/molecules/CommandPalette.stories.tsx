import type { Meta, StoryObj } from '@storybook/react-vite';
import { CommandPalette } from './CommandPalette';
import { commandItems, StoryPanel } from '../storybook/storyData';

const meta = {
  component: CommandPalette,
  tags: ['ai-generated'],
  decorators: [(Story) => <StoryPanel maxWidth={440}><Story /></StoryPanel>],
} satisfies Meta<typeof CommandPalette>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { items: commandItems, placeholder: 'Jump to' },
};
