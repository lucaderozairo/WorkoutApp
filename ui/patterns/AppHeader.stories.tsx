import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '@ui/molecules/Button';
import { AppHeader } from './AppHeader';
import { noop } from '../storybook/storyData';

const meta = {
  component: AppHeader,
  tags: ['ai-generated'],
} satisfies Meta<typeof AppHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const TitleOnly: Story = {
  args: { title: 'Dashboard' },
};

export const WithBackAndPrimary: Story = {
  args: {
    title: 'Session summary',
    back: noop,
    primary: <Button variant="primary" size="sm">Save</Button>,
  },
};
