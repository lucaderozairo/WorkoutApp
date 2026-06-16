import type { Meta, StoryObj } from '@storybook/react-vite';
import { Cluster } from './Cluster';

const Chip = ({ label }: { label: string }) => <span style={{ padding: '4px 12px', background: 'var(--surface-2)', borderRadius: 999, fontSize: 13 }}>{label}</span>;

const meta = {
  component: Cluster,
  tags: ['ai-generated'],
} satisfies Meta<typeof Cluster>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { children: ['Strength', 'Cardio', 'Flexibility', 'HIIT', 'Yoga', 'Pilates', 'CrossFit'].map(s => <Chip key={s} label={s} />) },
};

export const GapSmall: Story = {
  args: { gap: 1, children: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => <Chip key={d} label={d} />) },
};

export const AlignCenter: Story = {
  args: { align: 'center', children: [<Chip key="a" label="Tag" />, <span key="b">Mixed height elements align</span>] },
};
