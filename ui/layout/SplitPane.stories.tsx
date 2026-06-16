import type { Meta, StoryObj } from '@storybook/react-vite';
import { Surface, Text } from '@ui/atoms';
import { Stack } from './Stack';
import { SplitPane } from './SplitPane';

const meta = {
  title: 'Layout/SplitPane',
  component: SplitPane,
} satisfies Meta<typeof SplitPane>;

export default meta;
type Story = StoryObj<typeof meta>;

const list = (
  <Surface>
    <Stack>
      <Text as="h3">Sessions</Text>
      <Text color="muted">Mon, Tue, Thu, Sat</Text>
    </Stack>
  </Surface>
);

const detail = (
  <Surface>
    <Stack>
      <Text as="h3">Tempo run</Text>
      <Text color="muted">Longer content stays in the detail pane on desktop and becomes a focused pane on mobile.</Text>
    </Stack>
  </Surface>
);

export const SidebarMain: Story = {
  args: {
    primary: list,
    secondary: detail,
  },
};

export const TabletCollapse: Story = {
  args: {
    primary: list,
    secondary: detail,
    collapseAt: 'tablet',
    defaultPane: 'secondary',
  },
};
