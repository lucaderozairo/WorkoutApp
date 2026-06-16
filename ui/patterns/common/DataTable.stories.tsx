import type { Meta, StoryObj } from '@storybook/react-vite';
import { DataTable } from './DataTable';
import { trainingRows } from '../../storybook/storyData';

const columns = [
  { key: 'session', header: 'Session', render: (row: (typeof trainingRows)[number]) => row.session },
  { key: 'duration', header: 'Duration', mono: true, render: (row: (typeof trainingRows)[number]) => row.duration },
  { key: 'load', header: 'Load', align: 'right' as const, mono: true, render: (row: (typeof trainingRows)[number]) => row.load },
  { key: 'status', header: 'Status', render: (row: (typeof trainingRows)[number]) => row.status },
];

const meta = {
  component: DataTable<typeof trainingRows[number]>,
  tags: ['ai-generated'],
} satisfies Meta<typeof DataTable<typeof trainingRows[number]>>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Populated: Story = {
  args: {
    columns,
    rows: trainingRows,
    getRowKey: (row) => row.id,
  },
};

export const Empty: Story = {
  args: {
    columns,
    rows: [],
    getRowKey: (row, index) => row.id || String(index),
    emptyMessage: 'No sessions match this filter.',
  },
};

export const Loading: Story = {
  args: {
    columns,
    rows: [],
    getRowKey: (row, index) => row.id || String(index),
    loading: true,
  },
};
