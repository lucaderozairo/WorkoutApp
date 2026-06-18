import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { SegmentGuide } from './SegmentGuide';

const segments = [
  { fromKm: 0, toKm: 2, paceSecPerKm: 300 },
  { fromKm: 2, toKm: 5, paceSecPerKm: 280 },
];

it('shows segment 1 target when distance is 0', () => {
  render(<SegmentGuide segments={segments} completedDistanceKm={0} elapsedSeconds={0} />);
  expect(screen.getByText(/Segment 1/i)).toBeInTheDocument();
  expect(screen.getByText(/5:00.*km/)).toBeInTheDocument();
});

it('advances to segment 2 once past 2 km', () => {
  render(<SegmentGuide segments={segments} completedDistanceKm={2.1} elapsedSeconds={620} />);
  expect(screen.getByText(/Segment 2/i)).toBeInTheDocument();
});
