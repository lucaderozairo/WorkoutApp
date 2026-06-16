import type { Meta, StoryObj } from '@storybook/react-vite';
import { CalendarPlus } from 'lucide-react';
import { Button } from '@ui/molecules/Button';
import { EmptyState } from './EmptyState';

const meta = {
  component: EmptyState,
  tags: ['ai-generated'],
} satisfies Meta<typeof EmptyState>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithAction: Story = {
  args: {
    icon: <CalendarPlus size={28} aria-hidden="true" />,
    title: 'No sessions scheduled',
    message: 'Create the first workout in this training block.',
    action: <Button variant="primary">Plan session</Button>,
  },
};
