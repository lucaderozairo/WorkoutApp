import type { Meta, StoryObj } from '@storybook/react-vite';
import { Dot } from './Dot';
import { Row } from '@ui/layout/Row';
import { Cluster } from '@ui/layout/Cluster';

const meta = {
  component: Dot,
  tags: ['ai-generated'],
} satisfies Meta<typeof Dot>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Active: Story = {
  args: { active: true },
};

export const Inactive: Story = {
  args: { active: false },
};

export const Small: Story = {
  args: { size: 'sm', active: true },
};

export const Colored: Story = {
  args: { color: 'c-strength', active: true },
};

export const Palette: Story = {
  render: () => (
    <Cluster gap={2}>
      <Dot color="c-strength" active />
      <Dot color="c-cardio" active />
      <Dot color="c-recovery" active />
      <Dot color="c-nutrition" active />
      <Dot color="c-water" active />
      <Dot color="c-mind" active />
    </Cluster>
  ),
};
