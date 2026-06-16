import type { Meta, StoryObj } from '@storybook/react-vite';
import { Icon } from './Icon';
import { Row } from '@ui/layout/Row';
import type { ReactNode } from 'react';

const meta = {
  component: Icon,
  tags: ['ai-generated'],
} satisfies Meta<typeof Icon>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Small: Story = {
  args: { name: 'heart', size: 'sm' },
};

export const Medium: Story = {
  args: { name: 'heart', size: 'md' },
};

export const Large: Story = {
  args: { name: 'heart', size: 'lg' },
};

export const AllIcons: Story = {
  args: { name: 'star' },
  render: () => {
    const names = ['play', 'pause', 'check', 'close', 'add', 'edit', 'delete', 'search', 'settings', 'user', 'bell', 'heart', 'activity', 'zap', 'clock', 'chart', 'star', 'flag', 'map', 'calendar'] as const;
    const items: ReactNode[] = [];
    for (const name of names) {
      items.push(<Icon key={name} name={name} size="md" />);
    }
    return <Row gap={2} wrap>{items}</Row>;
  },
};
