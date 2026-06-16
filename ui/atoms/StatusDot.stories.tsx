import type { Meta, StoryObj } from '@storybook/react-vite';
import { StatusDot } from './StatusDot';
import { Cluster } from '@ui/layout/Cluster';

const meta = {
  component: StatusDot,
  tags: ['ai-generated'],
} satisfies Meta<typeof StatusDot>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Neutral: Story = {
  args: { tone: 'neutral', label: 'Inactive' },
};

export const Online: Story = {
  args: { tone: 'online', label: 'Online' },
};

export const Offline: Story = {
  args: { tone: 'offline', label: 'Offline' },
};

export const Live: Story = {
  args: { tone: 'live', label: 'Live' },
};

export const Idle: Story = {
  args: { tone: 'idle', label: 'Idle' },
};

export const Syncing: Story = {
  args: { tone: 'syncing', label: 'Syncing' },
};

export const Success: Story = {
  args: { tone: 'success', label: 'Success' },
};

export const Warning: Story = {
  args: { tone: 'warning', label: 'Warning' },
};

export const Error: Story = {
  args: { tone: 'error', label: 'Error' },
};

export const Small: Story = {
  args: { size: 'sm', tone: 'online', label: 'Small' },
};

export const AllTones: Story = {
  render: () => (
    <Cluster gap={3}>
      <StatusDot tone="neutral" label="neutral" />
      <StatusDot tone="online" label="online" />
      <StatusDot tone="offline" label="offline" />
      <StatusDot tone="idle" label="idle" />
      <StatusDot tone="live" label="live" />
      <StatusDot tone="syncing" label="syncing" />
      <StatusDot tone="success" label="success" />
      <StatusDot tone="warning" label="warning" />
      <StatusDot tone="error" label="error" />
    </Cluster>
  ),
};
