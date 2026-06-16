import type { Meta, StoryObj } from '@storybook/react-vite';
import { ChartContainer } from './charts';

const lineData = [
  { x: 'Mon', y: 42 },
  { x: 'Tue', y: 48 },
  { x: 'Wed', y: 36 },
  { x: 'Thu', y: 54 },
  { x: 'Fri', y: 62 },
];

const meta = {
  title: 'Patterns/Charts/ChartContainer',
  component: ChartContainer,
  tags: ['ai-generated'],
} satisfies Meta<typeof ChartContainer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Line: Story = {
  args: { data: lineData, chartType: 'line', height: 180 },
};

export const Bar: Story = {
  args: { data: lineData, chartType: 'bar', height: 180 },
};

export const Area: Story = {
  args: { data: lineData, chartType: 'area', height: 180 },
};
