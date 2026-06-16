import type { Meta, StoryObj } from '@storybook/react-vite';
import { FloatingActionButton } from './FloatingActionButton';
import { Icon } from '../atoms/Icon';

const meta = {
  component: FloatingActionButton,
  tags: ['ai-generated'],
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof FloatingActionButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Add: Story = {
  args: { label: 'Add workout', icon: <Icon name="add" />, onClick: () => {} },
};
