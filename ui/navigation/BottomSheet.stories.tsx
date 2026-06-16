import type { Meta, StoryObj } from '@storybook/react-vite';
import { Text } from '@ui/atoms';
import { BottomSheet } from './BottomSheet';

const meta = {
  component: BottomSheet,
  tags: ['ai-generated'],
} satisfies Meta<typeof BottomSheet>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Peek: Story = {
  args: { snap: 'peek', children: <Text>Route options</Text> },
};

export const Mid: Story = {
  args: { snap: 'mid', children: <Text>Route options and elevation summary</Text> },
};

export const Full: Story = {
  args: { snap: 'full', children: <Text>Full route planning panel</Text> },
};
