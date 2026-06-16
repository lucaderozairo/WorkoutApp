import type { Meta, StoryObj } from '@storybook/react-vite';
import { FloatingToolbar } from './FloatingToolbar';
import { Layered } from '../layout/Layered';
import { toolbarButtons } from '../storybook/storyData';

const meta = {
  component: FloatingToolbar,
  tags: ['ai-generated'],
} satisfies Meta<typeof FloatingToolbar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const BottomCenter: Story = {
  args: { children: null },
  render: () => (
    <Layered className="map-workspace" style={{ minHeight: 280 }}>
      <div className="map-placeholder" aria-label="Map canvas" />
      <FloatingToolbar aria-label="Route tools">{toolbarButtons}</FloatingToolbar>
    </Layered>
  ),
};
