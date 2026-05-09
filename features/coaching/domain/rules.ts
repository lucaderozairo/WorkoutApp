import type { CoachingInsight, InsightType } from './types';
import type { Id } from '@shared/types';

function makeId(): Id<'Insight'> {
  return crypto.randomUUID() as unknown as Id<'Insight'>;
}

function insight(
  type: InsightType,
  title: string,
  message: string,
  relatedEntityId?: string,
): CoachingInsight {
  return {
    id: makeId(),
    type,
    title,
    message,
    createdAt: Date.now(),
    dismissed: false,
    relatedEntityId,
  };
}

/** Returns a warning if acute:chronic load ratio > 1.5. Returns null if safe or no data. */
export function makeTrainingLoadInsight(ratio: number): CoachingInsight | null {
  if (ratio === 0 || ratio < 1.5) return null;
  return insight(
    'warning',
    'High training load',
    `Your acute:chronic load ratio is ${ratio.toFixed(1)} — consider a recovery session or rest day to avoid overtraining.`,
  );
}

/** Returns a suggestion if the named exercise has hit a plateau. */
export function makePlateauInsight(exerciseName: string, plateauDetected: boolean): CoachingInsight | null {
  if (!plateauDetected) return null;
  return insight(
    'suggestion',
    'Progression plateau detected',
    `${exerciseName} volume hasn't increased meaningfully over the last 3 sessions. Try varying reps, adding a technique session, or introducing a deload before pushing harder.`,
    exerciseName,
  );
}

export interface DeloadSignals {
  highLoadDays: number;   // days in last 7 with acute:chronic > 1.3
  highRpeStreak: number;  // consecutive sessions with sessionRpe >= 8
  adherenceRate: number;  // 0-1, from plan adherence projection
}

/** Returns a deload warning when all three signals align. */
export function makeDeloadInsight(signals: DeloadSignals): CoachingInsight | null {
  const { highLoadDays, highRpeStreak, adherenceRate } = signals;
  if (highLoadDays >= 5 && highRpeStreak >= 3 && adherenceRate < 0.6) {
    return insight(
      'warning',
      'Deload week recommended',
      "You've had a sustained high-load week with elevated RPE and some missed sessions. A deload week will help you recover and come back stronger.",
    );
  }
  return null;
}
