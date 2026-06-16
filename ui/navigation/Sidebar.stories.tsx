import type { Meta, StoryObj } from '@storybook/react-vite';
import { Activity, Map, Settings } from 'lucide-react';
import { Button } from '@ui/molecules/Button';
import { Column } from '@ui/layout';
import { Sidebar } from './Sidebar';

const rail = (
  <Column gap={1}>
    <Button variant="ghost" size="icon" aria-label="Activity"><Activity size={18} aria-hidden="true" /></Button>
    <Button variant="ghost" size="icon" aria-label="Routes"><Map size={18} aria-hidden="true" /></Button>
    <Button variant="ghost" size="icon" aria-label="Settings"><Settings size={18} aria-hidden="true" /></Button>
  </Column>
);

const meta = {
  component: Sidebar,
  tags: ['ai-generated'],
} satisfies Meta<typeof Sidebar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Collapsed: Story = {
  args: { open: false, rail },
};

export const Open: Story = {
  args: { open: true, rail, children: <span className="caption muted">Route planning tools</span> },
};
