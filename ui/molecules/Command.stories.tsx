import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { Command } from './Command';
import { commandItems, StoryPanel } from '../storybook/storyData';

const meta = {
  component: Command,
  tags: ['ai-generated'],
  decorators: [(Story) => <StoryPanel maxWidth={440}><Story /></StoryPanel>],
} satisfies Meta<typeof Command>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { items: commandItems, placeholder: 'Search actions' },
};

export const Empty: Story = {
  ...Default,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByPlaceholderText(/search actions/i), 'zzz');
    await expect(canvas.getByText(/no commands found/i)).toBeVisible();
  },
};
