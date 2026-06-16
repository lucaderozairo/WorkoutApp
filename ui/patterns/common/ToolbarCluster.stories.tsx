import type { Meta, StoryObj } from '@storybook/react-vite';
import { ToolbarCluster } from './ToolbarCluster';
import { toolbarButtons } from '../../storybook/storyData';

const meta = {
  component: ToolbarCluster,
  tags: ['ai-generated'],
} satisfies Meta<typeof ToolbarCluster>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Actions: Story = {
  args: { label: 'Session actions', children: toolbarButtons },
};
