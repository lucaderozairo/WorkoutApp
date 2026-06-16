import type { Meta, StoryObj } from '@storybook/react-vite';
import { ScrollRow } from './ScrollRow';

const Card = ({ label }: { label: string }) => <div style={{ minWidth: 160, padding: 16, background: 'var(--surface-2)', borderRadius: 8, flexShrink: 0 }}>{label}</div>;

const meta = {
  component: ScrollRow,
  tags: ['ai-generated'],
} satisfies Meta<typeof ScrollRow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { children: Array.from({ length: 8 }, (_, i) => <Card key={i} label={`Card ${i + 1}`} />) },
};
