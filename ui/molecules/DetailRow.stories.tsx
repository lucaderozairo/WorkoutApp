import type { Meta, StoryObj } from '@storybook/react-vite';
import { DetailRow } from './DetailRow';
import { Column } from '@ui/layout/Column';

const meta = {
  component: DetailRow,
  tags: ['ai-generated'],
} satisfies Meta<typeof DetailRow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { label: 'Weight', value: '80 kg' },
};

export const Mono: Story = {
  args: { label: 'Time', value: '45:30', mono: true },
};

export const NumberValue: Story = {
  args: { label: 'Sets', value: 4 },
};

export const Stacked: Story = {
  args: { label: '', value: '' },
  render: () => (
    <Column gap={2}>
      <DetailRow label="Duration" value="52 min" />
      <DetailRow label="Distance" value="6.4 km" />
      <DetailRow label="Calories" value="420 kcal" mono />
      <DetailRow label="Avg HR" value="145 bpm" />
    </Column>
  ),
};
