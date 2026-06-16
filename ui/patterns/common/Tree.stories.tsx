import type { Meta, StoryObj } from '@storybook/react-vite';
import { Tree } from './Tree';
import { StoryPanel } from '../../storybook/storyData';

const nodes = [
  {
    id: 'strength',
    label: 'Strength',
    children: [
      { id: 'push', label: 'Push' },
      { id: 'pull', label: 'Pull' },
    ],
  },
  {
    id: 'endurance',
    label: 'Endurance',
    children: [
      { id: 'threshold', label: 'Threshold' },
      { id: 'long', label: 'Long aerobic' },
    ],
  },
];

const meta = {
  component: Tree,
  tags: ['ai-generated'],
  decorators: [(Story) => <StoryPanel maxWidth={320}><Story /></StoryPanel>],
} satisfies Meta<typeof Tree>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Expanded: Story = {
  args: { nodes, defaultExpanded: ['strength'] },
};
