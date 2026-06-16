import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '@ui/molecules';
import { Stack } from '@ui/layout';
import { AdaptivePresentation } from './AdaptivePresentation';

const meta = {
  title: 'Patterns/AdaptivePresentation',
  component: AdaptivePresentation,
} satisfies Meta<typeof AdaptivePresentation>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ScreenToDialog: Story = {
  args: {
    open: true,
    title: 'Edit session',
    mobile: 'screen',
    tablet: 'drawer',
    desktop: 'dialog',
    onClose: () => undefined,
    children: (
      <Stack>
        <p>Mobile can take the full screen while desktop keeps context visible.</p>
        <Button>Save changes</Button>
      </Stack>
    ),
  },
};

export const LongContent: Story = {
  args: {
    open: true,
    title: 'Training notes',
    mobile: 'sheet',
    desktop: 'drawer',
    onClose: () => undefined,
    children: (
      <Stack>
        {Array.from({ length: 10 }, (_, index) => <p key={index}>Note row {index + 1}</p>)}
      </Stack>
    ),
  },
};
