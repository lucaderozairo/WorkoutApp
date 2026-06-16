import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Drawer } from './Drawer';
import { Button } from './Button';

const meta = {
  component: Drawer,
  tags: ['ai-generated'],
  render: function Render(args) {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button variant="primary" onClick={() => setOpen(true)}>Open Drawer</Button>
        <Drawer {...args} open={open} onClose={() => setOpen(false)} />
      </>
    );
  },
} satisfies Meta<typeof Drawer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Right: Story = {
  args: { title: 'Details', children: <p style={{ padding: '16px 0' }}>Drawer content with details about the selected item.</p>, open: false, onClose: () => {} },
};

export const WithFooter: Story = {
  args: { title: 'Filters', children: <p style={{ padding: '16px 0' }}>Filter options go here.</p>, footer: <Button variant="primary" onClick={() => {}}>Apply</Button>, open: false, onClose: () => {} },
};
