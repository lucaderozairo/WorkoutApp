import type { Meta, StoryObj } from '@storybook/react-vite';
import { Metric } from './Metric';

const meta = {
  component: Metric,
  tags: ['ai-generated'],
} satisfies Meta<typeof Metric>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Small: Story = {
  args: { value: 42, unit: 'kg', size: 'sm' },
};

export const Medium: Story = {
  args: { value: 180, unit: 'cm', size: 'md' },
};

export const Large: Story = {
  args: { value: '12:34', unit: 'min', size: 'lg' },
};

export const ExtraLarge: Story = {
  args: { value: '5,280', unit: 'km', size: 'xl' },
};

export const Mono: Story = {
  args: { value: '1,234', mono: true },
};

export const NoUnit: Story = {
  args: { value: 100 },
};
