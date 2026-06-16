import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Row } from '@ui/layout';
import { Button } from './Button';
import { Text } from '@ui/atoms';

interface PaginationProps {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  label?: string;
}

export function Pagination({ page, pageCount, onPageChange, label = 'Pagination' }: PaginationProps) {
  const current = Math.min(pageCount, Math.max(1, page));

  return (
    <Row as="nav" align="center" justify="between" gap={2} className="pagination" aria-label={label}>
      <Button type="button" variant="secondary" size="sm" disabled={current <= 1} leading={<ChevronLeft size={14} aria-hidden="true" />} onClick={() => onPageChange(current - 1)}>
        Previous
      </Button>
      <Text as="span" size="caption" color="muted" aria-live="polite">
        Page {current} of {pageCount}
      </Text>
      <Button type="button" variant="secondary" size="sm" disabled={current >= pageCount} trailing={<ChevronRight size={14} aria-hidden="true" />} onClick={() => onPageChange(current + 1)}>
        Next
      </Button>
    </Row>
  );
}
