import type { Meta, StoryObj } from '@storybook/react-vite';
import { FullScreen } from './FullScreen';

const meta = {
  component: FullScreen,
  tags: ['ai-generated'],
} satisfies Meta<typeof FullScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { children: <div style={{ padding: 16, textAlign: 'center' }}>Full screen container</div> },
};
