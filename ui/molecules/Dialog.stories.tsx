import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Dialog } from './Dialog';
import { Button } from './Button';

const meta = {
  component: Dialog,
  tags: ['ai-generated'],
  render: function Render(args) {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button variant="primary" onClick={() => setOpen(true)}>Open Dialog</Button>
        <Dialog {...args} open={open} onClose={() => setOpen(false)} onConfirm={() => setOpen(false)} />
      </>
    );
  },
} satisfies Meta<typeof Dialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Confirm: Story = {
  args: { title: 'Delete workout?', message: 'This action cannot be undone.', confirm: 'Delete', destructive: true, open: false, onClose: () => {}, onConfirm: () => {} },
};

export const Info: Story = {
  args: { title: 'Discard changes?', message: 'You have unsaved progress.', confirm: 'Discard', open: false, onClose: () => {}, onConfirm: () => {} },
};
