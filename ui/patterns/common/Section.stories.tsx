import type { Meta, StoryObj } from '@storybook/react-vite';
import { Surface, Text } from '@ui/atoms';
import { Section } from './Section';
import { noop } from '../../storybook/storyData';

const meta = {
  component: Section,
  tags: ['ai-generated'],
} satisfies Meta<typeof Section>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithAction: Story = {
  args: {
    label: 'Readiness',
    action: { label: 'View trend', onClick: noop },
    children: (
      <Surface pad="sm">
        <Text size="detail">HRV, sleep, and training load are inside normal range.</Text>
      </Surface>
    ),
  },
};

export const Loading: Story = {
  args: {
    label: 'Loading',
    children: null,
  },
  render: () => <Section.Skeleton labelSurface="ghost" action />,
};
