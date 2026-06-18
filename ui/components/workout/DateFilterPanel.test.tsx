import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { DateFilterPanel } from './DateFilterPanel';
import { DEFAULT_FILTERS } from '@ui/components/log/SessionFilterBar';

describe('DateFilterPanel', () => {
  it('shows date-range chips in list view and selects one', () => {
    const onChange = vi.fn();
    render(<DateFilterPanel filters={DEFAULT_FILTERS} onChange={onChange} view="list" />);

    fireEvent.click(screen.getByText('Past 7 days'));

    expect(onChange).toHaveBeenCalledWith({
      ...DEFAULT_FILTERS,
      dateRange: '7d',
      dateFrom: '',
      dateTo: '',
    });
  });

  it('hides the date-range chip group outside list view', () => {
    render(<DateFilterPanel filters={DEFAULT_FILTERS} onChange={vi.fn()} view="month" />);
    expect(screen.queryByText('Past 7 days')).not.toBeInTheDocument();
  });

  it('expands the custom date picker and sets a from-date', () => {
    const onChange = vi.fn();
    render(<DateFilterPanel filters={DEFAULT_FILTERS} onChange={onChange} view="list" />);

    fireEvent.click(screen.getByText('Custom date'));
    const fromInput = screen.getAllByDisplayValue('')[0];
    fireEvent.change(fromInput, { target: { value: '2026-06-01' } });

    expect(onChange).toHaveBeenCalledWith({
      ...DEFAULT_FILTERS,
      dateFrom: '2026-06-01',
      dateRange: 'all',
    });
  });
});
