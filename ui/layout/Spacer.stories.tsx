import type { Meta, StoryObj } from '@storybook/react-vite';
import { Spacer } from './Spacer';
import { Row } from './Row';

const meta = {
  component: Spacer,
  tags: ['ai-generated'],
} satisfies Meta<typeof Spacer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const BetweenElements: Story = {
  render: () => (
    <Row>
      <span>Left</span>
      <Spacer />
      <span>Right</span>
    </Row>
  ),
};
