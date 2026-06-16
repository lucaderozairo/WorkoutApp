import type { Meta, StoryObj } from '@storybook/react-vite';
import { Chip } from './Chip';
import { Cluster } from '@ui/layout/Cluster';

const meta = {
  component: Chip,
  tags: ['ai-generated'],
} satisfies Meta<typeof Chip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { children: 'Strength' },
};

export const Active: Story = {
  args: { active: true, children: 'Cardio' },
};

export const Source: Story = {
  args: { source: true, children: 'Strava' },
};

export const WithLeading: Story = {
  args: { leading: '★', children: 'Favorite' },
};

export const WithTrailing: Story = {
  args: { children: 'Filter', trailing: '×' },
};

export const ChipRow: Story = {
  args: { children: '' },
  render: () => (
    <Cluster gap={1}>
      <Chip>All</Chip>
      <Chip active>Strength</Chip>
      <Chip>Cardio</Chip>
      <Chip>Flexibility</Chip>
      <Chip source>Imported</Chip>
    </Cluster>
  ),
};
