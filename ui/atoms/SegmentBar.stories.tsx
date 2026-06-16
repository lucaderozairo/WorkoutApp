import type { Meta, StoryObj } from '@storybook/react-vite';
import { SegmentBar } from './SegmentBar';

const meta = {
  component: SegmentBar,
  tags: ['ai-generated'],
} satisfies Meta<typeof SegmentBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { value: 8, max: 14 },
};

export const Full: Story = {
  args: { value: 14, max: 14 },
};

export const Empty: Story = {
  args: { value: 0, max: 14 },
};

export const CustomSegments: Story = {
  args: { value: 3, max: 5, segments: 5 },
};

export const Colored: Story = {
  args: { value: 10, max: 14, color: 'c-strength' },
};
