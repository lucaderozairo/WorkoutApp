import type { Meta, StoryObj } from '@storybook/react-vite';
import { Activity } from 'lucide-react';
import { FloatingPanel } from './FloatingPanel';
import { Button } from './Button';
import { Layered } from '../layout/Layered';
import { Column } from '../layout/Column';
import { Text } from '../atoms/Text';

const meta = {
  component: FloatingPanel,
  tags: ['ai-generated'],
} satisfies Meta<typeof FloatingPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const OnMapWorkspace: Story = {
  args: { children: null },
  render: () => (
    <Layered className="map-workspace" style={{ minHeight: 280 }}>
      <div className="map-placeholder" aria-label="Map canvas" />
      <FloatingPanel pin="top-left">
        <Column gap={1}>
          <Text size="caption" color="muted">Route summary</Text>
          <Text size="detail" mono bold>8.42 km</Text>
          <Button variant="primary" size="sm" leading={<Activity size={14} aria-hidden="true" />}>Start route</Button>
        </Column>
      </FloatingPanel>
    </Layered>
  ),
};
