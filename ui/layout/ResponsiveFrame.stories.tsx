import type { Meta, StoryObj } from '@storybook/react-vite';
import { Surface, Text } from '@ui/atoms';
import { Stack } from './Stack';
import { ResponsiveFrame } from './ResponsiveFrame';

const meta = {
  title: 'Layout/ResponsiveFrame',
  component: ResponsiveFrame,
} satisfies Meta<typeof ResponsiveFrame>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ContentWidth: Story = {
  args: {
    maxWidth: 'content',
    children: (
      <Surface>
        <Stack>
          <Text as="h3">Content frame</Text>
          <Text color="muted">Constrained page content with tokenized side padding.</Text>
        </Stack>
      </Surface>
    ),
  },
};

export const DeviceModes: Story = {
  args: {
    maxWidth: 'none',
    children: (
    <Stack>
      <ResponsiveFrame mode="mobile" maxWidth="none"><Surface>Mobile mode</Surface></ResponsiveFrame>
      <ResponsiveFrame mode="tablet"><Surface>Tablet mode</Surface></ResponsiveFrame>
      <ResponsiveFrame mode="desktop"><Surface>Desktop mode</Surface></ResponsiveFrame>
    </Stack>
    ),
  },
};
