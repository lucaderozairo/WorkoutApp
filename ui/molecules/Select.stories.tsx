import type { Meta, StoryObj } from '@storybook/react-vite';
import { Select } from './Select';

const EXERCISES = [
  { value: 'bench', label: 'Bench Press' },
  { value: 'squat', label: 'Squat' },
  { value: 'deadlift', label: 'Deadlift' },
  { value: 'overhead', label: 'Overhead Press' },
];

const meta = {
  component: Select,
  tags: ['ai-generated'],
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { options: EXERCISES, placeholder: 'Choose exercise...' },
};

export const WithLabel: Story = {
  args: { label: 'Exercise', options: EXERCISES, placeholder: 'Select...' },
};

export const WithHint: Story = {
  args: { label: 'Muscle Group', hint: 'Primary muscle targeted', options: [{ value: 'chest', label: 'Chest' }, { value: 'back', label: 'Back' }, { value: 'legs', label: 'Legs' }] },
};

export const WithError: Story = {
  args: { label: 'Category', error: 'This field is required', options: EXERCISES },
};
