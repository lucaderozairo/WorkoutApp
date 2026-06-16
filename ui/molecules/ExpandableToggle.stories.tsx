import type { Meta, StoryObj } from '@storybook/react-vite';
import { ExpandableToggle } from './ExpandableToggle';
import { StoryPanel } from '../storybook/storyData';

const meta = {
  component: ExpandableToggle,
  tags: ['ai-generated'],
  decorators: [(Story) => <StoryPanel maxWidth={260}><Story /></StoryPanel>],
} satisfies Meta<typeof ExpandableToggle>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { id: 'example-expandable-toggle' },
};
