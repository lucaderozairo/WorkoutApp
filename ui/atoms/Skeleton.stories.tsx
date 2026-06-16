import type { Meta, StoryObj } from '@storybook/react-vite';
import { Skeleton } from './Skeleton';
import { Column } from '@ui/layout/Column';
import { Row } from '@ui/layout/Row';
import type { CSSProperties } from 'react';

const meta = {
  component: Skeleton,
  tags: ['ai-generated'],
} satisfies Meta<typeof Skeleton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Block: Story = {
  args: { size: 'block' },
};

export const Line: Story = {
  args: { size: 'line' },
};

export const Short: Story = {
  args: { size: 'line', short: true },
};

export const CardSkeleton: Story = {
  args: { size: 'block' },
  render: () => (
    <div style={{ width: 300 } as CSSProperties}>
      <Column gap={3}>
        <Skeleton size="block" />
        <Skeleton size="line" />
        <Skeleton size="line" short />
      </Column>
    </div>
  ),
};

export const RowWithAvatar: Story = {
  args: { size: 'block' },
  render: () => (
    <Row gap={3} align="center">
      <Skeleton size="block" />
      <Column gap={2}>
        <Skeleton size="line" />
        <Skeleton size="line" short />
      </Column>
    </Row>
  ),
};
