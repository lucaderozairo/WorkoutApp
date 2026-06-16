import type { Meta, StoryObj } from '@storybook/react-vite';
import { Table, TableHead, TableBody, TableRow, TableCell, TableHeaderCell } from './Table';

const meta = {
  component: Table,
  tags: ['ai-generated'],
} satisfies Meta<typeof Table>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Simple: Story = {
  args: { children: null },
  render: () => (
    <Table>
      <TableHead>
        <TableRow>
          <TableHeaderCell>Exercise</TableHeaderCell>
          <TableHeaderCell align="right">Sets</TableHeaderCell>
          <TableHeaderCell align="right">Reps</TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableBody>
        <TableRow>
          <TableCell>Bench Press</TableCell>
          <TableCell align="right" mono>3</TableCell>
          <TableCell align="right" mono>10</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Squat</TableCell>
          <TableCell align="right" mono>4</TableCell>
          <TableCell align="right" mono>8</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Deadlift</TableCell>
          <TableCell align="right" mono>3</TableCell>
          <TableCell align="right" mono>5</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  ),
};

export const InteractiveRow: Story = {
  args: { children: null },
  render: () => (
    <Table>
      <TableHead>
        <TableRow>
          <TableHeaderCell>Name</TableHeaderCell>
          <TableHeaderCell align="right">PR</TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableBody>
        <TableRow interactive onClick={() => {}}>
          <TableCell>Bench Press</TableCell>
          <TableCell align="right" mono>100 kg</TableCell>
        </TableRow>
        <TableRow interactive onClick={() => {}}>
          <TableCell>Squat</TableCell>
          <TableCell align="right" mono>140 kg</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  ),
};
