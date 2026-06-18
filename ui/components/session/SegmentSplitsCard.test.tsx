import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { SegmentSplitsCard } from './SegmentSplitsCard';

it('renders target and actual pace columns with matching pace', () => {
  render(
    <SegmentSplitsCard
      segments={[{ fromKm: 0, toKm: 2, paceSecPerKm: 300 }]}
      cardioSets={[{ distanceMeters: 2000, durationSeconds: 600 }]}
    />
  );
  const paces = screen.getAllByText('5:00');
  expect(paces).toHaveLength(2);
  expect(screen.getByText('0s')).toBeInTheDocument();
});

it('shows dash for missing actual data and diff', () => {
  render(
    <SegmentSplitsCard
      segments={[{ fromKm: 0, toKm: 2, paceSecPerKm: 300 }]}
      cardioSets={[]}
    />
  );
  const dashes = screen.getAllByText('—');
  expect(dashes).toHaveLength(2);
});
