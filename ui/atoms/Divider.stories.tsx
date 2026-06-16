import type { Meta, StoryObj } from '@storybook/react-vite';
import { Divider } from './Divider';
import { Column } from '@ui/layout/Column';

const meta = {
  component: Divider,
  tags: ['ai-generated'],
} satisfies Meta<typeof Divider>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
  render: () => (
    <Column>
      <span>Above</span>
      <Divider />
      <span>Below</span>
    </Column>
  ),
};
