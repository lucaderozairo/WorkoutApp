import type { Meta, StoryObj } from '@storybook/react-vite';
import { Surface, Text } from '@ui/atoms';
import { Stack } from './Stack';

const meta = {
  title: 'Layout/Stack',
  component: Stack,
} satisfies Meta<typeof Stack>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: (
      <>
      <Text as="h3">Readiness factors</Text>
      <Text color="muted">Sleep, resting heart rate, and recent load share the same vertical rhythm.</Text>
      <Surface variant="flat">Compact content block</Surface>
      </>
    ),
  },
};

export const Dense: Story = {
  args: {
    gap: 2,
    children: (
      <>
      <Text size="caption" color="muted">SHORT CONTENT</Text>
      <Text>Use smaller gaps for metadata groups.</Text>
      </>
    ),
  },
};
