import type { Meta, StoryObj } from '@storybook/react-vite';
import { ExpandableCard } from './ExpandableCard';
import { Text } from '../atoms/Text';

const meta = {
  component: ExpandableCard,
  tags: ['ai-generated'],
} satisfies Meta<typeof ExpandableCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    header: <Text bold>Session Details</Text>,
    children: (
      <Text size="detail" color="muted">
        This contains the detailed breakdown of your training session including sets, reps, and notes.
      </Text>
    ),
  },
};

export const WithFooter: Story = {
  args: {
    header: <Text bold>Notes</Text>,
    children: <Text size="detail">Additional observations from today&apos;s session.</Text>,
    footer: <Text size="caption" color="muted">Last edited 2h ago</Text>,
  },
};
