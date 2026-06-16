import type { Meta, StoryObj } from '@storybook/react-vite';
import { TrendItem } from './TrendItem';
import { Icon } from '../atoms/Icon';
import { Column } from '@ui/layout/Column';

const meta = {
  component: TrendItem,
  tags: ['ai-generated'],
} satisfies Meta<typeof TrendItem>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { label: 'Bench Press', value: '↑ 5 kg' },
};

export const WithTrailing: Story = {
  args: { label: 'Squat', value: '↑ 10 kg', trailing: <Icon name="trend-up" size="sm" /> },
};

export const Stacked: Story = {
  args: { label: '', value: '' },
  render: () => (
    <Column gap={2}>
      <TrendItem label="Bench Press" value="+5 kg" trailing={<Icon name="trend-up" size="sm" />} />
      <TrendItem label="Squat" value="+10 kg" trailing={<Icon name="trend-up" size="sm" />} />
      <TrendItem label="Deadlift" value="0 kg" trailing={<Icon name="minus" size="sm" />} />
    </Column>
  ),
};
