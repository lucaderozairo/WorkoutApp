import type { Meta, StoryObj } from '@storybook/react-vite';
import { Surface, Text } from '@ui/atoms';
import { Grid } from './Grid';
import { GridItem } from './GridItem';

const meta = {
  component: GridItem,
  tags: ['ai-generated'],
} satisfies Meta<typeof GridItem>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Spanning: Story = {
  args: { children: null },
  render: () => (
    <Grid variant="double">
      <GridItem colSpan={2}>
        <Surface pad="sm"><Text>Full-width summary</Text></Surface>
      </GridItem>
      <GridItem>
        <Surface pad="sm"><Text>Plan</Text></Surface>
      </GridItem>
      <GridItem>
        <Surface pad="sm"><Text>Actual</Text></Surface>
      </GridItem>
    </Grid>
  ),
};
