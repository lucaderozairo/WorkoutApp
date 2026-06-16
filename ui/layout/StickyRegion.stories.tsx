import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '@ui/molecules';
import { Row } from './Row';
import { Stack } from './Stack';
import { StickyRegion } from './StickyRegion';

const meta = {
  title: 'Layout/StickyRegion',
  component: StickyRegion,
} satisfies Meta<typeof StickyRegion>;

export default meta;
type Story = StoryObj<typeof meta>;

export const TopFilterBar: Story = {
  args: {
    position: 'top',
    elevated: true,
    children: (
        <Row justify="between" align="center">
          <span>Filters</span>
          <Button size="sm">Apply filters</Button>
        </Row>
    ),
  },
  render: (args) => (
    <Stack>
      <StickyRegion {...args} />
      <p>Scroll containers can keep this region pinned without screen-specific sticky CSS.</p>
    </Stack>
  ),
};
