import type { Meta, StoryObj } from '@storybook/react-vite';
import { Dumbbell, Share2, Trash2 } from 'lucide-react';
import { ActionSheet } from './ActionSheet';
import { noop } from '../storybook/storyData';

const meta = {
  component: ActionSheet,
  tags: ['ai-generated'],
  args: {
    open: true,
    onClose: noop,
    title: 'Session actions',
    items: [
      { label: 'Start from template', icon: <Dumbbell size={16} aria-hidden="true" />, onClick: noop },
      { label: 'Share summary', icon: <Share2 size={16} aria-hidden="true" />, onClick: noop },
      { label: 'Delete session', icon: <Trash2 size={16} aria-hidden="true" />, destructive: true, onClick: noop },
    ],
  },
} satisfies Meta<typeof ActionSheet>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Open: Story = {};

export const Closed: Story = {
  args: { open: false },
};
