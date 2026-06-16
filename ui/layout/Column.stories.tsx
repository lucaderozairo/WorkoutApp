import type { Meta, StoryObj } from '@storybook/react-vite';
import { Column } from './Column';

const Box = ({ label }: { label: string }) => <div style={{ padding: '8px 16px', background: 'var(--surface-2)', borderRadius: 8 }}>{label}</div>;

const meta = {
  component: Column,
  tags: ['ai-generated'],
} satisfies Meta<typeof Column>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { children: [<Box key="a" label="Top" />, <Box key="b" label="Middle" />, <Box key="c" label="Bottom" />] },
};

export const AlignCenter: Story = {
  args: { align: 'center', children: [<Box key="a" label="Centered" />, <Box key="b" label="Also centered" />] },
};

export const JustifyBetween: Story = {
  args: { justify: 'between', children: [<Box key="a" label="Top" />, <Box key="b" label="Bottom" />] },
};
