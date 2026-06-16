import type { Meta, StoryObj } from '@storybook/react-vite';
import { ChartContainer } from './ChartContainer';

const meta = {
  component: ChartContainer,
  tags: ['ai-generated'],
} satisfies Meta<typeof ChartContainer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { children: <div style={{ padding: 16 }}>Chart content here</div> },
};

export const Loading: Story = {
  args: { loading: true, children: null },
};

export const Empty: Story = {
  args: { empty: true, emptyMessage: 'No workouts this week', children: null },
};

export const SmallHeight: Story = {
  args: { height: 'sm', children: <div style={{ padding: 16 }}>Compact chart</div> },
};

export const LargeHeight: Story = {
  args: { height: 'lg', children: <div style={{ padding: 16 }}>Tall chart area</div> },
};
