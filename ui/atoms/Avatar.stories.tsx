import type { Meta, StoryObj } from '@storybook/react-vite';
import { Avatar } from './Avatar';
import { Row } from '@ui/layout/Row';

const meta = {
  component: Avatar,
  tags: ['ai-generated'],
} satisfies Meta<typeof Avatar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithName: Story = {
  args: { name: 'John Doe' },
};

export const SingleName: Story = {
  args: { name: 'Alice' },
};

export const Small: Story = {
  args: { name: 'Bob Smith', size: 'sm' },
};

export const Large: Story = {
  args: { name: 'Carol Williams', size: 'lg' },
};

export const ExtraLarge: Story = {
  args: { name: 'David Brown', size: 'xl' },
};

export const WithImage: Story = {
  args: { src: 'https://i.pravatar.cc/80?img=1', name: 'Eve Davis' },
};

export const Fallback: Story = {
  args: {},
};

export const SizeRow: Story = {
  render: () => (
    <Row gap={2} align="center">
      <Avatar name="XS" size="sm" />
      <Avatar name="MD" size="md" />
      <Avatar name="LG" size="lg" />
      <Avatar name="XL" size="xl" />
    </Row>
  ),
};
