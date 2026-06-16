import type { Meta, StoryObj } from '@storybook/react-vite';
import { PageControl } from './PageControl';
import { noop, StoryPanel } from '../storybook/storyData';

const meta = {
  component: PageControl,
  tags: ['ai-generated'],
  decorators: [(Story) => <StoryPanel maxWidth={320}><Story /></StoryPanel>],
} satisfies Meta<typeof PageControl>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ReadOnly: Story = {
  args: { count: 5, index: 2, label: 'Workout cards' },
};

export const Interactive: Story = {
  args: { count: 4, index: 1, onChange: noop },
};
