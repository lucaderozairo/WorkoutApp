import type { Meta, StoryObj } from '@storybook/react-vite';
import { Row } from '@ui/layout';
import { CategoryIcon } from './CategoryIcon';

const meta = {
  component: CategoryIcon,
  tags: ['ai-generated'],
} satisfies Meta<typeof CategoryIcon>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Strength: Story = {
  args: { category: 'strength', size: 24 },
};

export const Set: Story = {
  args: { category: 'strength' },
  render: () => (
    <Row gap={3} align="center">
      <CategoryIcon category="strength" size={24} />
      <CategoryIcon category="cardio" size={24} />
      <CategoryIcon category="mobility" size={24} />
    </Row>
  ),
};
