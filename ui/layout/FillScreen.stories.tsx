import type { Meta, StoryObj } from '@storybook/react-vite';
import { FillScreen } from './FillScreen';

const meta = {
  component: FillScreen,
  tags: ['ai-generated'],
} satisfies Meta<typeof FillScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { children: <div style={{ padding: 16, textAlign: 'center' }}>Fills available height</div> },
};
