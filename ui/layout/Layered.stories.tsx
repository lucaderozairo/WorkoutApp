import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '@ui/molecules/Button';
import { Layer, Layered } from './Layered';

const meta = {
  component: Layered,
  tags: ['ai-generated'],
} satisfies Meta<typeof Layered>;

export default meta;
type Story = StoryObj<typeof meta>;

export const MapControls: Story = {
  args: { children: null },
  render: () => (
    <Layered className="map-workspace" style={{ minHeight: 260 }}>
      <div className="map-placeholder" aria-label="Map canvas" />
      <Layer pin="top-left" z="controls"><Button size="sm" variant="secondary">Layers</Button></Layer>
      <Layer pin="bottom-right" z="controls"><Button size="sm" variant="primary">Save route</Button></Layer>
    </Layered>
  ),
};
