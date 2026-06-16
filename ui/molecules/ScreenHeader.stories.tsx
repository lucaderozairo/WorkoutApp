import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from './Button';
import { ScreenHeader } from './ScreenHeader';
import { noop } from '../storybook/storyData';

const meta = {
  component: ScreenHeader,
  tags: ['ai-generated'],
} satisfies Meta<typeof ScreenHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const TitleOnly: Story = {
  args: { title: 'Session detail' },
};

export const WithBackAndAction: Story = {
  args: {
    title: 'Edit session',
    back: noop,
    primary: <Button variant="primary" size="sm">Save</Button>,
  },
};
