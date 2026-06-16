import type { Meta, StoryObj } from '@storybook/react-vite';
import { TimePicker } from './TimePicker';

const meta = {
  component: TimePicker,
  tags: ['ai-generated'],
} satisfies Meta<typeof TimePicker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};

export const WithLabel: Story = {
  args: { label: 'Start Time' },
};

export const WithValue: Story = {
  args: { label: 'Alarm', defaultValue: '07:00' },
};
