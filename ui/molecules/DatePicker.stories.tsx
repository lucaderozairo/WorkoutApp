import type { Meta, StoryObj } from '@storybook/react-vite';
import { DatePicker } from './DatePicker';
import { StoryPanel } from '../storybook/storyData';

const meta = {
  component: DatePicker,
  tags: ['ai-generated'],
  decorators: [(Story) => <StoryPanel maxWidth={360}><Story /></StoryPanel>],
} satisfies Meta<typeof DatePicker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    label: 'Session date',
    hint: 'Used for calendar and weekly load charts.',
    defaultValue: '2026-06-15',
  },
};

export const Error: Story = {
  args: {
    label: 'Session date',
    error: 'Choose a date inside the current training block.',
    defaultValue: '2026-06-15',
  },
};
