import type { Meta, StoryObj } from '@storybook/react-vite';
import { MultiSegmentBar } from './MultiSegmentBar';

const meta = {
  component: MultiSegmentBar,
  tags: ['ai-generated'],
} satisfies Meta<typeof MultiSegmentBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SleepBreakdown: Story = {
  args: {
    segments: [
      { pct: 30, color: 'color-sleep-awake', label: 'Awake' },
      { pct: 25, color: 'color-sleep-light', label: 'Light' },
      { pct: 25, color: 'color-sleep-deep', label: 'Deep' },
      { pct: 20, color: 'color-sleep-rem', label: 'REM' },
    ],
    'aria-label': 'Sleep stages',
  },
};

export const TwoSegments: Story = {
  args: {
    segments: [
      { pct: 65, color: 'ok', label: 'Carbs' },
      { pct: 35, color: 'c-strength', label: 'Protein' },
    ],
  },
};

export const SingleSegment: Story = {
  args: {
    segments: [
      { pct: 100, color: 'ok', label: 'Complete' },
    ],
  },
};

export const Small: Story = {
  args: {
    size: 'sm',
    segments: [
      { pct: 40, color: 'warn', label: 'Used' },
      { pct: 60, color: 'c-recovery', label: 'Remaining' },
    ],
  },
};
