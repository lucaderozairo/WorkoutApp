import type { Meta, StoryObj } from '@storybook/react-vite';
import { Surface, Text } from '@ui/atoms';
import { Stack } from '@ui/layout';
import { FeedLayout } from './FeedLayout';

const meta = {
  title: 'Patterns/FeedLayout',
  component: FeedLayout,
} satisfies Meta<typeof FeedLayout>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    feed: (
      <Stack>
        {['Morning run', 'Strength block', 'Club event'].map((item) => (
          <Surface key={item}><Text as="h3">{item}</Text></Surface>
        ))}
      </Stack>
    ),
    aside: <Surface><Text as="h3">Context</Text></Surface>,
  },
};
