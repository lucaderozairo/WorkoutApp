import type { Meta, StoryObj } from '@storybook/react-vite';
import { Surface, Text } from '@ui/atoms';
import { Column } from '@ui/layout';
import { StackedList } from './StackedList';
import { ListDetailLayout } from './ListDetailLayout';

const list = (
  <StackedList
    items={[
      { id: 'tempo', label: 'Tempo run', sublabel: 'Today, 48 min' },
      { id: 'lift', label: 'Strength A', sublabel: 'Tomorrow, 62 min' },
      { id: 'spin', label: 'Recovery spin', sublabel: 'Friday, 35 min' },
    ]}
  />
);

const detail = (
  <Surface>
    <Column gap={2}>
      <Text as="h3">Tempo run</Text>
      <Text size="caption" color="muted">4 x 8 min threshold, 2 min recovery jog.</Text>
    </Column>
  </Surface>
);

const meta = {
  component: ListDetailLayout,
  tags: ['ai-generated'],
} satisfies Meta<typeof ListDetailLayout>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { list, detail },
};
