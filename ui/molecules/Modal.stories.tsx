import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';

const meta = {
  component: Modal,
  tags: ['ai-generated'],
  render: function Render(args) {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button variant="primary" onClick={() => setOpen(true)}>Open Modal</Button>
        <Modal {...args} open={open} onClose={() => setOpen(false)} />
      </>
    );
  },
} satisfies Meta<typeof Modal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Small: Story = {
  args: { title: 'Confirm', size: 'sm', children: 'Are you sure you want to proceed?', open: false, onClose: () => {} },
};

export const Medium: Story = {
  args: { title: 'Session Details', size: 'md', children: 'Here are the details of your workout session including exercises, sets, and rest periods.', open: false, onClose: () => {} },
};

export const WithFooter: Story = {
  args: { title: 'Export Data', size: 'sm', children: 'Your data will be exported as a CSV file.', footer: <Button variant="primary" onClick={() => {}}>Export</Button>, open: false, onClose: () => {} },
};
