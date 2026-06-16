import type { Meta, StoryObj } from '@storybook/react-vite';
import { Row } from './Row';

const Box = ({ label }: { label: string }) => <div style={{ padding: '8px 16px', background: 'var(--surface-2)', borderRadius: 8 }}>{label}</div>;

const meta = {
  component: Row,
  tags: ['ai-generated'],
} satisfies Meta<typeof Row>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { children: [<Box key="a" label="A" />, <Box key="b" label="B" />, <Box key="c" label="C" />] },
};

export const AlignCenter: Story = {
  args: { align: 'center', children: [<Box key="a" label="Tall" />, <Box key="b" label="Short" />] },
};

export const JustifyBetween: Story = {
  args: { justify: 'between', children: [<Box key="a" label="Left" />, <Box key="b" label="Right" />] },
};

export const GapLarge: Story = {
  args: { gap: 5, children: [<Box key="a" label="A" />, <Box key="b" label="B" />, <Box key="c" label="C" />] },
};

export const Wrap: Story = {
  args: { wrap: true, children: Array.from({ length: 8 }, (_, i) => <Box key={i} label={`Item ${i + 1}`} />) },
};
