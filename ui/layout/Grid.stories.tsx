import type { Meta, StoryObj } from '@storybook/react-vite';
import { Grid } from './Grid';
import { GridItem } from './GridItem';

const Cell = ({ label }: { label: string }) => <div style={{ padding: 16, background: 'var(--surface-2)', borderRadius: 8, textAlign: 'center' }}>{label}</div>;

const meta = {
  component: Grid,
  tags: ['ai-generated'],
} satisfies Meta<typeof Grid>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Single: Story = {
  args: { variant: 'single', children: <Cell label="Single column" /> },
};

export const Double: Story = {
  args: { variant: 'double', children: [<Cell key="a" label="Left" />, <Cell key="b" label="Right" />] },
};

export const Triple: Story = {
  args: { variant: 'triple', children: ['A', 'B', 'C'].map(l => <Cell key={l} label={l} />) },
};

export const Quad: Story = {
  args: { variant: 'quad', children: ['A', 'B', 'C', 'D'].map(l => <Cell key={l} label={l} />) },
};

export const AutoFill: Story = {
  args: { variant: 'auto', min: 'sm', children: Array.from({ length: 6 }, (_, i) => <Cell key={i} label={`Item ${i + 1}`} />) },
};

export const Tiles: Story = {
  args: { variant: 'tiles', children: Array.from({ length: 6 }, (_, i) => <Cell key={i} label={`Tile ${i + 1}`} />) },
};

export const CustomCols: Story = {
  args: { cols: 3, gap: 3, children: Array.from({ length: 6 }, (_, i) => <Cell key={i} label={`Col ${i + 1}`} />) },
};

export const WithSpan: Story = {
  render: () => (
    <Grid variant="double">
      <GridItem colSpan={2}><Cell label="Full width header" /></GridItem>
      <Cell label="Sidebar" />
      <Cell label="Main content" />
    </Grid>
  ),
};
