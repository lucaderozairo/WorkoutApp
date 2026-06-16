import type { Meta, StoryObj } from '@storybook/react-vite';
import { Overlay } from './Overlay';

const meta = {
  component: Overlay,
  tags: ['ai-generated'],
} satisfies Meta<typeof Overlay>;

export default meta;
type Story = StoryObj<typeof meta>;

export const TopLeft: Story = {
  args: { pin: 'top-left', children: <span style={{ background: 'var(--surface-2)', padding: '4px 8px', borderRadius: 4 }}>Top-left badge</span> },
};

export const BottomRight: Story = {
  args: { pin: 'bottom-right', children: <span style={{ background: 'var(--surface-2)', padding: '4px 8px', borderRadius: 4 }}>Bottom-right</span> },
};

export const Center: Story = {
  args: { pin: 'center', children: <span style={{ background: 'var(--accent)', color: '#fff', padding: '8px 16px', borderRadius: 8 }}>Centered</span> },
};
