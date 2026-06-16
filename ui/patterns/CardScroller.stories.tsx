import type { Meta, StoryObj } from '@storybook/react-vite';
import { Surface, Text } from '@ui/atoms';
import { CardScroller } from './CardScroller';

const meta = {
  component: CardScroller,
  tags: ['ai-generated'],
} satisfies Meta<typeof CardScroller>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: ['Readiness', 'Sleep', 'Load', 'Volume'].map((label) => (
      <Surface key={label} pad="sm" className="min-w-0" style={{ minWidth: 180 }}>
        <Text size="caption" color="muted">{label}</Text>
        <Text as="p" size="detail" mono bold>82</Text>
      </Surface>
    )),
  },
};
