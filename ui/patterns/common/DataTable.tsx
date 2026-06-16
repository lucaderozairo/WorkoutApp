import type { ReactNode } from 'react';
import { Surface, Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow, Text } from '@ui/atoms';
import { LoadingState } from './LoadingState';

export interface DataTableColumn<T> {
  key: string;
  header: ReactNode;
  align?: 'left' | 'center' | 'right';
  mono?: boolean;
  render: (row: T) => ReactNode;
}

interface DataTableProps<T> {
  columns: Array<DataTableColumn<T>>;
  rows: T[];
  getRowKey: (row: T, index: number) => string;
  emptyMessage?: ReactNode;
  loading?: boolean;
  className?: string;
}

export function DataTable<T>({
  columns,
  rows,
  getRowKey,
  emptyMessage = 'No rows',
  loading = false,
  className,
}: DataTableProps<T>) {
  if (loading) {
    return <LoadingState state="loading" title="Loading data" skeletonRows={4} className={className} />;
  }

  if (rows.length === 0) {
    return (
      <Surface variant="flat" className={['data-table-empty', className].filter(Boolean).join(' ')}>
        <Text size="caption" color="muted">{emptyMessage}</Text>
      </Surface>
    );
  }

  return (
    <Surface pad="none" className={['data-table-panel', className].filter(Boolean).join(' ')}>
      <Table>
        <TableHead>
          <TableRow>
            {columns.map((column) => (
              <TableHeaderCell key={column.key} align={column.align}>
                {column.header}
              </TableHeaderCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row, index) => (
            <TableRow key={getRowKey(row, index)}>
              {columns.map((column) => (
                <TableCell key={column.key} align={column.align} mono={column.mono}>
                  {column.render(row)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Surface>
  );
}
