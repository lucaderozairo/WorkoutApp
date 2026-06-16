import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '@ui/molecules/Button';
import { LoadingState } from './LoadingState';

const meta = {
  component: LoadingState,
  tags: ['ai-generated'],
} satisfies Meta<typeof LoadingState>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Loading: Story = {
  args: { state: 'loading', title: 'Loading session history', skeletonRows: 4 },
};

export const Empty: Story = {
  args: {
    state: 'empty',
    title: 'No routes saved',
    message: 'Create a route to compare elevation, distance, and estimated effort.',
    action: <Button variant="primary">Create route</Button>,
  },
};

export const Error: Story = {
  args: {
    state: 'error',
    title: 'Sync unavailable',
    message: 'Device data could not be refreshed.',
    action: <Button variant="secondary">Retry sync</Button>,
  },
};
