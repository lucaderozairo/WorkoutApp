import type { Meta, StoryObj } from '@storybook/react-vite';
import { Row } from '@ui/layout';
import { SportIcon } from './SportIcon';

const meta = {
  component: SportIcon,
  tags: ['ai-generated'],
} satisfies Meta<typeof SportIcon>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Run: Story = {
  args: { sport: 'run', size: 24 },
};

export const Set: Story = {
  args: { sport: 'run' },
  render: () => (
    <Row gap={3} align="center">
      <SportIcon sport="run" size={24} />
      <SportIcon sport="bike" size={24} />
      <SportIcon sport="strength" size={24} />
      <SportIcon sport="other" size={24} />
    </Row>
  ),
};
