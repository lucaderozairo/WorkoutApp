import type { Meta, StoryObj } from '@storybook/react-vite';
import { DataValue } from './DataValue';

const meta = {
  component: DataValue,
  tags: ['ai-generated'],
} satisfies Meta<typeof DataValue>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Number: Story = {
  args: { value: 42, unit: 'kg', variant: 'number' },
};

export const Percentage: Story = {
  args: { value: 75, unit: '%', variant: 'percentage' },
};

export const Duration: Story = {
  args: { value: '45:30', variant: 'duration' },
};

export const Distance: Story = {
  args: { value: '5.2', unit: 'km', variant: 'distance' },
};

export const Weight: Story = {
  args: { value: 80, unit: 'kg', variant: 'weight' },
};

export const Date: Story = {
  args: { value: 'Jun 15', variant: 'date' },
};

export const Positive: Story = {
  args: { value: '+12%', tone: 'positive', variant: 'delta' },
};

export const Negative: Story = {
  args: { value: '-5%', tone: 'negative', variant: 'delta' },
};

export const Muted: Story = {
  args: { value: 'Optional', tone: 'muted' },
};

export const Small: Story = {
  args: { value: 100, unit: 'kg', size: 'sm' },
};

export const Large: Story = {
  args: { value: '1,234', unit: 'kcal', size: 'xl' },
};
