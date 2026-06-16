import type { Meta, StoryObj } from '@storybook/react-vite';
import { FileDropSurface } from './FileDropSurface';
import { noop, StoryPanel, uploadPrompt } from '../storybook/storyData';

const meta = {
  component: FileDropSurface,
  tags: ['ai-generated'],
  decorators: [(Story) => <StoryPanel><Story /></StoryPanel>],
} satisfies Meta<typeof FileDropSurface>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    accept: '.fit,.csv',
    multiple: true,
    onFiles: noop,
    children: uploadPrompt,
  },
};

export const Busy: Story = {
  args: {
    busy: true,
    onFiles: noop,
    children: uploadPrompt,
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    onFiles: noop,
    children: uploadPrompt,
  },
};
