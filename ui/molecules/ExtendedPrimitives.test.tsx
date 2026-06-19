import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { IconFrame, StatusDot } from '@ui/atoms';
import {
  ColorPicker,
  DataValue,
  Dropdown,
  NumericStepper,
  PageControl,
  Pagination,
  SearchInput,
  TimePicker,
} from './index';

describe('extended atom primitives', () => {
  it('renders status dots, icon frames, and data values with semantic classes', () => {
    render(
      <>
        <StatusDot tone="online" label="Online" />
        <IconFrame tone="accent">A</IconFrame>
        <DataValue value={42} unit="km" variant="distance" />
      </>,
    );

    expect(screen.getByLabelText('Online')).toHaveClass('status-dot', 'status-online');
    expect(screen.getByText('A')).toHaveClass('icon-frame');
    expect(screen.getByText('A')).toHaveAttribute('data-tone', 'accent');
    expect(screen.getByText('42').closest('.metric')).toHaveClass('data-value', 'data-value-distance');
  });
});

describe('extended molecule primitives', () => {
  it('search input composes search and clear controls', () => {
    const onClear = vi.fn();
    render(<SearchInput label="Find exercises" value="squat" onClear={onClear} onChange={() => {}} />);

    expect(screen.getByLabelText('Find exercises')).toHaveAttribute('type', 'search');
    fireEvent.click(screen.getByRole('button', { name: 'Clear search' }));
    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it('numeric stepper clamps changes', () => {
    const onChange = vi.fn();
    render(<NumericStepper label="Sets" value={2} min={1} max={3} onChange={onChange} />);

    fireEvent.click(screen.getByRole('button', { name: 'Increase value' }));
    expect(onChange).toHaveBeenCalledWith(3);

    fireEvent.click(screen.getByRole('button', { name: 'Decrease value' }));
    expect(onChange).toHaveBeenCalledWith(1);
  });

  it('page controls and pagination emit page changes', () => {
    const onPage = vi.fn();
    render(
      <>
        <PageControl count={3} index={1} onChange={onPage} />
        <Pagination page={2} pageCount={3} onPageChange={onPage} />
      </>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Go to page 3' }));
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));

    expect(onPage).toHaveBeenCalledWith(2);
    expect(onPage).toHaveBeenCalledWith(3);
  });

  it('dropdown renders trigger and items', () => {
    render(<Dropdown trigger="More" items={[{ label: 'Archive', onClick: vi.fn() }]} />);

    expect(document.querySelector('.dropdown')).toHaveClass('menu-popover');
    expect(document.querySelector('.dropdown')).toHaveTextContent('Archive');
  });

  it('time and color pickers keep native input semantics', () => {
    const onValueChange = vi.fn();
    render(
      <>
        <TimePicker label="Start time" value="10:30" onChange={() => {}} />
        <ColorPicker label="Accent" value="#ff0000" swatches={['#00ff00']} onChange={() => {}} onValueChange={onValueChange} />
      </>,
    );

    expect(screen.getByLabelText('Start time')).toHaveAttribute('type', 'time');
    expect(screen.getByLabelText('Accent')).toHaveAttribute('type', 'color');
    fireEvent.click(screen.getByRole('button', { name: 'Use color #00ff00' }));
    expect(onValueChange).toHaveBeenCalledWith('#00ff00');
  });
});
