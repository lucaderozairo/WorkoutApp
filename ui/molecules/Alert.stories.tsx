import type { Meta, StoryObj } from '@storybook/react-vite';
import { Alert } from './Alert';

const meta = {
  component: Alert,
  tags: ['ai-generated'],
} satisfies Meta<typeof Alert>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Info: Story = {
  args: { variant: 'info', title: 'Heads up', message: 'Your session will expire in 5 minutes.' },
};

export const Success: Story = {
  args: { variant: 'success', title: 'Synced', message: 'Your workout was saved successfully.' },
};

export const Warn: Story = {
  args: { variant: 'warn', title: 'Low battery', message: 'Connect your device to charge.' },
};

export const Error: Story = {
  args: { variant: 'error', title: 'Upload failed', message: 'Check your connection and try again.' },
};

export const NoTitle: Story = {
  args: { variant: 'info', message: 'Simple info message without a title.' },
};

export const Dismissible: Story = {
  args: { variant: 'warn', title: 'Reminder', message: 'Stretch after your workout.', dismissible: true, onDismiss: () => {} },
};

export const WithAction: Story = {
  args: { variant: 'error', message: 'GPS signal lost.', action: <button style={{ fontSize: 12 }}>Retry</button> },
};
