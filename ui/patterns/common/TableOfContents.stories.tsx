import type { Meta, StoryObj } from '@storybook/react-vite';
import { TableOfContents } from './TableOfContents';
import { StoryPanel } from '../../storybook/storyData';

const meta = {
  component: TableOfContents,
  tags: ['ai-generated'],
  decorators: [(Story) => <StoryPanel maxWidth={280}><Story /></StoryPanel>],
} satisfies Meta<typeof TableOfContents>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    activeId: 'readiness',
    items: [
      { id: 'overview', label: 'Overview' },
      { id: 'readiness', label: 'Readiness', level: 2 },
      { id: 'history', label: 'History', level: 2 },
    ],
  },
};
