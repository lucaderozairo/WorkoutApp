import type { Meta, StoryObj } from '@storybook/react-vite';
import { useEffect } from 'react';
import { Button } from './Button';
import { Toaster, useToast } from './Toast';

function ToastDemo() {
  const toast = useToast();

  useEffect(() => {
    toast.success('Session saved', { duration: 10000 });
  }, [toast]);

  return (
    <Button variant="secondary" onClick={() => toast.info('Sync queued', { duration: 4000 })}>
      Show toast
    </Button>
  );
}

const meta = {
  title: 'Molecules/Toast',
  component: Toaster,
  tags: ['ai-generated'],
} satisfies Meta<typeof Toaster>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { children: null },
  render: () => (
    <Toaster>
      <ToastDemo />
    </Toaster>
  ),
};
