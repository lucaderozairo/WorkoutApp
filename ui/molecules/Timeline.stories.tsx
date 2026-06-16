import type { Meta, StoryObj } from '@storybook/react-vite';
import { Badge } from './Badge';
import { Timeline, TimelineItem } from './Timeline';
import { StoryPanel } from '../storybook/storyData';

const meta = {
  component: Timeline,
  tags: ['ai-generated'],
  decorators: [(Story) => <StoryPanel><Story /></StoryPanel>],
} satisfies Meta<typeof Timeline>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SessionEvents: Story = {
  args: { children: null },
  render: () => (
    <Timeline>
      <TimelineItem time="06:10" title="Warm-up" description="Easy spin and mobility" />
      <TimelineItem time="06:28" title="Main set" description="4 x 8 min threshold" trailing={<Badge tone="warn">RPE 8</Badge>} />
      <TimelineItem time="07:16" title="Cooldown" description="10 min easy" />
    </Timeline>
  ),
};
