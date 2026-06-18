import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { HeartStatsWidget, SleepWidget, ReadinessRecoveryWidget } from './DashboardMiniWidgets';

describe('HeartStatsWidget', () => {
  it('sm size shows "HR" as the bpm label', () => {
    render(<HeartStatsWidget size="sm" bpm={58} hrv={72} history={[]} />);
    expect(screen.getByText('HR')).toBeInTheDocument();
    expect(screen.queryByText('Resting HR')).not.toBeInTheDocument();
    expect(screen.getByText('HRV')).toBeInTheDocument();
  });

  it('wide size shows "Resting HR" as the bpm label', () => {
    render(<HeartStatsWidget size="wide" bpm={58} hrv={72} history={[]} />);
    expect(screen.getByText('Resting HR')).toBeInTheDocument();
  });

  it('lg (default) size shows "Resting HR" as the bpm label', () => {
    render(<HeartStatsWidget size="lg" bpm={58} hrv={72} history={[]} />);
    expect(screen.getByText('Resting HR')).toBeInTheDocument();
  });

  it('renders a dash when bpm or hrv is null', () => {
    render(<HeartStatsWidget size="sm" bpm={null} hrv={null} history={[]} />);
    expect(screen.getAllByText('—')).toHaveLength(2);
  });
});

describe('SleepWidget', () => {
  const session = {
    start: new Date('2026-06-18T23:00:00'),
    end: new Date('2026-06-19T07:00:00'),
    score: 88,
    stages: { deep: 90, light: 240, rem: 100, awake: 50 },
  };

  it('lg (default) size renders the score ring with duration and debt label', () => {
    render(<SleepWidget size="lg" session={session} />);
    expect(screen.getByText('8h 0m')).toBeInTheDocument();
    expect(screen.getByText(/vs goal/)).toBeInTheDocument();
  });
});

describe('ReadinessRecoveryWidget', () => {
  it('lg (default) size renders the score ring with recovery detail and tip', () => {
    render(<ReadinessRecoveryWidget size="lg" score={91} scoreClass="good" />);
    expect(screen.getByText('Well recovered. Ready to train hard.')).toBeInTheDocument();
    expect(screen.getByText('You can push hard today — HRV and sleep support it.')).toBeInTheDocument();
  });
});
