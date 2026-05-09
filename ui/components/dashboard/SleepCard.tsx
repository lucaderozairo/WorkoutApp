import { ExpandableCard } from '@ui/components/shared/ExpandableCard';
import { ScoreRing } from '@ui/components/shared/Charts';
import { SubjectiveAndHRInputs } from './SubjectiveAndHRInputs';
import { RING_COLORS } from './dashboardUtils';
import type { TodayReadinessView } from '@features/readiness';

interface SleepCardProps {
  score: number;
  scoreClass: keyof typeof RING_COLORS;
  readiness: TodayReadinessView | null;
}

export function SleepCard({ score, scoreClass, readiness }: SleepCardProps) {
  const stroke = RING_COLORS[scoreClass];
  return (
    <ExpandableCard>
      {toggle => (
        <>
          <header className="row space-between" onClick={toggle}>
            <h3>Readiness</h3>
            <span>›</span>
          </header>
          <div className="row space-between">
            <div>
              <p className={`value ${scoreClass}`}>{score}</p>
              <span className="caption">
                {readiness?.hasEntry ? `${readiness.sleep}/10 sleep · Logged` : 'Not logged'}
              </span>
            </div>
            <ScoreRing score={score} color={stroke} subtitle="readiness" size={80} />
          </div>
          <div className="expandable column" onClick={e => e.stopPropagation()}>
            <h3>Readiness Factors</h3>
            {readiness?.hasEntry && (
              <div className="column">
                {[
                  { label: 'Sleep quality', value: readiness.sleep },
                  { label: 'Energy', value: readiness.energy },
                  { label: 'Mood', value: readiness.mood },
                  { label: 'Soreness (inv.)', value: 10 - readiness.soreness },
                ].map(factor => (
                  <div key={factor.label} className="row space-between">
                    <span className="caption">{factor.label}</span>
                    <progress value={factor.value} max={10} />
                  </div>
                ))}
              </div>
            )}
            <p>{score >= 80 ? 'Ready to train' : score >= 60 ? 'Take it easy' : 'Rest day'}</p>
            <SubjectiveAndHRInputs />
          </div>
        </>
      )}
    </ExpandableCard>
  );
}
