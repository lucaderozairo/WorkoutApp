import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '@ui/molecules/Button';
import { Layer } from './Layered';
import { OverlayContainer } from './OverlayContainer';

const meta = {
  component: OverlayContainer,
  tags: ['ai-generated'],
} satisfies Meta<typeof OverlayContainer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Controls: Story = {
  args: {
    children: (
      <>
        <div className="map-placeholder" aria-label="Map canvas" />
        <Layer pin="center"><Button variant="primary">Resume session</Button></Layer>
      </>
    ),
  },
};
