import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ExerciseSearchFilter } from './ExerciseSearchFilter';
import { DEFAULT_FILTERS } from '@ui/components/log/SessionFilterBar';

describe('ExerciseSearchFilter', () => {
  it('shows matching suggestions while focused and typing', () => {
    render(
      <ExerciseSearchFilter
        filters={DEFAULT_FILTERS}
        onChange={vi.fn()}
        exerciseOptions={['Bench Press', 'Back Squat', 'Deadlift']}
      />
    );

    const input = screen.getByPlaceholderText('Search exercises…');
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'b' } });

    expect(screen.getByText('Bench Press')).toBeInTheDocument();
    expect(screen.getByText('Back Squat')).toBeInTheDocument();
    expect(screen.queryByText('Deadlift')).not.toBeInTheDocument();
  });

  it('selects a suggestion and clears the search text', () => {
    const onChange = vi.fn();
    render(
      <ExerciseSearchFilter
        filters={DEFAULT_FILTERS}
        onChange={onChange}
        exerciseOptions={['Bench Press']}
      />
    );

    const input = screen.getByPlaceholderText('Search exercises…');
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'bench' } });
    fireEvent.mouseDown(screen.getByText('Bench Press'));

    expect(onChange).toHaveBeenCalledWith({ ...DEFAULT_FILTERS, exercise: 'Bench Press' });
  });

  it('shows a removable chip when an exercise is already selected', () => {
    const onChange = vi.fn();
    render(
      <ExerciseSearchFilter
        filters={{ ...DEFAULT_FILTERS, exercise: 'Bench Press' }}
        onChange={onChange}
        exerciseOptions={['Bench Press']}
      />
    );

    fireEvent.click(screen.getByText('Bench Press'));
    expect(onChange).toHaveBeenCalledWith({ ...DEFAULT_FILTERS, exercise: '' });
  });
});
