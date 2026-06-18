import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { WorkoutFilterBar } from './WorkoutFilterBar';
import { DEFAULT_FILTERS } from '@ui/components/log/SessionFilterBar';

describe('WorkoutFilterBar', () => {
  it('opens the filter popover and shows all three panels', () => {
    render(
      <WorkoutFilterBar
        filters={DEFAULT_FILTERS}
        onChange={vi.fn()}
        exerciseOptions={['Bench Press']}
        view="list"
      />
    );

    fireEvent.click(screen.getByText('Filters'));

    expect(screen.getByText('Date range')).toBeInTheDocument();
    expect(screen.getByText('Workout type')).toBeInTheDocument();
    expect(screen.getByText('Exercise')).toBeInTheDocument();
  });

  it('shows an active-filter chip and a badge count when a type filter is applied', () => {
    render(
      <WorkoutFilterBar
        filters={{ ...DEFAULT_FILTERS, type: 'run' }}
        onChange={vi.fn()}
        exerciseOptions={[]}
        view="list"
      />
    );

    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('Run')).toBeInTheDocument();
  });

  it('clears all filters via the clear-all button', () => {
    const onChange = vi.fn();
    render(
      <WorkoutFilterBar
        filters={{ ...DEFAULT_FILTERS, type: 'run', exercise: 'Bench Press' }}
        onChange={onChange}
        exerciseOptions={[]}
        view="list"
      />
    );

    fireEvent.click(screen.getByText('Filters'));
    fireEvent.click(screen.getByText('Clear all'));

    expect(onChange).toHaveBeenCalledWith({
      ...DEFAULT_FILTERS,
      type: 'all', exercise: '', dateRange: 'all',
      dateFrom: '', dateTo: '', sort: 'newest',
    });
  });
});
