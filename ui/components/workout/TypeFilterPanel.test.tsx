import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TypeFilterPanel } from './TypeFilterPanel';
import { DEFAULT_FILTERS } from '@ui/components/log/SessionFilterBar';

describe('TypeFilterPanel', () => {
  it('renders all type chips and selects one', () => {
    const onChange = vi.fn();
    render(<TypeFilterPanel filters={DEFAULT_FILTERS} onChange={onChange} />);

    fireEvent.click(screen.getByText('Run'));

    expect(onChange).toHaveBeenCalledWith({ ...DEFAULT_FILTERS, type: 'run' });
  });

  it('collapses the chip grid when the header is toggled', () => {
    render(<TypeFilterPanel filters={DEFAULT_FILTERS} onChange={vi.fn()} />);
    expect(screen.getByText('Run')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Workout type'));
    expect(screen.queryByText('Run')).not.toBeInTheDocument();
  });
});
