import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  Surface,
  Table,
  TableBody,
  TableCaption,
  TableHeader,
  TableHeaderCell,
  TableRow,
  TableCell,
} from './index';

describe('Surface', () => {
  it('maps padding and promoted variants to component classes', () => {
    render(
      <>
        <Surface pad="xs">Compact</Surface>
        <Surface variant="inset">Drop zone</Surface>
        <Surface variant="pinned">Pinned</Surface>
      </>,
    );

    expect(screen.getByText('Compact')).toHaveClass('surface', 'pad-xs');
    expect(screen.getByText('Drop zone')).toHaveClass('surface', 'inset');
    expect(screen.getByText('Pinned')).toHaveClass('surface', 'pinned');
  });
});

describe('Table', () => {
  it('renders a complete table primitive structure', () => {
    render(
      <Table>
        <TableCaption>Recent sets</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHeaderCell>Load</TableHeaderCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell mono>100</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );

    expect(screen.getByRole('table')).toHaveTextContent('Recent sets');
    expect(screen.getByRole('columnheader', { name: 'Load' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: '100' })).toHaveClass('mono');
  });
});
