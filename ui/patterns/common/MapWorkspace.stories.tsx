import type { Meta, StoryObj } from '@storybook/react-vite';
import { Surface, Text } from '@ui/atoms';
import { Button } from '@ui/molecules';
import { Stack } from '@ui/layout';
import { MapWorkspace } from './MapWorkspace';

const meta = {
  title: 'Patterns/MapWorkspace',
  component: MapWorkspace,
} satisfies Meta<typeof MapWorkspace>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    panel: (
      <Surface variant="ghost">
        <Stack>
          <Text as="h3">Route controls</Text>
          <Text color="muted">Panel becomes a bottom region on mobile.</Text>
        </Stack>
      </Surface>
    ),
    map: <div className="grid place-center h-full">Map surface</div>,
    tools: <Button size="sm">Save route</Button>,
  },
};
